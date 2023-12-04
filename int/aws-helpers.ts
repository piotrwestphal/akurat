import {
    AuthenticationResultType,
    AuthFlowType,
    CognitoIdentityProviderClient,
    GetUserCommand,
    InitiateAuthCommand,
} from '@aws-sdk/client-cognito-identity-provider'
import {BatchWriteItemCommand, DynamoDBClient, PutItemCommand, ScanCommand} from '@aws-sdk/client-dynamodb'
import {DeleteObjectsCommand, GetObjectCommand, ListObjectsV2Command, S3Client} from '@aws-sdk/client-s3'
import {marshall, unmarshall} from '@aws-sdk/util-dynamodb'
import {UserParams} from '../lib/types'
import {splitIntoChunks} from '../lib/utils'

const dynamoDbClient = new DynamoDBClient({region: 'eu-central-1'})
const cognitoClient = new CognitoIdentityProviderClient({region: 'eu-central-1'})
const s3Client = new S3Client({region: 'eu-central-1'})

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

export const getObjectFromBucket = async (bucketName: string, s3key: string) => {
    try {
        const output = await s3Client.send(new GetObjectCommand({
            Bucket: bucketName,
            Key: s3key
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