import {DynamoDBClient, DynamoDBServiceException, QueryCommand} from '@aws-sdk/client-dynamodb'
import {marshall, unmarshall} from '@aws-sdk/util-dynamodb'
import {ApiGatewayEvent, ApiGatewayLambdaResponse} from '@lambda-types'
import {MainPkValue, MainTable} from '../../consts'
import {ProfileEntity} from '../../entity.types'
import {ProfilesResponse} from '../profiles-mgmt.types'
import {toProfileResponse} from './profile.mapper'

const tableName = process.env.TABLE_NAME as string
const awsRegion = process.env.AWS_REGION as string

const dynamoClient = new DynamoDBClient({region: awsRegion})

export const handler = async (_: ApiGatewayEvent): Promise<ApiGatewayLambdaResponse> => {
    try {
        const result = await dynamoClient.send(new QueryCommand({
            TableName: tableName,
            KeyConditionExpression: `${MainTable.PK} = :pk`,
            ExpressionAttributeValues: marshall({
                ':pk': MainPkValue.PROFILE,
            }),
            Limit: 50,
        }))

        const entities = (result.Items?.map(v => unmarshall(v)) || []) as ProfileEntity[]

        return {
            statusCode: 200,
            body: JSON.stringify({
                items: entities.map(v => toProfileResponse(v)),
                next: result.LastEvaluatedKey
                    ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64')
                    : undefined,
            } satisfies ProfilesResponse),
        }
    } catch (err) {
        console.error(`Error during fetching profiles`, JSON.stringify(err, null, 2))
        const {name, message} = err as DynamoDBServiceException
        return {
            statusCode: 500,
            body: JSON.stringify({message: `${name}: ${message}`}),
        }
    }
}
