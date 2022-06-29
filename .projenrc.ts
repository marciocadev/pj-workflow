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
  name: 'Deploy to Staging',
  runsOn: ['ubuntu-latest'],
  environment: {
    AWS_DEFAULT_REGION: '${{ env.AWS_DEFAULT_REGION }}',
    AWS_ACCESS_KEY_ID: '${{ env.AWS_ACCESS_KEY_ID }}',
    AWS_SECRET_ACCESS_KEY: '${{ env.AWS_SECRET_ACCESS_KEY }}',
    name: 'Staging',
  },
  permissions: {
    contents: JobPermission.READ,
    deployments: JobPermission.READ,
  },
  steps: [
    checkoutStep,
    setupNodeStep,
    npmGlobalInstallStep,
    npmInstallStep,
    deploymentStep,
  ],
};

const stagingWorkflow = project.github?.addWorkflow('staging');
stagingWorkflow?.on({
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
stagingWorkflow?.addJobs({
  staging: stagingJob,
});
project.synth();