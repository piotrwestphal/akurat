import {Duration} from 'aws-cdk-lib'
import {RestApi} from 'aws-cdk-lib/aws-apigateway'
import {Certificate} from 'aws-cdk-lib/aws-certificatemanager'
import {
    AllowedMethods,
    CacheCookieBehavior,
    CachedMethods,
    CacheHeaderBehavior,
    CachePolicy,
    CacheQueryStringBehavior,
    Distribution,
    HttpVersion,
    LambdaEdgeEventType,
    OriginAccessIdentity,
    PriceClass,
    SecurityPolicyProtocol,
    ViewerProtocolPolicy,
} from 'aws-cdk-lib/aws-cloudfront'
import {RestApiOrigin, S3Origin} from 'aws-cdk-lib/aws-cloudfront-origins'
import {Version} from 'aws-cdk-lib/aws-lambda'
import {ARecord, HostedZone, RecordTarget} from 'aws-cdk-lib/aws-route53'
import {CloudFrontTarget} from 'aws-cdk-lib/aws-route53-targets'
import {Bucket} from 'aws-cdk-lib/aws-s3'
import {BucketDeployment, Source} from 'aws-cdk-lib/aws-s3-deployment'
import {Construct} from 'constructs'
import {authorizationHeaderKey, refreshTokenCookieKey} from '../auth-service/auth.consts'
import {DistributionParams, WebappDistributionParams} from '../types'

type CdnProps = Readonly<{
    baseDomainName: string
    artifactsBucketName: string
    webappBucket: Bucket
    restApi: RestApi
    distribution: DistributionParams
}>

export class Cdn extends Construct {

    constructor(scope: Construct,
                id: string,
                {
                    baseDomainName,
                    artifactsBucketName,
                    webappBucket,
                    restApi,
                    distribution,
                }: CdnProps) {
        super(scope, id)
        const {
            certArn,
            distributionArtifactsS3KeyPrefix,
            distributionParamsFilename,
            edgeLambdaVerArn,
            domainPrefix,
        } = distribution

        const originAccessIdentity = new OriginAccessIdentity(this, 'CloudFrontOriginAccessIdentity')
        const webappBucketOrigin = new S3Origin(webappBucket, {originAccessIdentity})

        const hostedZone = HostedZone.fromLookup(this, 'HostedZone', {domainName: baseDomainName})
        const domainName = domainPrefix ? `${domainPrefix}.${baseDomainName}` : baseDomainName

        const webappDistribution = new Distribution(this, 'WebappDistribution', {
            domainNames: [domainName],
            certificate: Certificate.fromCertificateArn(this, 'CFCertificate', certArn),
            defaultRootObject: 'index.html',
            defaultBehavior: {
                origin: webappBucketOrigin,
                compress: true,
                allowedMethods: AllowedMethods.ALLOW_GET_HEAD,
                cachedMethods: CachedMethods.CACHE_GET_HEAD,
                viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                cachePolicy: CachePolicy.CACHING_OPTIMIZED,
                edgeLambdas: [
                    {
                        eventType: LambdaEdgeEventType.ORIGIN_REQUEST,
                        functionVersion: Version.fromVersionArn(this, 'EdgeLambdaFunc', edgeLambdaVerArn),
                    },
                ],
            },
            additionalBehaviors: {
                // need to match an existing api gateway endpoint - i.e. {api-gateway-address-with-stage-name}/api/...
                '/api/*': {
                    origin: new RestApiOrigin(restApi),
                    allowedMethods: AllowedMethods.ALLOW_ALL,
                    cachePolicy: new CachePolicy(this, 'AllowBasicRequests', {
                        defaultTtl: Duration.seconds(0),
                        minTtl: Duration.seconds(0),
                        maxTtl: Duration.seconds(1),
                        queryStringBehavior: CacheQueryStringBehavior.all(),
                        headerBehavior: CacheHeaderBehavior.allowList(authorizationHeaderKey),
                        cookieBehavior: CacheCookieBehavior.allowList(refreshTokenCookieKey),
                    }),
                    viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                },
            },
            priceClass: PriceClass.PRICE_CLASS_100,
            enabled: true,
            minimumProtocolVersion: SecurityPolicyProtocol.TLS_V1_2_2021,
            httpVersion: HttpVersion.HTTP2,
        })

        new ARecord(this, 'CloudFrontRecordSet', {
            recordName: domainName,
            zone: hostedZone,
            target: RecordTarget.fromAlias(new CloudFrontTarget(webappDistribution)),
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
}