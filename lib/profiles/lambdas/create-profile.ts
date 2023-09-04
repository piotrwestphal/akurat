import {DynamoDBClient, DynamoDBServiceException, PutItemCommand} from '@aws-sdk/client-dynamodb'
import {marshall} from '@aws-sdk/util-dynamodb'
import {ApiGatewayEvent, ApiGatewayLambdaResponse} from '@lambda-types'
import {JwtVerifier} from 'jwt-verifier'
import {trimPath} from '../../utils'
import {ProfileCreateRequest} from '../profiles-mgmt.types'
import {toProfileEntity, toProfileResponse} from './profile.mapper'

const clientId = process.env.USER_POOL_CLIENT_ID as string
const userPoolId = process.env.USER_POOL_ID as string
const tableName = process.env.TABLE_NAME as string
const awsRegion = process.env.AWS_REGION as string

const dynamoClient = new DynamoDBClient({region: awsRegion})

const verifier = new JwtVerifier({
    userPoolId,
    clientId,
})
export const handler = async ({
                                  requestContext: {
                                      path,
                                  },
                                  body,
                                  headers: {Authorization},
                              }: ApiGatewayEvent): Promise<ApiGatewayLambdaResponse> => {
    const createRequest = JSON.parse(body) as ProfileCreateRequest
    try {
        const {sub, email} = await verifier.verify(Authorization)
        const itemToCreate = toProfileEntity({...createRequest, sub, email})

        console.log(`Creating profile for an email address [${email}]`)
        await dynamoClient.send(new PutItemCommand({
            TableName: tableName,
            Item: marshall(itemToCreate),
        }))
        console.log(`Profile for an email address [${email}] has been created. Item PK: [${itemToCreate.pk}] SK: [${itemToCreate.sk}]`)

        return {
            statusCode: 201,
            body: JSON.stringify(toProfileResponse(itemToCreate)),
            headers: {
                Location: `${trimPath(path)}/${itemToCreate.sk}`,
            },
        }
    } catch (err) {
        console.error(`Error during creating a profile for a current user`, JSON.stringify(err, null, 2))
        const {name, message} = err as DynamoDBServiceException
        return {
            statusCode: 500,
            body: JSON.stringify({message: `${name}: ${message}`}),
        }
    }
}