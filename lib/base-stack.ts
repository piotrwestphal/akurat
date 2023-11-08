import {CfnOutput, Duration, RemovalPolicy, Stack, StackProps} from 'aws-cdk-lib'
import {CognitoUserPoolsAuthorizer, IAuthorizer, ResponseType, RestApi} from 'aws-cdk-lib/aws-apigateway'
import {UserPool} from 'aws-cdk-lib/aws-cognito'
import {AttributeType, BillingMode, Table} from 'aws-cdk-lib/aws-dynamodb'
import {RetentionDays} from 'aws-cdk-lib/aws-logs'
import {BlockPublicAccess, Bucket} from 'aws-cdk-lib/aws-s3'
import {StringParameter} from 'aws-cdk-lib/aws-ssm'
import {Construct} from 'constructs'
import {AuthServiceMock} from './auth-service-mock/auth-service-mock'
import {Cdn} from './cdn/cdn'
import {DynamoDataInitializer, InitialData} from './common/dynamo-data-initializer'
import {MainTable, mainTableNameOutputKey, restApiEndpointOutputKey, userPoolClientIdOutputKey} from './consts'
import {ProfilesMgmt} from './profiles/profiles-mgmt'
import {AuthServiceMockParams, AuthServiceParams, DistributionParams} from './types'

type BaseStackProps = Readonly<{
    envName: string
    artifactsBucketName: string
    authService: AuthServiceParams | AuthServiceMockParams
    logRetention: RetentionDays
    distribution?: DistributionParams
    mainInitialData?: InitialData
}> & StackProps

export class BaseStack extends Stack {
    constructor(scope: Construct,
                id: string, {
                    envName,
                    artifactsBucketName,
                    authService,
                    logRetention,
                    distribution,
                    mainInitialData,
                    ...props
                }: BaseStackProps) {
        super(scope, id, props)

        const baseDomainName = this.node.tryGetContext('domainName') as string | undefined

        const webappBucket = new Bucket(this, 'WebappBucket', {
            publicReadAccess: false,
            versioned: true,
            blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
            removalPolicy: RemovalPolicy.DESTROY,
            autoDeleteObjects: true,
        })

        const mainTable = new Table(this, 'MainTable', {
            partitionKey: {
                name: MainTable.PK,
                type: AttributeType.STRING,
            },
            sortKey: {
                name: MainTable.SK,
                type: AttributeType.STRING,
            },
            readCapacity: 5,
            writeCapacity: 5,
            billingMode: BillingMode.PROVISIONED,
            removalPolicy: RemovalPolicy.DESTROY,
        })

        let authorizer: IAuthorizer

        if ((authService as AuthServiceParams).userPoolIdParamName) {
            const userPoolIdParamName = (authService as AuthServiceParams).userPoolIdParamName
            const userPoolIdParam = StringParameter.valueForStringParameter(this, userPoolIdParamName)
            authorizer = new CognitoUserPoolsAuthorizer(this, 'CognitoAuthorizer', {
                cognitoUserPools: [UserPool.fromUserPoolId(this, 'UserPool', userPoolIdParam)],
                resultsCacheTtl: Duration.minutes(5),
            })
        } else {
            const {testUser} = authService as AuthServiceMockParams
            const {
                authorizer: mockAuthorizer,
                userPoolClientId,
            } = new AuthServiceMock(this, 'AuthServiceMock', {envName, testUser})
            authorizer = mockAuthorizer
            new CfnOutput(this, userPoolClientIdOutputKey, {value: userPoolClientId})
        }

        const restApi = new RestApi(this, 'RestApi', {
            description: `[${envName}] REST api for application`,
            deployOptions: {stageName: envName},
            defaultMethodOptions: {authorizer},
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
        if (baseDomainName && distribution) {
            new Cdn(this, 'Cdn', {
                baseDomainName,
                artifactsBucketName,
                webappBucket,
                restApi,
                distribution,
            })
        }

        new ProfilesMgmt(this, 'ProfilesMgmt', {
            mainTable,
            restApi,
            restApiV1Resource,
            logRetention,
        })

        if (mainInitialData) {
            new DynamoDataInitializer(this, 'MainDataInitializer', {
                tableName: mainTable.tableName,
                tableArn: mainTable.tableArn,
                data: mainInitialData,
                logRetention,
            })
        }

        new CfnOutput(this, mainTableNameOutputKey, {value: mainTable.tableName})
        new CfnOutput(this, restApiEndpointOutputKey, {value: restApi.url})
    }
}