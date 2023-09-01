import {CfnOutput, RemovalPolicy, Stack, StackProps} from 'aws-cdk-lib'
import {ResponseType, RestApi} from 'aws-cdk-lib/aws-apigateway'
import {NodejsFunctionProps} from 'aws-cdk-lib/aws-lambda-nodejs'
import {RetentionDays} from 'aws-cdk-lib/aws-logs'
import {BlockPublicAccess, Bucket} from 'aws-cdk-lib/aws-s3'
import {Construct} from 'constructs'
import {AuthService} from './auth-service/auth-service'
import {globalCommonLambdaProps} from './cdk.consts'
import {Cdn} from './cdn/cdn'
import {restApiEndpointOutputKey, userPoolClientIdOutputKey, userPoolIdOutputKey} from './consts'
import {DistributionParams, UserMgmtParams} from './types'
import {UserMgmt} from './user-mgmt/user-mgmt'

type BaseStackProps = Readonly<{
    envName: string
    artifactsBucketName: string
    userMgmt: UserMgmtParams
    logRetention: RetentionDays
    distribution?: DistributionParams
}> & StackProps

// TODO: https://stackoverflow.com/questions/71543415/how-to-change-the-url-prefix-for-fetch-calls-depending-on-dev-vs-prod-environmen
export class BaseStack extends Stack {
    constructor(scope: Construct,
                id: string, {
                    envName,
                    artifactsBucketName,
                    userMgmt,
                    logRetention,
                    distribution,
                    ...props
                }: BaseStackProps) {
        super(scope, id, props)

        const commonLambdaProps: Partial<NodejsFunctionProps> = {
            logRetention: RetentionDays.ONE_WEEK,
            ...globalCommonLambdaProps,
        }

        const baseDomainName = this.node.tryGetContext('domainName') as string | undefined

        const webappBucket = new Bucket(this, 'WebappBucket', {
            publicReadAccess: false,
            versioned: true,
            blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
            removalPolicy: RemovalPolicy.DESTROY,
            autoDeleteObjects: true,
        })

        const restApi = new RestApi(this, 'RestApi', {
            description: `[${envName}] REST api for application`,
            cloudWatchRole: true,
            deployOptions: {
                stageName: envName,
            },
        })
        // adds extended request body validation messages
        restApi.addGatewayResponse('BadRequestBodyValidationTemplate', {
            type: ResponseType.BAD_REQUEST_BODY,
            statusCode: '400',
            templates: {
                'application/json': `{"message": "$context.error.validationErrorString"}`,
            },
        })

        const restApiV1Resource = restApi.root.addResource('api').addResource('v1')

        const {authorizer, userPool} = new UserMgmt(this, 'UserMgmt', {
            envName,
            restApiV1Resource,
            userMgmt,
            logRetention,
        })

        const {userPoolClientId} = new AuthService(this, 'AuthService', {
            restApi,
            restApiV1Resource,
            userPool,
            logRetention,
        })

        if (baseDomainName && distribution) {
            new Cdn(this, 'Cdn', {
                baseDomainName,
                artifactsBucketName,
                webappBucket,
                restApi,
                distribution,
            })
        }

        new CfnOutput(this, restApiEndpointOutputKey, {value: restApi.url})
        new CfnOutput(this, userPoolClientIdOutputKey, {value: userPoolClientId})
        new CfnOutput(this, userPoolIdOutputKey, {value: userPool.userPoolId})
    }
}