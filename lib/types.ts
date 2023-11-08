import {
    distributionDomainNameEnvKey,
    mainTableNameOutputKey,
    restApiEndpointOutputKey,
    userPoolClientIdOutputKey,
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

export type DistributionParams = Readonly<{
    distributionArtifactsS3KeyPrefix: string
    distributionParamsFilename: string
    edgeLambdaVerArn: string
    certArn: string
    domainPrefix?: string
}>

export type AuthServiceParams = Readonly<{
    userPoolIdParamName: string
}>

export type AuthServiceMockParams = Readonly<{
    testUser: UserParams
}>

export type CdkOutputs = Readonly<{
    [mainTableNameOutputKey]: string
    [restApiEndpointOutputKey]: string
    [userPoolClientIdOutputKey]: string
    [distributionDomainNameEnvKey]: string
}>
