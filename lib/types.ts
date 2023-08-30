export type WebappDistributionParams = Readonly<{
    webappBucketName: string
    webappDistribution: Readonly<{
        domainName: string
        distributionId:string
    }>
}>

export type UserParams = Readonly<{
    email: string
    password: string
}>

export type UserMgmtParams = Readonly<{
    adminUsers: UserParams[]
    autoConfirmedEmails: string[]
}>