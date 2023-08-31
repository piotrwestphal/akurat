import { AttributeType, UserType } from '@aws-sdk/client-cognito-identity-provider'
import { UserRes, UserAttributeKey } from '../user-mgmt.types'

export const extractValue = (key: UserAttributeKey, attrs?: AttributeType[]) => attrs?.find(v => v.Name === key)?.Value

export const toUserResponse = ({
                               Username,
                               Attributes,
                               Enabled,
                               UserCreateDate,
                               UserLastModifiedDate,
                               UserStatus,
                           }: UserType): UserRes => ({
    username: Username!,
    sub: extractValue(UserAttributeKey.SUB, Attributes)!,
    email: extractValue(UserAttributeKey.EMAIL, Attributes)!,
    emailVerified: extractValue(UserAttributeKey.EMAIL_VERIFIED, Attributes) === 'true',
    enabled: Enabled!,
    status: UserStatus!,
    createdAt: new Date(UserCreateDate!).getTime(),
    updatedAt: new Date(UserLastModifiedDate!).getTime(),
})