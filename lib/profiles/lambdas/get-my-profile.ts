import {DynamoDBClient, DynamoDBServiceException, GetItemCommand} from '@aws-sdk/client-dynamodb'
import {marshall, unmarshall} from '@aws-sdk/util-dynamodb'
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

const verifier = new JwtVerifier({
    userPoolId,
    clientId,
})

export const handler = async ({headers: {Authorization}}: ApiGatewayEvent): Promise<ApiGatewayLambdaResponse> => {
    try {
        const verifyResult = await verifier.verify(Authorization)
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
