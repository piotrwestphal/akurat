type PreSignUpResponse = Readonly<{
    autoConfirmUser: boolean
    autoVerifyEmail: boolean
    autoVerifyPhone: boolean
}>

type PreSignUpEvent = {
    response: PreSignUpResponse
    readonly request: {
        userAttributes: { email: string }
    }
}

const autoConfirmedEmails = (process.env.AUTO_CONFIRMED_EMAILS || '').split(',')

export const handler = async (event: PreSignUpEvent): Promise<any> => {
    const userEmail = event.request.userAttributes.email

    if (autoConfirmedEmails.includes(userEmail)) {
        event.response = {...event.response, autoVerifyEmail: true, autoConfirmUser: true}
    }
    return event
}
