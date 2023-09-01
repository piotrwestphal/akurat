import { ApiGatewayEvent, ApiGatewayLambdaResponse } from '@lambda-types'

export const handler = async (_: ApiGatewayEvent): Promise<ApiGatewayLambdaResponse> => {
    try {
        return {
            statusCode: 200,
            body: JSON.stringify({message: 'User has been logged out'}),
            headers: {
                'Set-Cookie': `token=x; SameSite=Strict; Secure; HttpOnly; Path=/; Max-Age=0;`
            }
        }
    } catch (err) {
        console.error(`Error during logging out a user`, JSON.stringify(err, null, 2))
        const {name, message} = err as Error
        return {
            statusCode: 500,
            body: JSON.stringify({message: `${name}: ${message}`})
        }
    }
}