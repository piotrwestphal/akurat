import {RemovalPolicy, Stack, StackProps} from 'aws-cdk-lib'
import {Construct} from 'constructs'
import {BlockPublicAccess, Bucket} from 'aws-cdk-lib/aws-s3'

type RootStackProps = Readonly<{
    artifactsBucketName: string
}> & StackProps

// TODO: https://dev.to/aws-builders/automate-building-a-unique-domain-hosting-environment-with-aws-cdk-1dd1
export class RootStack extends Stack {
    constructor(scope: Construct, id: string, props: RootStackProps) {
        super(scope, id, props)
        const {artifactsBucketName} = props

        const artifactsBucket = new Bucket(this, 'ArtifactsBucket', {
            bucketName: artifactsBucketName,
            publicReadAccess: false,
            blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
            versioned: true,
            removalPolicy: RemovalPolicy.RETAIN,
        })
        //
        // const table = new Table(this, 'Table', {
        //     partitionKey: {
        //         name: 'non',
        //         type: AttributeType.STRING,
        //     },
        //     stream: StreamViewType.NEW_IMAGE,
        //     writeCapacity: 5,
        //     readCapacity: 5,
        //     billingMode: BillingMode.PROVISIONED,
        //     removalPolicy: RemovalPolicy.DESTROY,
        // })
        //
        // // TODO: https://bobbyhadz.com/blog/aws-cdk-api-authorizer
        // const tempFunc = new NodejsFunction(this, 'TempFunction', {
        //     entry: join(__dirname, 'lambdas', 'hello.ts'),
        //     logRetention: RetentionDays.ONE_DAY,
        //     runtime: Runtime.NODEJS_18_X,
        // })
        //
        // const processFunc = new NodejsFunction(this, 'ProcessFunction', {
        //     entry: join(__dirname, 'lambdas', 'process.ts'),
        //     logRetention: RetentionDays.ONE_DAY,
        //     runtime: Runtime.NODEJS_18_X,
        // })
        //
        // processFunc.addEventSource(new DynamoEventSource(table, {
        //     startingPosition: StartingPosition.LATEST,
        // }))
        //
        // // const restApi = RestApi.fromRestApiAttributes(this, 'RestApi', {restApiId, rootResourceId})
        //
        // // TODO: move to webapp stack
        //
        // // Cognito User Pool with Email Sign-in Type.
        // const userPool = new UserPool(this, 'UserPool', {
        //     selfSignUpEnabled: true,
        //     autoVerify: {
        //         email: true,
        //     },
        //     signInAliases: {
        //         email: true
        //     },
        // })
        // const group = new CfnUserPoolGroup(this, 'group', {
        //     userPoolId: userPool.userPoolId,
        //     groupName: 'group',
        // })
        //
        // const userPoolClient = userPool.addClient('UserPoolClient', {
        //     accessTokenValidity: Duration.days(1),
        //     refreshTokenValidity: Duration.days(365 * 10),
        //     authFlows: {
        //         userPassword: true,
        //     },
        // })
        //
        // const webappBucket = new Bucket(this, 'WebappBucket', {
        //     publicReadAccess: false,
        //     blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
        //     versioned: true,
        //     autoDeleteObjects: true,
        //     removalPolicy: RemovalPolicy.DESTROY,
        // })
        //
        // const restApiStageName = 'dev'
        // const restApi = new RestApi(this, 'RestApi', {
        //     description: 'Rest api for kolektiv application',
        //     cloudWatchRole: true,
        //     deployOptions: {
        //         stageName: restApiStageName
        //     }
        // })
        // restApi.root.addMethod('ANY')
        //
        // const cloudfrontOAI = new OriginAccessIdentity(this, 'CloudFrontOriginAccessIdentity')
        //
        // webappBucket.addToResourcePolicy(new PolicyStatement({
        //     actions: ['s3:GetObject'],
        //     resources: [webappBucket.arnForObjects('*')],
        //     principals: [new CanonicalUserPrincipal(cloudfrontOAI.cloudFrontOriginAccessIdentityS3CanonicalUserId)]
        // }))
        //
        // const webappBucketOrigin = new S3Origin(webappBucket, {originAccessIdentity: cloudfrontOAI})
        //
        // const distribution = new Distribution(this, 'Distribution', {
        //     comment: `Distribution for webapp`,
        //     defaultRootObject: 'index.html',
        //     minimumProtocolVersion: SecurityPolicyProtocol.TLS_V1_2_2021,
        //     defaultBehavior: {
        //         origin: webappBucketOrigin,
        //         allowedMethods: AllowedMethods.ALLOW_GET_HEAD,
        //         cachePolicy: CachePolicy.CACHING_DISABLED,
        //         viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        //     },
        //     additionalBehaviors: {
        //         'index.html': {
        //             origin: webappBucketOrigin,
        //             allowedMethods: AllowedMethods.ALLOW_GET_HEAD,
        //             cachePolicy: CachePolicy.CACHING_DISABLED,
        //             viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        //         },
        //         // need to match an existing api gateway endpoint - i.e. {api-gateway-address-with-stage-name}/api/...
        //         '/api/*': {
        //             origin: new RestApiOrigin(restApi),
        //             allowedMethods: AllowedMethods.ALLOW_ALL,
        //             cachePolicy: new CachePolicy(this, 'AllowBasicRequests', {
        //                 defaultTtl: Duration.seconds(0),
        //                 minTtl: Duration.seconds(0),
        //                 maxTtl: Duration.seconds(1),
        //                 queryStringBehavior: CacheQueryStringBehavior.all(),
        //                 headerBehavior: CacheHeaderBehavior.allowList('Authorization')
        //             }),
        //             viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        //         },
        //     },
        // })
        // const paramsBucket = new Bucket(this, 'ParamsBucket', {
        //     bucketName: artifactsBucketName,
        //     publicReadAccess: false,
        //     blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
        //     versioned: true,
        //     autoDeleteObjects: true,
        //     removalPolicy: RemovalPolicy.DESTROY,
        // })
        //
        // new BucketDeployment(this, 'ConfigDeployment', {
        //     sources: [Source.jsonData('config.json', {
        //         webappDistribution: {
        //             domainName: distribution.domainName,
        //             distributionId: distribution.distributionId
        //         },
        //         webappBucketName: webappBucket.bucketName
        //     })],
        //     destinationBucket: paramsBucket
        // })
        //
        // // Authorizer for the Hello World API that uses the
        // // Cognito User pool to Authorize users.
        // // const authorizer = new CognitoUserPoolsAuthorizer(this, 'CognitoAuthorizer', {
        // //     cognitoUserPools: [userPool],
        // // })
        //
        // // Hello Resource API for the REST API.
        // // const apiResource = restApi.root.addResource('api')
        // // const helloResource = apiResource.addResource('hello')
        //
        // // GET method for the HELLO API resource. It uses Cognito for
        // // authorization and the auathorizer defined above.
        // // helloResource.addMethod('GET', new LambdaIntegration(tempFunc), {
        // //     authorizationType: AuthorizationType.COGNITO,
        // //     authorizer: authorizer,
        // // })
        // new CfnOutput(this, 'WebappDistributionDomainName', {value: distribution.distributionDomainName})
        // new CfnOutput(this, 'CognitoPoolId', {value: userPool.userPoolId})
        // new CfnOutput(this, 'CognitoPoolName', {value: userPool.userPoolProviderName})
        // new CfnOutput(this, 'CognitoPoolClientId', {value: userPoolClient.userPoolClientId})
    }
}
