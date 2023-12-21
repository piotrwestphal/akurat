import {CfnOutput, Duration, RemovalPolicy, Stack, StackProps} from 'aws-cdk-lib'
import {CognitoUserPoolsAuthorizer, IAuthorizer, ResponseType, RestApi} from 'aws-cdk-lib/aws-apigateway'
import {UserPool} from 'aws-cdk-lib/aws-cognito'
import {AttributeType, BillingMode, Table, TableProps} from 'aws-cdk-lib/aws-dynamodb'
import {Code, LayerVersion, Runtime} from 'aws-cdk-lib/aws-lambda'
import {RetentionDays} from 'aws-cdk-lib/aws-logs'
import {BlockPublicAccess, Bucket} from 'aws-cdk-lib/aws-s3'
import {Topic} from 'aws-cdk-lib/aws-sns'
import {Queue} from 'aws-cdk-lib/aws-sqs'
import {StringParameter} from 'aws-cdk-lib/aws-ssm'
import {Construct} from 'constructs'
import {join} from 'path'
import {Alarms} from './alarms/alarms'
import {AuthServiceMock} from './auth-service-mock/auth-service-mock'
import {Cdn} from './cdn/cdn'
import {DynamoDataInitializer, InitialData} from './common/dynamo-data-initializer'
import {
    assetsBucketNameOutputKey,
    assetsBucketTempS3Key,
    cloudfrontAssetsPrefix,
    MainTable,
    mainTableNameOutputKey,
    restApiEndpointOutputKey,
    userPoolClientIdOutputKey,
} from './consts'
import {ImagesMgmt} from './images/images-mgmt'
import {ProfilesMgmt} from './profiles/profiles-mgmt'
import {AlarmsParams, AuthServiceMockParams, AuthServiceParams, DistributionParams, LambdaLayerDef} from './types'

type BaseStackProps = Readonly<{
    envName: string
    artifactsBucketName: string
    authService: AuthServiceParams | AuthServiceMockParams
    logRetention: RetentionDays
    resourceRemovalPolicy?: RemovalPolicy
    distribution?: DistributionParams
    mainTableProps?: Partial<TableProps>
    alarms?: AlarmsParams
    mainInitialData?: InitialData
}> & StackProps

export class BaseStack extends Stack {
    constructor(scope: Construct,
                id: string, {
                    envName,
                    artifactsBucketName,
                    authService,
                    resourceRemovalPolicy,
                    logRetention,
                    distribution,
                    mainTableProps,
                    alarms,
                    mainInitialData,
                    ...props
                }: BaseStackProps) {
        super(scope, id, props)

        const baseDomainName = this.node.tryGetContext('domainName') as string | undefined

        const webappBucket = new Bucket(this, 'WebappBucket', {
            publicReadAccess: false,
            versioned: true,
            blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
            removalPolicy: resourceRemovalPolicy || RemovalPolicy.RETAIN,
            autoDeleteObjects: resourceRemovalPolicy === RemovalPolicy.DESTROY,
        })

        const assetsBucket = new Bucket(this, 'AssetsBucket', {
            publicReadAccess: false,
            versioned: true,
            blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
            removalPolicy: resourceRemovalPolicy || RemovalPolicy.RETAIN,
            autoDeleteObjects: resourceRemovalPolicy === RemovalPolicy.DESTROY,
            lifecycleRules: [
                {
                    prefix: `${cloudfrontAssetsPrefix}/${assetsBucketTempS3Key}/`,
                    expiration: Duration.days(1),
                },
            ],
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
            readCapacity: mainTableProps?.readCapacity || 5,
            writeCapacity: mainTableProps?.writeCapacity || 5,
            pointInTimeRecovery: mainTableProps?.pointInTimeRecovery || false,
            billingMode: BillingMode.PROVISIONED,
            removalPolicy: resourceRemovalPolicy || RemovalPolicy.RETAIN,
        })

        const processImageQueue = new Queue(this, 'ProcessImageQueue')
        const alarmsTopic = new Topic(this, 'AlarmsTopic')

        const sharpLayer = {
            layerVer: new LayerVersion(this, 'SharpClient', {
                layerVersionName: `${this.stackName}SharpClient`,
                description: 'Sharp client',
                compatibleRuntimes: [Runtime.NODEJS_20_X],
                code: Code.fromAsset(join('layers', 'sharp-client')),
                removalPolicy: resourceRemovalPolicy || RemovalPolicy.RETAIN,
            }),
            moduleName: 'sharp',
        } satisfies LambdaLayerDef

        const httpLayer = {
            layerVer: new LayerVersion(this, 'HttpClient', {
                layerVersionName: `${this.stackName}HttpClient`,
                description: 'Http client',
                compatibleRuntimes: [Runtime.NODEJS_20_X],
                code: Code.fromAsset(join('layers', 'http-client')),
                removalPolicy: resourceRemovalPolicy || RemovalPolicy.RETAIN,
            }),
            // the same as the package name
            moduleName: 'http-client',
        } satisfies LambdaLayerDef

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
                assetsBucket,
                restApi,
                distribution,
            })
        }

        new ProfilesMgmt(this, 'ProfilesMgmt', {
            mainTable,
            processImageQueue,
            restApi,
            restApiV1Resource,
            logRetention,
        })

        new ImagesMgmt(this, 'ImagesMgmt', {
            mainTable,
            assetsBucket,
            processImageQueue,
            alarmsTopic,
            restApiV1Resource,
            sharpLayer,
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

        if (alarms) {
            new Alarms(this, 'Alarms', {
                alarms,
                alarmsTopic,
                httpLayer,
                logRetention,
            })
        }

        new CfnOutput(this, mainTableNameOutputKey, {value: mainTable.tableName})
        new CfnOutput(this, restApiEndpointOutputKey, {value: restApi.url})
        new CfnOutput(this, assetsBucketNameOutputKey, {value: assetsBucket.bucketName})
    }
}