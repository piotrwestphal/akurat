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

        new Bucket(this, 'ArtifactsBucket', {
            bucketName: artifactsBucketName,
            publicReadAccess: false,
            blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
            versioned: true,
            removalPolicy: RemovalPolicy.RETAIN,
        })
    }
}
