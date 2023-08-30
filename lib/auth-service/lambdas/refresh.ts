import { ApiGatewayEvent, ApiGatewayLambdaResponse } from '@lambda-types'
import { AuthRes } from '../auth.types'
import {
    AuthFlowType,
    CognitoIdentityProviderClient,
    CognitoIdentityProviderServiceException,
    InitiateAuthCommand, NotAuthorizedException
} from '@aws-sdk/client-cognito-identity-provider'
import { getCookieValue } from './utils'
import { refreshTokenCookieKey } from '../auth.consts'

const userPoolClientId = process.env.USER_POOL_CLIENT_ID as string
const awsRegion = process.env.AWS_REGION as string

const cognitoClient = new CognitoIdentityProviderClient({region: awsRegion})

export const handler = async ({
                                  headers,
                              }: ApiGatewayEvent): Promise<ApiGatewayLambdaResponse> => {
    const refreshToken = getCookieValue(headers, refreshTokenCookieKey)
    if (!refreshToken) {
        return {
            statusCode: 400,
            body: JSON.stringify({message: `Missing token`})
        }
    }

    try {
        const authResult = await cognitoClient.send(new InitiateAuthCommand({
            AuthFlow: AuthFlowType.REFRESH_TOKEN_AUTH,
            ClientId: userPoolClientId,
            AuthParameters: {
                REFRESH_TOKEN: refreshToken,
            },
        }))
        const {IdToken, ExpiresIn, AccessToken} = authResult.AuthenticationResult!
        return {
            statusCode: 200,
            body: JSON.stringify({token: IdToken!, expiresIn: ExpiresIn!, accessToken: AccessToken!} satisfies AuthRes),
        }
    } catch (err) {
        console.error(`Error during refreshing token`, JSON.stringify(err, null, 2))
        const {name, message} = err as CognitoIdentityProviderServiceException
        if (err instanceof NotAuthorizedException) {
            return {
                statusCode: 401,
                body: JSON.stringify({message: 'Invalid token'})
            }
        }
        return {
            statusCode: 500,
            body: JSON.stringify({message: `${name}: ${message}`})
        }
    }
}