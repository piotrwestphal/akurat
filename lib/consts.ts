export const awsSdkV3ModuleName = '@aws-sdk'
export const mainTableNameOutputKey = 'MainTableName'
export const restApiEndpointOutputKey = 'RestApiEndpoint'
export const userPoolClientIdOutputKey = 'UserPoolClientId'
export const distributionDomainNameOutputKey = 'DistributionDomainName'
export const assetsBucketNameOutputKey = 'AssetsBucketName'
export const assetsBucketImagesS3Key = 'images'
export const assetsBucketTempS3Key = 'temp'
export const cloudfrontAssetsPrefix = 'res'

export const testAdminEmail = 'test@test.co'
export const testAdminPassword = 'testT3$t'

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

export enum ImageType {
    PROFILE = 'PROFILE',
}