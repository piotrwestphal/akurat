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
const acceptedDomainNames = (process.env.ACCEPTED_EMAIL_DOMAINS || '').split(',')

export const handler = async (event: PreSignUpEvent): Promise<any> => {
    const userEmail = event.request.userAttributes.email

    if (autoConfirmedEmails.includes(userEmail)) {
        event.response = {...event.response, autoVerifyEmail: true, autoConfirmUser: true}
        return event
    }

    const emailDomain = userEmail.split('@')[1]
    if (acceptedDomainNames.includes('*') || acceptedDomainNames.includes(emailDomain)) {
        return event
    }

    throw Error('Email domain is not accepted')
}