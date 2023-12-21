import {LayerVersion} from 'aws-cdk-lib/aws-lambda'
import {
    assetsBucketNameOutputKey,
    distributionDomainNameOutputKey,
    ImageType,
    mainTableNameOutputKey,
    restApiEndpointOutputKey,
    userPoolClientIdOutputKey,
} from './consts'
import {ImageVariants} from './entity.types'

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

export type AlarmsParams = Readonly<{
    webhookUrl: string
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
    [distributionDomainNameOutputKey]: string
    [assetsBucketNameOutputKey]: string
}>

export type LambdaLayerDef = Readonly<{
    layerVer: LayerVersion
    moduleName: string
}>

export type AlarmMessage = Readonly<{
    source: string
    payload: Readonly<{ message: string, details: string }>
}>

export type ProcessImageMessage = Readonly<{
    profileId: string
    type: ImageType
    imgVars: ImageVariants
}>