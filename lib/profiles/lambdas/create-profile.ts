import {DynamoDBClient, DynamoDBServiceException, PutItemCommand} from '@aws-sdk/client-dynamodb'
import {SendMessageCommand, SQSClient} from '@aws-sdk/client-sqs'
import {marshall} from '@aws-sdk/util-dynamodb'
import {ApiGatewayEvent, ApiGatewayLambdaResponse} from '@lambda-types'
import {ImageType} from '../../consts'
import {ProcessImageMessage} from '../../types'
import {trimPath} from '../../utils'
import {ProfileCreateRequest} from '../profiles-mgmt.types'
import {toProfileEntity, toProfileResponse} from './profile.mapper'

const tableName = process.env.TABLE_NAME as string
const queueUrl = process.env.QUEUE_URL as string

const dynamoClient = new DynamoDBClient()
const sqsClient = new SQSClient()
export const handler = async ({
                                  body,
                                  requestContext: {
                                      path,
                                      authorizer: {
                                          claims,
                                      },
                                  },
                              }: ApiGatewayEvent): Promise<ApiGatewayLambdaResponse> => {
    const createRequest = JSON.parse(body) as ProfileCreateRequest
    try {
        const {sub, email} = claims
        const itemToCreate = toProfileEntity({...createRequest, sub, email})

        console.log(`Creating profile for an email address [${email}]`)
        await dynamoClient.send(new PutItemCommand({
            TableName: tableName,
            Item: marshall(itemToCreate),
        }))
        console.log(`Profile for an email address [${email}] has been created. Item PK: [${itemToCreate.pk}] SK: [${itemToCreate.sk}]`)

        if (itemToCreate.profileImage) {
            const msg = {
                profileId: itemToCreate.sk,
                type: ImageType.PROFILE,
                imgVars: itemToCreate.profileImage,
            } satisfies ProcessImageMessage

            console.log(`Sending a message to a msg queue with url [${queueUrl}] for the profile id [${itemToCreate.sk}]`)
            await sqsClient.send(new SendMessageCommand({
                QueueUrl: queueUrl,
                MessageBody: JSON.stringify(msg),
            }))
            console.log(`Successfully send message`)
        }

        return {
            statusCode: 201,
            body: JSON.stringify(toProfileResponse(itemToCreate)),
            headers: {
                Location: `${trimPath(path)}/${itemToCreate.sk}`,
            },
        }
    } catch (err) {
        console.error(`Error during creating a profile for an email address [${claims.email}]`, JSON.stringify(err, null, 2))
        const {name, message} = err as DynamoDBServiceException
        return {
            statusCode: 500,
            body: JSON.stringify({message: `${name}: ${message}`}),
        }
    }
}