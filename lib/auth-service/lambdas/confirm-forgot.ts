import { ApiGatewayEvent, ApiGatewayLambdaResponse } from '@lambda-types'
import { ConfirmForgotPasswordReq } from '../auth.types'
import {
    CodeMismatchException,
    CognitoIdentityProviderClient,
    CognitoIdentityProviderServiceException,
    ConfirmForgotPasswordCommand,
    ExpiredCodeException,
    InvalidPasswordException,
    LimitExceededException,
    UserNotFoundException
} from '@aws-sdk/client-cognito-identity-provider'

const userPoolClientId = process.env.USER_POOL_CLIENT_ID as string
const awsRegion = process.env.AWS_REGION as string

const cognitoClient = new CognitoIdentityProviderClient({region: awsRegion})

export const handler = async ({
                                  body
                              }: ApiGatewayEvent): Promise<ApiGatewayLambdaResponse> => {
    const {email, password, confirmationCode} = JSON.parse(body) as ConfirmForgotPasswordReq
    try {
        await cognitoClient.send(new ConfirmForgotPasswordCommand({
            ClientId: userPoolClientId,
            Username: email,
            Password: password,
            ConfirmationCode: confirmationCode,
        }))
        return {
            statusCode: 200,
            body: JSON.stringify({message: 'Password has been reset'}),
        }
    } catch (err) {
        console.error(`Error during a forgot password confirmation for a user with the email [${email}]`, JSON.stringify(err, null, 2))
        const {name, message} = err as CognitoIdentityProviderServiceException

        if (err instanceof UserNotFoundException) {
            return badRequest('User not found')
        }
        if (err instanceof InvalidPasswordException) {
            return badRequest(message)
        }
        if (err instanceof CodeMismatchException) {
            return badRequest(message)
        }
        if (err instanceof ExpiredCodeException) {
            return badRequest(message)
        }
        if (err instanceof LimitExceededException) {
            return badRequest(message)
        }
        return {
            statusCode: 500,
            body: JSON.stringify({message: `${name}: ${message}`})
        }
    }
}

const badRequest = (message: string) => ({
    statusCode: 400,
    body: JSON.stringify({message})
})