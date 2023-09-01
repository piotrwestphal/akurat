import {
    AdminCreateUserCommand,
    AdminDeleteUserCommand,
    AuthenticationResultType,
    AuthFlowType,
    CognitoIdentityProviderClient,
    InitiateAuthCommand,
    MessageActionType,
    SignUpCommand,
    UserType
} from '@aws-sdk/client-cognito-identity-provider'
import {UserParams} from '../lib/types'

const cognitoClient = new CognitoIdentityProviderClient({region: 'eu-central-1'})

const retryUntilConditionMet = async <T = any>(action: () => Promise<T>,
                                               condition: (v: T) => boolean,
                                               retryInterval = 500,
                                               maxAttemptCount = 10): Promise<T | null> => {
    let lastResult = null
    for (let attempted = 0; attempted < maxAttemptCount; attempted++) {
        if (attempted > 0) {
            await sleep(retryInterval)
        }
        const result = await action()
        if (condition(result)) {
            console.debug(`Condition met after [${attempted}] retry attempts at [${retryInterval}] ms intervals`)
            return result
        }
        lastResult = result
    }
    console.log(`Condition not met after [${maxAttemptCount}] retry attempts at [${retryInterval}] ms intervals. ` +
        `Result of Last invoked action: `, lastResult)
    return lastResult as T | null
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const authorize = async (userPoolClientId: string,
                                {email, password}: UserParams): Promise<AuthenticationResultType> => {
    const authResult = await cognitoClient.send(new InitiateAuthCommand({
        AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
        ClientId: userPoolClientId,
        AuthParameters: {
            USERNAME: email,
            PASSWORD: password,
        }
    }))
    return authResult.AuthenticationResult!
}

export const registerUser = async (userPoolClientId: string,
                                   {email, password}: UserParams) =>
    cognitoClient.send(new SignUpCommand({
        ClientId: userPoolClientId,
        Username: email,
        Password: password,
    }))

export const createUser = async (userPoolId: string,
                                 email: string): Promise<UserType> => {
    const createUserResult = await cognitoClient.send(new AdminCreateUserCommand({
        UserPoolId: userPoolId,
        Username: email,
        MessageAction: MessageActionType.SUPPRESS,
    }))
    return createUserResult.User!
}

export const deleteUser = async (userPoolId: string,
                                 email: string) => {
    try {
        await cognitoClient.send(new AdminDeleteUserCommand({
            UserPoolId: userPoolId,
            Username: email,
        }))
        console.log(`User with an email [${email}] has been deleted`)
    } catch (err) {
        console.log(`There is no user with an email [${email}]`)
    }
}
