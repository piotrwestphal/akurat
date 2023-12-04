import {Duration} from 'aws-cdk-lib'
import {LambdaIntegration, Resource} from 'aws-cdk-lib/aws-apigateway'
import {NodejsFunction, NodejsFunctionProps} from 'aws-cdk-lib/aws-lambda-nodejs'
import {RetentionDays} from 'aws-cdk-lib/aws-logs'
import {Bucket} from 'aws-cdk-lib/aws-s3'
import {Construct} from 'constructs'
import {join} from 'path'
import {globalCommonLambdaProps} from '../cdk.consts'
import {assetsBucketTempS3Key, awsSdkV3ModuleName} from '../consts'
import {LambdaLayerDef} from '../types'

type ProfilesMgmtProps = Readonly<{
    restApiV1Resource: Resource
    sharpLayer: LambdaLayerDef
    assetsBucket: Bucket
    logRetention: RetentionDays
}>

export class ImagesMgmt extends Construct {

    constructor(scope: Construct,
                id: string,
                {
                    restApiV1Resource,
                    sharpLayer,
                    assetsBucket,
                    logRetention,
                }: ProfilesMgmtProps) {
        super(scope, id)

        const commonProps: Partial<NodejsFunctionProps> = {
            ...globalCommonLambdaProps,
            logRetention,
        }

        const imagesResource = restApiV1Resource.addResource('images')
        const uploadPhotoFunc = new NodejsFunction(this, 'UploadImageFunc', {
            description: 'Upload an image',
            entry: join(__dirname, 'lambdas', 'upload-image.ts'),
            bundling: {
                // need to list all modules that should not be bundled
                externalModules: [sharpLayer.moduleName, awsSdkV3ModuleName],
            },
            layers: [sharpLayer.layerVer],
            environment: {
                BUCKET_NAME: assetsBucket.bucketName,
                S3_TEMP_PREFIX: assetsBucketTempS3Key,
            },
            memorySize: 256,
            timeout: Duration.seconds(5),
            ...commonProps,
        })
        assetsBucket.grantPut(uploadPhotoFunc)
        imagesResource.addMethod('POST', new LambdaIntegration(uploadPhotoFunc))
    }
}