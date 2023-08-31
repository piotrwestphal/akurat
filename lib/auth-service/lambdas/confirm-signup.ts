import { ApiGatewayEvent, ApiGatewayLambdaResponse } from '@lambda-types'
import {
    CodeMismatchException,
    CognitoIdentityProviderClient,
    CognitoIdentityProviderServiceException,
    ConfirmSignUpCommand,
    NotAuthorizedException,
    UserNotFoundException
} from '@aws-sdk/client-cognito-identity-provider'
import { ConfirmSignupReq } from '../auth.types'

const userPoolClientId = process.env.USER_POOL_CLIENT_ID as string
const awsRegion = process.env.AWS_REGION as string

const cognitoClient = new CognitoIdentityProviderClient({region: awsRegion})

export const handler = async ({
                                  body
                              }: ApiGatewayEvent): Promise<ApiGatewayLambdaResponse> => {
    const {email, confirmationCode} = JSON.parse(body) as ConfirmSignupReq
    try {
        await cognitoClient.send(new ConfirmSignUpCommand({
            ClientId: userPoolClientId,
            Username: email,
            ConfirmationCode: confirmationCode
        }))
        return {
            statusCode: 200,
            body: JSON.stringify({message: 'The user account has been confirmed'}),
        }
    } catch (err) {
        console.error(`Error during fetching users`, JSON.stringify(err, null, 2))
        const {name, message} = err as CognitoIdentityProviderServiceException
        if (err instanceof UserNotFoundException) {
            return badRequest(err)
        }
        if (err instanceof NotAuthorizedException) {
            return badRequest(err)
        }
        if (err instanceof CodeMismatchException) {
            return badRequest(err)
        }
        return {
            statusCode: 500,
            body: JSON.stringify({message: `${name}: ${message}`})
        }
    }
}

const badRequest = (err: CognitoIdentityProviderServiceException) => ({
    statusCode: 400,
    body: JSON.stringify({message: err.message})
})
