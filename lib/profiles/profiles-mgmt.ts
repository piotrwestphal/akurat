import {IAuthorizer, LambdaIntegration, Resource, RestApi} from 'aws-cdk-lib/aws-apigateway'
import {Table} from 'aws-cdk-lib/aws-dynamodb'
import {NodejsFunction, NodejsFunctionProps} from 'aws-cdk-lib/aws-lambda-nodejs'
import {RetentionDays} from 'aws-cdk-lib/aws-logs'
import {Construct} from 'constructs'
import {join} from 'path'
import {globalCommonLambdaProps} from '../cdk.consts'
import {awsSdkV3ModuleName} from '../consts'
import {LambdaLayerDef} from '../types'

type ProfilesMgmtProps = Readonly<{
    mainTable: Table
    restApi?: RestApi
    userPoolId: string
    userPoolClientId: string
    restApiV1Resource: Resource
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
                    userPoolId,
                    userPoolClientId,
                    restApiV1Resource,
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

        myProfileResource.addMethod('GET', new LambdaIntegration(getFunc))
    }
}