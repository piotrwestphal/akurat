import {CfnOutput, Stack, StackProps} from 'aws-cdk-lib'
import {CompositePrincipal, ManagedPolicy, Role, ServicePrincipal} from 'aws-cdk-lib/aws-iam'
import {Runtime} from 'aws-cdk-lib/aws-lambda'
import {NodejsFunction} from 'aws-cdk-lib/aws-lambda-nodejs'
import {Construct} from 'constructs'
import * as path from 'path'

type EdgeStackProps = Readonly<{
    artifactsBucketName: string

}> & StackProps

export class EdgeStack extends Stack {
    constructor(scope: Construct,
                id: string, {
                    artifactsBucketName,
                    ...props
                }: EdgeStackProps) {
        super(scope, id, props)

        const redirectEdgeFunc = new NodejsFunction(this, 'EdgeLambda', {
            runtime: Runtime.NODEJS_18_X,
            entry: path.join(__dirname, 'edge', 'lambdas', 'redirect.ts'),
            role: new Role(this, 'EdgeLambdaRole', {
                managedPolicies: [ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')],
                assumedBy: new CompositePrincipal(
                    new ServicePrincipal('lambda.amazonaws.com'),
                    new ServicePrincipal('edgelambda.amazonaws.com'),
                )
            }),
            // required for the Edge@Lambda
            awsSdkConnectionReuse: false
        })

        new CfnOutput(this, 'EdgeFunctionVersionArn', {value: redirectEdgeFunc.currentVersion.functionArn})
    }
}