import { Construct } from 'constructs'
import {
    AwsCustomResource,
    AwsCustomResourcePolicy,
    AwsSdkCall,
    PhysicalResourceId
} from 'aws-cdk-lib/custom-resources'
import { RetentionDays } from 'aws-cdk-lib/aws-logs'
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam'
import { Duration } from 'aws-cdk-lib'
import { AttributeValue } from '@aws-sdk/client-dynamodb'

interface DynamoRequest {
    [dynamoAction: string]: {
        Item: {
            [attribute: string]: AttributeValue
        }
    }
}

export type InitialData = Record<string, DynamoRequest[]>

interface DynamoCustomResourceProps {
    readonly tableName: string
    readonly tableArn: string
    readonly data: InitialData
    readonly logRetention: RetentionDays
}

export class DynamoDataInitializer extends Construct {

    constructor(scope: Construct,
                id: string,
                {
                    tableName,
                    tableArn,
                    data,
                    logRetention,
                }: DynamoCustomResourceProps) {
        super(scope, id)

        const awsSdkCallById: [string, AwsSdkCall][] = Object.entries(data)
            .map(([id, data]) =>
                [id, {
                    service: 'DynamoDB',
                    action: 'batchWriteItem',
                    physicalResourceId: PhysicalResourceId.of(`${tableName}-Write-${id}`),
                    parameters: {
                        RequestItems: {
                            [tableName]: data
                        }
                    }
                }])

        awsSdkCallById.forEach(([id, awsSdkCall]) =>
            new AwsCustomResource(this, `DynamoCustomResource-${id}`, {
                    onCreate: awsSdkCall,
                    onUpdate: awsSdkCall,
                    logRetention,
                    policy: AwsCustomResourcePolicy.fromStatements([
                        new PolicyStatement({
                            sid: 'DynamoWriteAccess',
                            effect: Effect.ALLOW,
                            actions: ['dynamodb:BatchWriteItem'],
                            resources: [tableArn],
                        })
                    ]),
                    // too short timeout will block the cfn
                    timeout: Duration.minutes(5)
                }
            ))
    }
}
