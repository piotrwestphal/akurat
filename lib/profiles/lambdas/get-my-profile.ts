import { DynamoDBClient, DynamoDBServiceException, GetItemCommand } from '@aws-sdk/client-dynamodb'
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb'
import {ApiGatewayEvent, ApiGatewayLambdaResponse} from '@lambda-types'
import {JwtVerifier} from 'jwt-verifier'
import {MainPkValue, MainTable} from '../../consts'
import {ProfileEntity} from '../../entity.types'
import {toProfileResponse} from './profile.mapper'

const clientId = process.env.USER_POOL_CLIENT_ID as string
const userPoolId = process.env.USER_POOL_ID as string
const tableName = process.env.TABLE_NAME as string
const awsRegion = process.env.AWS_REGION as string

const dynamoClient = new DynamoDBClient({region: awsRegion})

const verifier = JwtVerifier({
    userPoolId,
    clientId,
})

export const handler = async ({headers}: ApiGatewayEvent): Promise<ApiGatewayLambdaResponse> => {
    try {
        const authHeader = headers.Authorization
        const encodedToken = authHeader.includes('Bearer') ? authHeader.split(' ')[1] : authHeader
        // TODO: reuse jwt payload fields
        // {
        //   "sub": "48c516d4-b8c9-4f4b-8dda-b3988ff41040",
        //   "iss": "https://cognito-idp.eu-central-1.amazonaws.com/eu-central-1_LYir1iY1D",
        //   "cognito:username": "48c516d4-b8c9-4f4b-8dda-b3988ff41040",
        //   "origin_jti": "d8abff89-b5a0-4469-977f-2b6e4d31e586",
        //   "aud": "33qki9jqdhd0pibjbub1avm465",
        //   "event_id": "36a01835-8cc3-4347-a784-1dd581291ede",
        //   "token_use": "id",
        //   "auth_time": 1693827009,
        //   "exp": 1693851415,
        //   "iat": 1693850515,
        //   "jti": "15ed1900-b152-4bca-976c-190e6e3f49fc",
        //   "email": "piotr.westphal@gmail.com"
        // }
        const verifyResult = await verifier.verify(encodedToken)

        const result = await dynamoClient.send(new GetItemCommand({
            TableName: tableName,
            Key: marshall({
                [MainTable.PK]: MainPkValue.PROFILE,
                [MainTable.SK]: verifyResult.sub,
            }),
        }))

        if (!result.Item) {
            return {
                statusCode: 404,
                body: JSON.stringify({message: `Resource does not exist`}),
            }
        }

        const entity = unmarshall(result.Item) as ProfileEntity

        return {
            statusCode: 200,
            body: JSON.stringify(toProfileResponse(entity)),
        }
    } catch (err) {
        console.error(`Error during fetching a profile for current user with the current user access token`, JSON.stringify(err, null, 2))
        const {name, message} = err as DynamoDBServiceException
        return {
            statusCode: 500,
            body: JSON.stringify({message: `${name}: ${message}`}),
        }
    }
}