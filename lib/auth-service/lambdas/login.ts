import { ApiGatewayEvent, ApiGatewayLambdaResponse } from '@lambda-types'
import { AuthReq, AuthRes } from '../auth.types'
import {
    AuthFlowType,
    CognitoIdentityProviderClient,
    CognitoIdentityProviderServiceException,
    InitiateAuthCommand,
    NotAuthorizedException,
    UserNotConfirmedException,
    UserNotFoundException
} from '@aws-sdk/client-cognito-identity-provider'
import { refreshTokenCookieKey, refreshTokenValidityDurationDays } from '../auth.consts'

const userPoolClientId = process.env.USER_POOL_CLIENT_ID as string
const awsRegion = process.env.AWS_REGION as string

const cognitoClient = new CognitoIdentityProviderClient({region: awsRegion})
const refreshTokenValidityDurationSeconds = refreshTokenValidityDurationDays * 24 * 60 * 60

export const handler = async ({
                                  body
                              }: ApiGatewayEvent): Promise<ApiGatewayLambdaResponse> => {
    const {email, password} = JSON.parse(body) as AuthReq
    try {
        const authResult = await cognitoClient.send(new InitiateAuthCommand({
            AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
            ClientId: userPoolClientId,
            AuthParameters: {
                USERNAME: email,
                PASSWORD: password,
            },
        }))
        if (authResult.AuthenticationResult) {
            const {RefreshToken, IdToken, ExpiresIn, AccessToken} = authResult.AuthenticationResult

            return {
                statusCode: 200,
                body: JSON.stringify({
                    token: IdToken!,
                    expiresIn: ExpiresIn!,
                    accessToken: AccessToken!
                } satisfies AuthRes),
                headers: {
                    'Set-Cookie': `${refreshTokenCookieKey}=${RefreshToken}; SameSite=Strict; Secure; HttpOnly; Path=/; Max-Age=${refreshTokenValidityDurationSeconds};`
                }
            }
        }
        return errorResponse
    } catch (err) {
        console.error(`Error during logging in a user with the email [${email}]`, JSON.stringify(err, null, 2))
        if (err instanceof UserNotConfirmedException) {
            return {
                statusCode: 409,
                body: JSON.stringify({message: `User is not confirmed`})
            }
        }
        if (err instanceof NotAuthorizedException) {
            return errorResponse
        }
        if (err instanceof UserNotFoundException) {
            return errorResponse
        }
        const {name, message} = err as CognitoIdentityProviderServiceException
        return {
            statusCode: 500,
            body: JSON.stringify({message: `${name}: ${message}`})
        }
    }
}

const errorResponse = {
    statusCode: 400,
    body: JSON.stringify({message: `Incorrect username or password`})
}