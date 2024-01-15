import {LambdaIntegration, Resource, RestApi} from 'aws-cdk-lib/aws-apigateway'
import {Table} from 'aws-cdk-lib/aws-dynamodb'
import {NodejsFunction, NodejsFunctionProps} from 'aws-cdk-lib/aws-lambda-nodejs'
import {RetentionDays} from 'aws-cdk-lib/aws-logs'
import {Queue} from 'aws-cdk-lib/aws-sqs'
import {Construct} from 'constructs'
import {join} from 'path'
import {globalCommonLambdaProps} from '../cdk.consts'
import {profileCreateReqSchema} from './schemas/profile-create-req.schema'

type ProfilesMgmtProps = Readonly<{
    mainTable: Table
    processImageQueue: Queue
    restApi: RestApi
    restApiV1Resource: Resource
    logRetention: RetentionDays
}>

export class ProfilesMgmt extends Construct {

    constructor(scope: Construct,
                id: string,
                {
                    mainTable,
                    processImageQueue,
                    restApi,
                    restApiV1Resource,
                    logRetention,
                }: ProfilesMgmtProps) {
        super(scope, id)

        const commonProps: Partial<NodejsFunctionProps> = {
            ...globalCommonLambdaProps,
            logRetention,
        }

        const profilesResource = restApiV1Resource.addResource('profiles')
        const myProfileResource = profilesResource.addResource('me')

        const getFunc = new NodejsFunction(this, 'GetProfileFunc', {
            description: 'Get a user profile',
            entry: join(__dirname, 'lambdas', 'get-my-profile.ts'),
            environment: {
                TABLE_NAME: mainTable.tableName,
            },
            ...commonProps,
        })
        mainTable.grantReadData(getFunc)
        myProfileResource.addMethod('GET', new LambdaIntegration(getFunc))

        const getAllFunc = new NodejsFunction(this, 'GetAllProfilesFunc', {
            description: 'Get all profiles',
            entry: join(__dirname, 'lambdas', 'get-all-profiles.ts'),
            environment: {
                TABLE_NAME: mainTable.tableName,
            },
            ...commonProps,
        })

        mainTable.grantReadData(getAllFunc)
        profilesResource.addMethod('GET', new LambdaIntegration(getAllFunc))

        const createFunc = new NodejsFunction(this, 'CreateProfileFunc', {
            description: 'Create a user profile',
            entry: join(__dirname, 'lambdas', 'create-profile.ts'),
            environment: {
                TABLE_NAME: mainTable.tableName,
                QUEUE_URL: processImageQueue.queueUrl,
            },
            ...commonProps,
        })
        profilesResource.addMethod('POST', new LambdaIntegration(createFunc),
            {
                requestValidator: restApi.addRequestValidator('CreateProfileReqBodyValidator', {
                    validateRequestBody: true,
                }),
                requestModels: {
                    'application/json': restApi.addModel('ProfileCreateReqModel', {
                        modelName: 'ProfileCreateReqModel',
                        schema: profileCreateReqSchema,
                    }),
                },
            })
        mainTable.grantWriteData(createFunc)
        processImageQueue.grantSendMessages(createFunc)
    }
}