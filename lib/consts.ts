export const awsSdkV3ModuleName = '@aws-sdk'
export const mainTableNameOutputKey = 'MainTableName'
export const restApiEndpointOutputKey = 'RestApiEndpoint'
export const userPoolClientIdOutputKey = 'UserPoolClientId'
export const userPoolIdOutputKey = 'UserPoolId'
export const distributionDomainNameEnvKey = 'DistributionDomainName'

export const testAcceptedEmailDomain = 'test.co'
export const testAdminEmail = 'test@test.co'
export const testAdminPassword = 'testT3$t'
export const testAutoConfirmedEmail = 'korwin.miler@fake.com'

export enum MainTable {
    PK = 'pk',
    SK = 'sk'
}

export enum MainPkValue {
    PROFILE = 'PROFILE'
}

export enum ProfileType {
    MODEL = 'MODEL',
    PHOTO = 'PHOTO',
    BRAND = 'BRAND'
}