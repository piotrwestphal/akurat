import {DynamoDBClient, DynamoDBServiceException, QueryCommand} from '@aws-sdk/client-dynamodb'
import {marshall, unmarshall} from '@aws-sdk/util-dynamodb'
import {ApiGatewayEvent, ApiGatewayLambdaResponse} from '@lambda-types'
import {MainPkValue, MainTable} from '../../consts'
import {ProfileEntity} from '../../entity.types'
import {composeDynamoFilters, isInt} from '../../utils'
import {ProfilesResponse} from '../profiles-mgmt.types'
import {toProfileResponse} from './profile.mapper'

const tableName = process.env.TABLE_NAME as string

const dynamoClient = new DynamoDBClient()

type FilterAttrs = Array<keyof Pick<ProfileEntity, 'profileType'>>
const filterAttrs = ['profileType'] satisfies FilterAttrs
interface GetAllRequestEvent extends Omit<ApiGatewayEvent, 'queryStringParameters'> {
    queryStringParameters?: {
        type?: string
        limit?: string
        next?: string
    }
}
export const handler = async (ev: GetAllRequestEvent): Promise<ApiGatewayLambdaResponse> => {
    const profileType = ev.queryStringParameters?.type || ''
    const limit = ev.queryStringParameters?.limit || '50'
    const next = ev.queryStringParameters?.next || ''
    if (!isInt(limit)) {
        return {
            statusCode: 400,
            body: JSON.stringify({message: 'The limit parameter should be an int'})
        }
    }
    try {
        const {filterExp, expAttrVals, exprAttrNames} = composeDynamoFilters({profileType},filterAttrs)
        console.log({filterExp, expAttrVals, exprAttrNames})
        const result = await dynamoClient.send(new QueryCommand({
            TableName: tableName,
            KeyConditionExpression: `${MainTable.PK} = :pk`,
            FilterExpression: filterExp ? filterExp : undefined,
            ExpressionAttributeValues: marshall({
                ':pk': MainPkValue.PROFILE,
                ...expAttrVals,
            }),
            ExpressionAttributeNames: exprAttrNames ? {
                ...exprAttrNames
            } : undefined,
            Limit: parseInt(limit),
        }))
        console.log('COUNT: ', result.Items?.length)

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
