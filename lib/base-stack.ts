import {CfnOutput, Duration, RemovalPolicy, Stack, StackProps} from 'aws-cdk-lib'
import {Construct} from 'constructs'
import {Certificate} from 'aws-cdk-lib/aws-certificatemanager'
import {ARecord, HostedZone, RecordTarget} from 'aws-cdk-lib/aws-route53'
import {NodejsFunction, NodejsFunctionProps} from 'aws-cdk-lib/aws-lambda-nodejs'
import {RetentionDays} from 'aws-cdk-lib/aws-logs'
import {LambdaIntegration, RestApi} from 'aws-cdk-lib/aws-apigateway'
import {
    AllowedMethods,
    CachedMethods,
    CachePolicy,
    Distribution,
    HttpVersion,
    OriginAccessIdentity,
    PriceClass,
    SecurityPolicyProtocol,
    ViewerProtocolPolicy
} from 'aws-cdk-lib/aws-cloudfront'
import {ApiGateway, CloudFrontTarget} from 'aws-cdk-lib/aws-route53-targets'
import {BlockPublicAccess, Bucket} from 'aws-cdk-lib/aws-s3'
import {S3Origin} from 'aws-cdk-lib/aws-cloudfront-origins'
import {BucketDeployment, Source} from 'aws-cdk-lib/aws-s3-deployment'
import {WebappDistributionParams} from './types'
import {globalCommonLambdaProps} from './cdk.consts'
import {join} from 'path'

type BaseStackProps = Readonly<{
    envName: string
    artifactsBucketName: string
    // TODO: is it all right to have two separate certs?
    certificateArns?: {
        apiGw: string
        cloudFront: string
    }
}> & StackProps

// TODO: https://stackoverflow.com/questions/71543415/how-to-change-the-url-prefix-for-fetch-calls-depending-on-dev-vs-prod-environmen
export class BaseStack extends Stack {
    constructor(scope: Construct,
                id: string, {
                    envName,
                    artifactsBucketName,
                    certificateArns,
                    ...props
                }: BaseStackProps) {
        super(scope, id, props)

        const commonLambdaProps: Partial<NodejsFunctionProps> = {
            logRetention: RetentionDays.ONE_WEEK,
            ...globalCommonLambdaProps
        }

        const domainName = this.node.tryGetContext('domainName') as string | undefined

        const webappBucket = new Bucket(this, 'WebappBucket', {
            publicReadAccess: false,
            versioned: true,
            blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
            removalPolicy: RemovalPolicy.DESTROY,
            autoDeleteObjects: true,
        })

        const originAccessIdentity = new OriginAccessIdentity(this, 'CloudFrontOriginAccessIdentity')
        const webappBucketOrigin = new S3Origin(webappBucket, {originAccessIdentity})

        // TODO: extract main params and include in if block -> certificateArns && domainName
        const webappDistribution = new Distribution(this, 'WebappDistribution', {
            domainNames: certificateArns && domainName ? [domainName] : undefined,
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
            certificate: certificateArns && domainName
                ? Certificate.fromCertificateArn(this, 'CFCertificate', certificateArns.cloudFront)
                : undefined,
            minimumProtocolVersion: SecurityPolicyProtocol.TLS_V1_2_2021,
            httpVersion: HttpVersion.HTTP2,
        })

        new BucketDeployment(this, 'WebappParamsDeployment', {
            destinationBucket: Bucket.fromBucketName(this, 'ArtifactsBucket', artifactsBucketName),
            destinationKeyPrefix: `distribution/${envName}`,
            sources: [Source.jsonData('config.json',
                {
                    webappBucketName: webappBucket.bucketName,
                    webappDistribution: {
                        domainName: webappDistribution.domainName,
                        distributionId: webappDistribution.distributionId,
                    },
                } satisfies WebappDistributionParams)],
        })

        const tempFunc = new NodejsFunction(this, 'TempFunction', {
            entry: join(__dirname, 'lambdas', 'hello.ts'),
            ...commonLambdaProps
        })

        const restApi = new RestApi(this, 'RestApi', {
            description: 'Rest api for application',
            cloudWatchRole: true,
            deployOptions: {
                stageName: envName
            },
        })

        restApi.root
            .addResource('hello')
            // TODO: enable
            .addMethod('GET', new LambdaIntegration(tempFunc))
        // .addMethod('GET', new MockIntegration())

        if (certificateArns && domainName) {
            const hostedZone = HostedZone.fromLookup(this, 'HostedZone', {domainName})

            restApi.addDomainName('ApiGwDomainName', {
                certificate: Certificate.fromCertificateArn(this, 'ApiGWCertificate', certificateArns.apiGw),
                domainName: `api.${domainName}`
            })

            new ARecord(this, 'ApiRecordSet', {
                recordName: `api`,
                zone: hostedZone,
                target: RecordTarget.fromAlias(new ApiGateway(restApi)),
            })

            new ARecord(this, 'WebappRecordSet', {
                zone: hostedZone,
                target: RecordTarget.fromAlias(
                    new CloudFrontTarget(webappDistribution)
                ),
            })
        }

        new CfnOutput(this, 'DistributionDomainName', {value: webappDistribution.domainName})
    }
}