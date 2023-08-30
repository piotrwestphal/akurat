import { ApiGatewayEvent, ApiGatewayLambdaResponse } from '@lambda-types'
import {
    CognitoIdentityProviderClient,
    CognitoIdentityProviderServiceException,
    ListUsersCommand
} from '@aws-sdk/client-cognito-identity-provider'
import { toUserResponse } from './users.mapper'

const userPoolId = process.env.USER_POOL_ID as string
const awsRegion = process.env.AWS_REGION as string

const cognitoClient = new CognitoIdentityProviderClient({region: awsRegion})

export const handler = async ({
                                  pathParameters
                              }: ApiGatewayEvent): Promise<ApiGatewayLambdaResponse> => {
    const sub = pathParameters?.id!!
    try {
        const result = await cognitoClient.send(new ListUsersCommand({
            UserPoolId: userPoolId,
            Filter: `sub = "${sub}"`
        }))
        const users = result.Users || []
        if (users.length === 0) {
            return {
                statusCode: 404,
                body: JSON.stringify({message: `Resource with an id [${sub}] does not exist`}),
            }
        }
        return {
            statusCode: 200,
            body: JSON.stringify(toUserResponse(users[0])),
        }
    } catch (err) {
        console.error(`Error during fetching a user with sub [${sub}]`, JSON.stringify(err, null, 2))
        const {name, message} = err as CognitoIdentityProviderServiceException
        return {
            statusCode: 500,
            body: JSON.stringify({message: `${name}: ${message}`})
        }
    }
}