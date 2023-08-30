export type WebappDistributionParams = Readonly<{
    webappBucketName: string
    webappDistribution: Readonly<{
        domainName: string
        distributionId:string
    }>
}>