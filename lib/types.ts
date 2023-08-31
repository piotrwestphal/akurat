import {
    distributionDomainNameEnvKey,
    restApiEndpointOutputKey,
    userPoolClientIdOutputKey,
    userPoolIdOutputKey,
} from './consts'

export type WebappDistributionParams = Readonly<{
    webappBucketName: string
    webappDistribution: Readonly<{
        domainName: string
        distributionId: string
    }>
}>

export type UserParams = Readonly<{
    email: string
    password: string
}>

export type Certificates = Readonly<{
    apiGwCertArn: string
    cloudFrontCertArn: string
}>

export type DistributionParams = Readonly<{
    distributionArtifactsS3KeyPrefix: string
    distributionParamsFilename: string
    certificates: Certificates
}>

export type UserMgmtParams = Readonly<{
    adminUsers: UserParams[]
    autoConfirmedEmails: string[]
    acceptedEmailDomains: string[]
}>

export type CdkOutputs = Readonly<{
    [restApiEndpointOutputKey]: string
    [userPoolClientIdOutputKey]: string
    [userPoolIdOutputKey]: string
    [distributionDomainNameEnvKey]: string
}>