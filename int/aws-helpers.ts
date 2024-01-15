import {
    AuthenticationResultType,
    AuthFlowType,
    CognitoIdentityProviderClient,
    GetUserCommand,
    InitiateAuthCommand,
} from '@aws-sdk/client-cognito-identity-provider'
import {
    BatchWriteItemCommand,
    DynamoDBClient,
    GetItemCommand,
    PutItemCommand,
    ScanCommand,
} from '@aws-sdk/client-dynamodb'
import {
    DeleteObjectsCommand,
    GetObjectCommand,
    ListObjectsV2Command,
    PutObjectCommand,
    S3Client,
} from '@aws-sdk/client-s3'
import {SendMessageCommand, SQSClient} from '@aws-sdk/client-sqs'
import {marshall, unmarshall} from '@aws-sdk/util-dynamodb'
import {UserParams} from '../lib/types'
import {splitIntoChunks} from '../lib/utils'

const dynamoDbClient = new DynamoDBClient({region: 'eu-central-1'})
const cognitoClient = new CognitoIdentityProviderClient({region: 'eu-central-1'})
const s3Client = new S3Client({region: 'eu-central-1'})
const sqsClient = new SQSClient({region: 'eu-central-1'})

export const putItemIntoTable = <T extends Record<string, any>>(TableName: string,
                                                                Item: T) =>
    dynamoDbClient.send(new PutItemCommand({TableName, Item: marshall(Item)}))

export const deleteAllItemsFromTable = async (TableName: string, [pk, sk]: [pk: string, sk: string]) => {
    const scanCmd = new ScanCommand({TableName})
    const scanResult = await dynamoDbClient.send(scanCmd)
    if (scanResult.Items?.length) {
        const keys = scanResult.Items.map(v => unmarshall(v)).map(v => [v[pk], v[sk]])
        console.log(`Found [${scanResult.Items.length}] items with keys [${pk},${sk}]: ${keys.join('; ')}`)
        const deleteRequests = keys.map(([pkValue, skValue]) => ({
            DeleteRequest: {
                Key: marshall({
                    [pk]: pkValue,
                    [sk]: skValue,
                }),
            },
        }))
        const deleteRequestsInChunks = splitIntoChunks(deleteRequests, 25)
        const pendingDeleteRequests = deleteRequestsInChunks.map(chunk =>
            dynamoDbClient.send(new BatchWriteItemCommand({RequestItems: {[TableName]: chunk}})))
        for await (const chunk of pendingDeleteRequests) {
            await chunk
        }
        console.log(`Deleted [${scanResult.Items.length}] items from table [${TableName}]`)
    } else {
        console.log('No items to delete')
    }
}

export const putObjectIntoBucket = async (bucketName: string, s3Key: string, body: string) =>
    s3Client.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: s3Key,
        Body: body,
    }))

export const getItemFromTableWhenAttributeChange = async <T>(TableName: string,
                                                             itemKey: Partial<T>,
                                                             attrChange: (v: T) => boolean) => {
    const action = async () => {
        const output = await dynamoDbClient.send(new GetItemCommand({TableName, Key: marshall(itemKey)}))
        return output.Item ? unmarshall(output.Item) as T : null
    }
    return retryUntilConditionMet(
        action,
        (v) => v ? attrChange(v) : false,
        500,
        10)
}


export const getObjectFromBucket = async (bucketName: string, s3key: string) => {
    try {
        const output = await s3Client.send(new GetObjectCommand({
            Bucket: bucketName,
            Key: s3key,
        }))
        return output.Body
    } catch (err) {
        console.error('Object not found', err)
        return null
    }
}

export const deleteAllObjectsFromBucket = async (bucketName: string, s3prefix: string) => {
    const allS3Keys = await listBucket(bucketName, s3prefix)
    if (allS3Keys.length) {
        console.log(`Found [${allS3Keys.length}] objects with s3 keys: ${allS3Keys.join(', ')}`)
        await s3Client.send(new DeleteObjectsCommand({
            Bucket: bucketName,
            Delete: {
                Objects: allS3Keys.map(v => ({Key: v})),
            },
        }))
        console.log(`Deleted [${allS3Keys.length}] items from bucket [${bucketName}]`)
    } else {
        console.log('No objects to delete')
    }
}

const listBucket = async (bucketName: string,
                          prefix: string) => {
    const output = await s3Client.send(new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: prefix,
    }))
    return (output.Contents || []).map(c => c.Key as string)
}

export const authorize = async (userPoolClientId: string,
                                {email, password}: UserParams): Promise<AuthenticationResultType> => {
    const authResult = await cognitoClient.send(new InitiateAuthCommand({
        AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
        ClientId: userPoolClientId,
        AuthParameters: {
            USERNAME: email,
            PASSWORD: password,
        },
    }))
    return authResult.AuthenticationResult!
}

export const getUser = async (accessToken: string) =>
    cognitoClient.send(new GetUserCommand({
        AccessToken: accessToken,
    }))

export const sendMessageToQueue = <T extends Record<string, any>>(queueUrl: string,
                                                                  message: T) =>
    sqsClient.send(new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify(message),
    }))

const retryUntilConditionMet = async <T = any>(action: () => Promise<T>,
                                               condition: (v: T) => boolean,
                                               retryInterval = 500,
                                               maxAttemptCount = 10): Promise<T | null> => {
    let lastResult = null
    for (let attempted = 0; attempted < maxAttemptCount; attempted++) {
        if (attempted > 0) {
            await sleep(retryInterval)
        }
        const result = await action()
        if (condition(result)) {
            console.debug(`Condition met after [${attempted}] retry attempts at [${retryInterval}] ms intervals`)
            return result
        }
        lastResult = result
    }
    console.log(`Condition not met after [${maxAttemptCount}] retry attempts at [${retryInterval}] ms intervals. ` +
        `Result of Last invoked action: `, lastResult)
    return lastResult as T | null
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))