import {CfnOutput, Duration, RemovalPolicy, Stack, StackProps} from 'aws-cdk-lib'
import {ResponseType, RestApi} from 'aws-cdk-lib/aws-apigateway'
import {Certificate} from 'aws-cdk-lib/aws-certificatemanager'
import {
    AllowedMethods,
    CachedMethods,
    CachePolicy,
    Distribution,
    HttpVersion,
    OriginAccessIdentity,
    PriceClass,
    SecurityPolicyProtocol,
    ViewerProtocolPolicy,
} from 'aws-cdk-lib/aws-cloudfront'
import {S3Origin} from 'aws-cdk-lib/aws-cloudfront-origins'
import {NodejsFunctionProps} from 'aws-cdk-lib/aws-lambda-nodejs'
import {RetentionDays} from 'aws-cdk-lib/aws-logs'
import {ARecord, HostedZone, RecordTarget} from 'aws-cdk-lib/aws-route53'
import {ApiGateway, CloudFrontTarget} from 'aws-cdk-lib/aws-route53-targets'
import {BlockPublicAccess, Bucket} from 'aws-cdk-lib/aws-s3'
import {BucketDeployment, Source} from 'aws-cdk-lib/aws-s3-deployment'
import {Construct} from 'constructs'
import {AuthService} from './auth-service/auth-service'
import {globalCommonLambdaProps} from './cdk.consts'
import {restApiEndpointOutputKey, userPoolClientIdOutputKey, userPoolIdOutputKey} from './consts'
import {DistributionParams, UserMgmtParams, WebappDistributionParams} from './types'
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
                    userMgmt,
                    logRetention,
                    artifactsBucketName,
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

        const originAccessIdentity = new OriginAccessIdentity(this, 'CloudFrontOriginAccessIdentity')
        const webappBucketOrigin = new S3Origin(webappBucket, {originAccessIdentity})

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

        const restApiV1Resource = restApi.root.addResource('v1')

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
            const {
                certificates: {cloudFrontCertArn, apiGwCertArn},
                distributionArtifactsS3KeyPrefix,
                distributionParamsFilename,
                domainPrefix,
            } = distribution
            const hostedZone = HostedZone.fromLookup(this, 'HostedZone', {domainName: baseDomainName})

            const domainName = domainPrefix ? `${domainPrefix}.${baseDomainName}` : baseDomainName

            const webappDistribution = new Distribution(this, 'WebappDistribution', {
                domainNames: [domainName],
                certificate: Certificate.fromCertificateArn(this, 'CFCertificate', cloudFrontCertArn),
                defaultRootObject: 'index.html',
                defaultBehavior: {
                    origin: webappBucketOrigin,
                    compress: true,
                    allowedMethods: AllowedMethods.ALLOW_GET_HEAD,
                    cachedMethods: CachedMethods.CACHE_GET_HEAD,
                    viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                    cachePolicy: CachePolicy.CACHING_OPTIMIZED,
                },
                errorResponses: [
                    {
                        httpStatus: 403,
                        responsePagePath: '/index.html',
                        responseHttpStatus: 200,
                        ttl: Duration.minutes(0),
                    },
                    {
                        httpStatus: 404,
                        responsePagePath: '/index.html',
                        responseHttpStatus: 200,
                        ttl: Duration.minutes(0),
                    },
                ],
                priceClass: PriceClass.PRICE_CLASS_100,
                enabled: true,
                minimumProtocolVersion: SecurityPolicyProtocol.TLS_V1_2_2021,
                httpVersion: HttpVersion.HTTP2,
            })

            new ARecord(this, 'WebappRecordSet', {
                recordName: domainName,
                zone: hostedZone,
                target: RecordTarget.fromAlias(new CloudFrontTarget(webappDistribution)),
            })

            restApi.addDomainName('ApiGwDomainName', {
                certificate: Certificate.fromCertificateArn(this, 'ApiGWCertificate', apiGwCertArn),
                domainName: `api.${domainName}`,
            })

            new ARecord(this, 'ApiRecordSet', {
                recordName: `api.${domainName}`,
                zone: hostedZone,
                target: RecordTarget.fromAlias(new ApiGateway(restApi)),
            })

            new BucketDeployment(this, 'WebappParamsDeployment', {
                destinationBucket: Bucket.fromBucketName(this, 'ArtifactsBucket', artifactsBucketName),
                destinationKeyPrefix: distributionArtifactsS3KeyPrefix,
                sources: [Source.jsonData(distributionParamsFilename,
                    {
                        webappBucketName: webappBucket.bucketName,
                        webappDistribution: {
                            domainName: webappDistribution.domainName,
                            distributionId: webappDistribution.distributionId,
                        },
                    } satisfies WebappDistributionParams)],
            })
        }

        new CfnOutput(this, restApiEndpointOutputKey, {value: restApi.url})
        new CfnOutput(this, userPoolClientIdOutputKey, {value: userPoolClientId})
        new CfnOutput(this, userPoolIdOutputKey, {value: userPool.userPoolId})
    }
}