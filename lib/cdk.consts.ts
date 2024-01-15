import { NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs'
import { Runtime } from 'aws-cdk-lib/aws-lambda'
import { join } from 'path'

export const globalCommonLambdaProps: Partial<NodejsFunctionProps> = {
    runtime: Runtime.NODEJS_20_X,
    // use this to prevent accidental dependencies from being dragged into a lambda bundle
    depsLockFilePath: join(__dirname, 'no-deps-package-lock.json'),
}