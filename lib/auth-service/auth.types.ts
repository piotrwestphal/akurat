export type AuthReq = Readonly<{
    email: string
    password: string
}>
export type AuthRes = Readonly<{ token: string, expiresIn: number, accessToken: string }>

export type AdminConfirmUserReq = Pick<AuthReq, 'email'>
export type ForgotPasswordReq = Pick<AuthReq, 'email'>
export type ForgotPasswordRes = Readonly<{
    codeDeliveryDetails?: Readonly<{
        deliveryMedium: string
        destination: string
    }>
}>
export type ConfirmForgotPasswordReq = AuthReq & Readonly<{ confirmationCode: string }>
export type ConfirmSignupReq = Pick<AuthReq, 'email'> & Readonly<{ confirmationCode: string }>

export type SignUpRes = Readonly<{
    userConfirmed: boolean
    userSub: string
    codeDeliveryDetails?: Readonly<{
        deliveryMedium: string
        destination: string
    }>
}>
