import {Duration} from 'aws-cdk-lib'
import {LambdaIntegration, Resource} from 'aws-cdk-lib/aws-apigateway'
import {Table} from 'aws-cdk-lib/aws-dynamodb'
import {NodejsFunction, NodejsFunctionProps} from 'aws-cdk-lib/aws-lambda-nodejs'
import {RetentionDays} from 'aws-cdk-lib/aws-logs'
import {Bucket} from 'aws-cdk-lib/aws-s3'
import {Topic} from 'aws-cdk-lib/aws-sns'
import {Queue} from 'aws-cdk-lib/aws-sqs'
import {Construct} from 'constructs'
import {join} from 'path'
import {globalCommonLambdaProps} from '../cdk.consts'
import {assetsBucketTempS3Key, awsSdkV3ModuleName} from '../consts'
import {LambdaLayerDef} from '../types'
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources'

type ProfilesMgmtProps = Readonly<{
    mainTable: Table
    assetsBucket: Bucket
    processImageQueue: Queue
    alarmsTopic: Topic
    restApiV1Resource: Resource
    sharpLayer: LambdaLayerDef
    logRetention: RetentionDays
}>

export class ImagesMgmt extends Construct {

    constructor(scope: Construct,
                id: string,
                {
                    mainTable,
                    assetsBucket,
                    processImageQueue,
                    alarmsTopic,
                    restApiV1Resource,
                    sharpLayer,
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

        const processImageFunc = new NodejsFunction(this, 'ProcessImageFunc', {
            description: 'Process images',
            entry: join(__dirname, 'lambdas', 'process-image.ts'),
            environment: {
                TABLE_NAME: mainTable.tableName,
                BUCKET_NAME: assetsBucket.bucketName,
                TOPIC_ARN: alarmsTopic.topicArn,
            },
            ...commonProps,
        })
        mainTable.grantReadWriteData(processImageFunc)
        assetsBucket.grantReadWrite(processImageFunc)
        processImageFunc.addEventSource(new SqsEventSource(processImageQueue))
        alarmsTopic.grantPublish(processImageFunc)
    }
}