# replace this

## add deploy to release

```ts
project.addTask('deploy:workflow', {
  exec: `cdk deploy ${project.stackNames} --require-approval never`,
});

const checkoutStep:JobStep = {
  name: 'Checkout',
  uses: 'actions/checkout@v3',
};
const setupNodeStep:JobStep = {
  name: 'Set up node',
  uses: 'actions/setup-node@v3',
  with: { 'node-version': '14' },
};
const npmGlobalInstallStep:JobStep = {
  name: 'Install global dependencies',
  run: 'npm install -g aws-cdk typescript npm@latest',
};
const npmInstallStep:JobStep = {
  name: 'Install project dependencies',
  run: 'npm install --force',
};
const deploymentStep:JobStep = {
  name: 'Deploy stack',
  run: 'npm run deploy:workflow',
};
const deployJob:Job = {
  name: 'Deploy on AWS',
  runsOn: ['ubuntu-latest'],
  permissions: {
    contents: JobPermission.READ,
    deployments: JobPermission.READ,
  },
  env: {
    AWS_DEFAULT_REGION: '${{ secrets.AWS_DEFAULT_REGION }}',
    AWS_ACCESS_KEY_ID: '${{ secrets.AWS_ACCESS_KEY_ID }}',
    AWS_SECRET_ACCESS_KEY: '${{ secrets.AWS_SECRET_ACCESS_KEY }}',
  },
  needs: ['release_github'],
  steps: [
    checkoutStep,
    setupNodeStep,
    npmGlobalInstallStep,
    npmInstallStep,
    deploymentStep,
  ],
};
project.release?.addJobs({
  deploy: deployJob,
});
```