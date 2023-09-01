import { ApiGatewayEvent, ApiGatewayLambdaResponse } from '@lambda-types'
import {
    AdminConfirmSignUpCommand,
    CognitoIdentityProviderClient,
    CognitoIdentityProviderServiceException
} from '@aws-sdk/client-cognito-identity-provider'
import { AdminConfirmUserReq } from '../../auth-service/auth.types'

const userPoolId = process.env.USER_POOL_ID as string
const awsRegion = process.env.AWS_REGION as string

const cognitoClient = new CognitoIdentityProviderClient({region: awsRegion})

export const handler = async ({
                                  body
                              }: ApiGatewayEvent): Promise<ApiGatewayLambdaResponse> => {
    const {email} = JSON.parse(body) as AdminConfirmUserReq
    try {
        await cognitoClient.send(new AdminConfirmSignUpCommand({
            Username: email,
            UserPoolId: userPoolId,
        }))
        return {
            statusCode: 200,
            body: JSON.stringify({message: 'The user account has been confirmed'}),
        }
    } catch (err) {
        console.error(`Error during confirming sign up for a user with the email [${email}]`, JSON.stringify(err, null, 2))
        const {name, message} = err as CognitoIdentityProviderServiceException
        return {
            statusCode: 500,
            body: JSON.stringify({message: `${name}: ${message}`})
        }
    }
}