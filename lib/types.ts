import {ILayerVersion} from 'aws-cdk-lib/aws-lambda'
import {
    distributionDomainNameEnvKey, mainTableNameOutputKey,
    restApiEndpointOutputKey,
    userPoolClientIdOutputKey,
    userPoolIdOutputKey,
} from './consts'

export type LambdaLayerDef = { layerVer: ILayerVersion, moduleName: string }

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

export type UserMgmtParams = Readonly<{
    adminUsers: UserParams[]
    autoConfirmedEmails: string[]
    acceptedEmailDomains: string[]
}>

export type CdkOutputs = Readonly<{
    [mainTableNameOutputKey]: string
    [restApiEndpointOutputKey]: string
    [userPoolClientIdOutputKey]: string
    [userPoolIdOutputKey]: string
    [distributionDomainNameEnvKey]: string
}>