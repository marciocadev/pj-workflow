import { awscdk } from 'projen';
import { Job, JobPermission, JobStep } from 'projen/lib/github/workflows-model';

const project = new awscdk.AwsCdkTypeScriptApp({
  cdkVersion: '2.29.1',
  defaultReleaseBranch: 'main',
  name: 'pj-workflow',
  projenrcTs: true,

  release: true,
});

const awsCredentialStep: JobStep = {
  name: 'Configura AWS Credentials',
  uses: 'aws-actions/configure-aws-credentials@v1',
  with: {
    'role-to-assume': 'arn:aws:iam::${{secrets.AWS_ACCESS_KEY_ID}}:role/github-actions-role',
    'aws-region': 'us-east-2',
  },
};
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
  // env: {
  //   AWS_DEFAULT_REGION: '${{ secrets.AWS_DEFAULT_REGION }}',
  //   AWS_ACCESS_KEY_ID: '${{ secrets.AWS_ACCESS_KEY_ID }}',
  //   AWS_SECRET_ACCESS_KEY: '${{ secrets.AWS_SECRET_ACCESS_KEY }}',
  // },
  run: 'cdk deploy --all --require-approval never',
};
const stagingJob: Job = {
  name: 'Deploy to Staging',
  runsOn: ['ubuntu-latest'],
  env: {
    AWS_DEFAULT_REGION: '${{ secrets.AWS_DEFAULT_REGION }}',
    AWS_ACCESS_KEY_ID: '${{ secrets.AWS_ACCESS_KEY_ID }}',
    // AWS_SECRET_ACCESS_KEY: '${{ secrets.AWS_SECRET_ACCESS_KEY }}',
  },
  environment: {
    name: 'Staging',
  },
  permissions: {
    contents: JobPermission.READ,
    deployments: JobPermission.READ,
  },
  steps: [
    awsCredentialStep,
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