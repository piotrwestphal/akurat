import { ApiGatewayEvent, ApiGatewayLambdaResponse } from '@lambda-types'
import { AuthReq, SignUpRes } from '../auth.types'
import {
    CognitoIdentityProviderClient,
    CognitoIdentityProviderServiceException,
    InvalidPasswordException,
    SignUpCommand,
    SignUpCommandOutput,
    UserLambdaValidationException,
    UsernameExistsException
} from '@aws-sdk/client-cognito-identity-provider'

const userPoolClientId = process.env.USER_POOL_CLIENT_ID as string
const awsRegion = process.env.AWS_REGION as string

const cognitoClient = new CognitoIdentityProviderClient({region: awsRegion})

export const handler = async ({
                                  body
                              }: ApiGatewayEvent): Promise<ApiGatewayLambdaResponse> => {
    const {email, password} = JSON.parse(body) as AuthReq
    try {
        const result = await cognitoClient.send(new SignUpCommand({
            ClientId: userPoolClientId,
            Username: email,
            Password: password,
        }))
        console.log(`A user account for the email address [${email}] has been successfully created.`)

        return {
            statusCode: 200,
            body: JSON.stringify(toResponse(result))
        }
    } catch (err) {
        console.error(`Error during signing up user with email [${email}]`, JSON.stringify(err, null, 2))
        if (err instanceof UsernameExistsException) {
            return badRequest(err)
        }
        if (err instanceof UserLambdaValidationException) {
            return {
                statusCode: 400,
                // original error message - `PreSignUp failed with error Email domain is not accepted.`
                body: JSON.stringify({message: 'Email domain is not accepted.'})
            }
        }
        if (err instanceof InvalidPasswordException) {
            return badRequest(err)
        }
        const {name, message} = err as CognitoIdentityProviderServiceException
        return {
            statusCode: 500,
            body: JSON.stringify({message: `${name}: ${message}`})
        }
    }
}

const toResponse = ({
                        UserSub,
                        UserConfirmed,
                        CodeDeliveryDetails,
                    }: SignUpCommandOutput): SignUpRes => {
    const codeDeliveryDetails = CodeDeliveryDetails
        ? {
            deliveryMedium: CodeDeliveryDetails.DeliveryMedium!,
            destination: CodeDeliveryDetails.Destination!,
        } satisfies SignUpRes['codeDeliveryDetails']
        : undefined
    return {
        userConfirmed: UserConfirmed!,
        userSub: UserSub!,
        codeDeliveryDetails
    }
}

const badRequest = (err: CognitoIdentityProviderServiceException) => ({
    statusCode: 400,
    body: JSON.stringify({message: err.message})
})
