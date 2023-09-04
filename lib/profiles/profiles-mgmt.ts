import {IAuthorizer, LambdaIntegration, Resource, RestApi} from 'aws-cdk-lib/aws-apigateway'
import {Table} from 'aws-cdk-lib/aws-dynamodb'
import {NodejsFunction, NodejsFunctionProps} from 'aws-cdk-lib/aws-lambda-nodejs'
import {RetentionDays} from 'aws-cdk-lib/aws-logs'
import {Construct} from 'constructs'
import {join} from 'path'
import {globalCommonLambdaProps} from '../cdk.consts'
import {awsSdkV3ModuleName} from '../consts'
import {LambdaLayerDef} from '../types'
import {profileCreateReqSchema} from './schemas/profile-create-req.schema'

type ProfilesMgmtProps = Readonly<{
    mainTable: Table
    restApi: RestApi
    restApiV1Resource: Resource
    userPoolId: string
    userPoolClientId: string
    authorizer: IAuthorizer
    jwtVerifierLayer: LambdaLayerDef
    logRetention: RetentionDays
}>
export class ProfilesMgmt extends Construct {

    constructor(scope: Construct,
                id: string,
                {
                    mainTable,
                    restApi,
                    restApiV1Resource,
                    userPoolId,
                    userPoolClientId,
                    authorizer,
                    jwtVerifierLayer,
                    logRetention,
                }: ProfilesMgmtProps) {
        super(scope, id)

        const commonProps: Partial<NodejsFunctionProps> = {
            ...globalCommonLambdaProps,
            logRetention,
        }

        const profilesResource = restApiV1Resource.addResource('profiles', {
            defaultMethodOptions: {authorizer}
        })

        const myProfileResource = profilesResource.addResource('me')

        const getFunc = new NodejsFunction(this, 'GetProfileFunc', {
            description: 'Get a user profile',
            entry: join(__dirname, 'lambdas', 'get-my-profile.ts'),
            bundling: {
                externalModules: [awsSdkV3ModuleName, jwtVerifierLayer.moduleName],
            },
            layers: [jwtVerifierLayer.layerVer],
            environment: {
                USER_POOL_ID: userPoolId,
                USER_POOL_CLIENT_ID: userPoolClientId,
                TABLE_NAME: mainTable.tableName,
            },
            ...commonProps
        })
        mainTable.grantReadData(getFunc)

        const createFunc = new NodejsFunction(this, 'CreateProfileFunc', {
            description: 'Create a user profile',
            entry: join(__dirname, 'lambdas', 'create-profile.ts'),
            bundling: {
                externalModules: [awsSdkV3ModuleName, jwtVerifierLayer.moduleName],
            },
            layers: [jwtVerifierLayer.layerVer],
            environment: {
                USER_POOL_ID: userPoolId,
                USER_POOL_CLIENT_ID: userPoolClientId,
                TABLE_NAME: mainTable.tableName,
            },
            ...commonProps
        })

        mainTable.grantWriteData(createFunc)

        profilesResource.addMethod('POST', new LambdaIntegration(createFunc),
            {
                requestValidator: restApi.addRequestValidator('CreateProfileReqBodyValidator', {
                    validateRequestBody: true,
                }),
                requestModels: {
                    'application/json': restApi.addModel('ProfileCreateReqModel', {
                        modelName: 'ProfileCreateReqModel',
                        schema: profileCreateReqSchema
                    })
                },
            })

        myProfileResource.addMethod('GET', new LambdaIntegration(getFunc))
    }
}