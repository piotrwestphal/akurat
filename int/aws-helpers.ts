import {
    AdminCreateUserCommand,
    AdminDeleteUserCommand,
    AuthenticationResultType,
    AuthFlowType,
    CognitoIdentityProviderClient, GetUserCommand,
    InitiateAuthCommand,
    MessageActionType,
    SignUpCommand,
    UserType,
} from '@aws-sdk/client-cognito-identity-provider'
import {BatchWriteItemCommand, DynamoDBClient, PutItemCommand, ScanCommand} from '@aws-sdk/client-dynamodb'
import {marshall, unmarshall} from '@aws-sdk/util-dynamodb'
import {UserParams} from '../lib/types'
import {splitIntoChunks} from '../lib/utils'

const dynamoDbClient = new DynamoDBClient({region: 'eu-central-1'})


const cognitoClient = new CognitoIdentityProviderClient({region: 'eu-central-1'})

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
        AccessToken: accessToken
    }))
export const registerUser = async (userPoolClientId: string,
                                   {email, password}: UserParams) =>
    cognitoClient.send(new SignUpCommand({
        ClientId: userPoolClientId,
        Username: email,
        Password: password,
    }))

export const createUser = async (userPoolId: string,
                                 email: string): Promise<UserType> => {
    const createUserResult = await cognitoClient.send(new AdminCreateUserCommand({
        UserPoolId: userPoolId,
        Username: email,
        MessageAction: MessageActionType.SUPPRESS,
    }))
    return createUserResult.User!
}

export const deleteUser = async (userPoolId: string,
                                 email: string) => {
    try {
        await cognitoClient.send(new AdminDeleteUserCommand({
            UserPoolId: userPoolId,
            Username: email,
        }))
        console.log(`User with an email [${email}] has been deleted`)
    } catch (err) {
        console.log(`There is no user with an email [${email}]`)
    }
}
