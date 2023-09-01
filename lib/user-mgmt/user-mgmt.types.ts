export type UserListRes = {
    items: UserRes[]
}

export type UserRes = Readonly<{
    username: string
    sub: string
    email: string
    emailVerified: boolean
    enabled: boolean
    createdAt: number
    updatedAt: number
    status: string
}>

export enum UserAttributeKey {
    SUB = 'sub',
    EMAIL = 'email',
    EMAIL_VERIFIED = 'email_verified',
}
