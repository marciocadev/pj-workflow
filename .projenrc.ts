import { awscdk } from 'projen';
import { Job, JobPermission, JobStep } from 'projen/lib/github/workflows-model';

const project = new awscdk.AwsCdkTypeScriptApp({
  cdkVersion: '2.29.1',
  defaultReleaseBranch: 'main',
  name: 'pj-workflow',
  projenrcTs: true,

  release: true,
});

const checkoutStep: JobStep = {
  name: 'Checkout',
  uses: 'actions/checkout@v3',
};
const awsCredentialStep: JobStep = {
  name: 'Configura AWS Credentials',
  uses: 'aws-actions/configure-aws-credentials@v1',
  with: {
    'aws-access-key-id': '${{ secrets.AWS_ACCESS_KEY_ID }}',
    'aws-secret-access-key': '${{ secrets.AWS_SECRET_ACCESS_KEY }}',
    'aws-region': '${{ secrets.AWS_REGION }}',
  },
};
const setupNodeStep: JobStep = {
  name: 'Set up node',
  uses: 'actions/setup-node@v3',
  with: { 'node-version': '14' },
};
const npmGlobalInstallStep: JobStep = {
  name: 'Install global dependencies',
  run: 'npm install -g aws-cdk typescript npm@latest',
};
const npmInstallStep: JobStep = {
  name: 'Install project dependencies',
  run: 'npm install --force',
};
const deploymentStep: JobStep = {
  name: 'Deploy stack',
  run: 'cdk deploy --all --require-approval never',
};
const stagingJob: Job = {
  needs: ['release_github'],
  name: 'Deploy to Staging',
  runsOn: ['ubuntu-latest'],
  environment: {
    name: 'Staging',
  },
  permissions: {
    contents: JobPermission.READ,
    deployments: JobPermission.READ,
    idToken: JobPermission.WRITE,
  },
  steps: [
    checkoutStep,
    awsCredentialStep,
    setupNodeStep,
    npmGlobalInstallStep,
    npmInstallStep,
    deploymentStep,
  ],
};

const productionJob: Job = {
  if: "github.event.inputs.release_type == 'prod'",
  needs: ['staging'],
  name: 'Deploy to Production',
  runsOn: ['ubuntu-latest'],
  environment: {
    name: 'Production',
  },
  permissions: {
    contents: JobPermission.READ,
    deployments: JobPermission.READ,
    idToken: JobPermission.WRITE,
  },
  steps: [
    checkoutStep,
    awsCredentialStep,
    setupNodeStep,
    npmGlobalInstallStep,
    npmInstallStep,
    deploymentStep,
  ],
};

const deployingWorkflow = project.github?.addWorkflow('deploying');
deployingWorkflow?.on({
  release: {
    types: ['published'],
  },
  workflowDispatch: {
    inputs: {
      releaseType: {
        description: 'Where to release (staging or prod)?',
        required: true,
        default: 'staging',
      },
    },
  },
});
deployingWorkflow?.addJobs({ staging: stagingJob });
deployingWorkflow?.addJobs({ production: productionJob });

project.synth();