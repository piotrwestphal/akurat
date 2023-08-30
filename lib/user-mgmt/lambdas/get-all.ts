import { ApiGatewayEvent, ApiGatewayLambdaResponse } from '@lambda-types'
import {
    CognitoIdentityProviderClient,
    CognitoIdentityProviderServiceException,
    ListUsersCommand
} from '@aws-sdk/client-cognito-identity-provider'
import { toUserResponse } from './users.mapper'
import { UserListRes } from '../user-mgmt.types'

const userPoolId = process.env.USER_POOL_ID as string
const awsRegion = process.env.AWS_REGION as string

const cognitoClient = new CognitoIdentityProviderClient({region: awsRegion})

export const handler = async (_: ApiGatewayEvent): Promise<ApiGatewayLambdaResponse> => {
    try {
        const result = await cognitoClient.send(new ListUsersCommand({
            UserPoolId: userPoolId,
        }))
        return {
            statusCode: 200,
            body: JSON.stringify({items: (result.Users || []).map(v => toUserResponse(v))} satisfies UserListRes),
        }
    } catch (err) {
        console.error(`Error during fetching users`, JSON.stringify(err, null, 2))
        const {name, message} = err as CognitoIdentityProviderServiceException
        return {
            statusCode: 500,
            body: JSON.stringify({message: `${name}: ${message}`})
        }
    }
}

