import { ApiGatewayEvent, ApiGatewayLambdaResponse } from '@lambda-types'
import { ForgotPasswordReq, ForgotPasswordRes } from '../auth.types'
import {
    CognitoIdentityProviderClient,
    CognitoIdentityProviderServiceException,
    ForgotPasswordCommand,
    ForgotPasswordCommandOutput,
    InvalidParameterException,
    UserNotFoundException
} from '@aws-sdk/client-cognito-identity-provider'

const userPoolClientId = process.env.USER_POOL_CLIENT_ID as string
const awsRegion = process.env.AWS_REGION as string

const cognitoClient = new CognitoIdentityProviderClient({region: awsRegion})

export const handler = async ({
                                  body
                              }: ApiGatewayEvent): Promise<ApiGatewayLambdaResponse> => {
    const {email} = JSON.parse(body) as ForgotPasswordReq
    try {
        const result = await cognitoClient.send(new ForgotPasswordCommand({
            ClientId: userPoolClientId,
            Username: email,
        }))

        return {
            statusCode: 200,
            body: JSON.stringify(toResponse(result))
        }
    } catch (err) {
        console.error(`Error during notifying about forgot password for a user with the email [${email}]`, JSON.stringify(err, null, 2))
        const {name, message} = err as CognitoIdentityProviderServiceException

        if (err instanceof UserNotFoundException) {
            return {
                statusCode: 400,
                body: JSON.stringify({message: `User not found`})
            }
        }

        if (err instanceof InvalidParameterException) {
            return {
                statusCode: 400,
                body: JSON.stringify({message})
            }
        }
        return {
            statusCode: 500,
            body: JSON.stringify({message: `${name}: ${message}`})
        }
    }
}

const toResponse = ({
                        CodeDeliveryDetails,
                    }: ForgotPasswordCommandOutput): ForgotPasswordRes => {
    return {
        codeDeliveryDetails: CodeDeliveryDetails
            ? {
                deliveryMedium: CodeDeliveryDetails.DeliveryMedium!,
                destination: CodeDeliveryDetails.Destination!,
            } satisfies ForgotPasswordRes['codeDeliveryDetails']
            : undefined
    }
}