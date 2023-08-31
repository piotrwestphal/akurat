#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from 'aws-cdk-lib'
import {RetentionDays} from 'aws-cdk-lib/aws-logs'
import {BaseStack} from '../lib/base-stack'
import {testAcceptedEmailDomain, testAdminEmail, testAdminPassword, testAutoConfirmedEmail} from '../lib/consts'
import {RootStack} from '../lib/root-stack'

// when triggered on the GH actions it gives a unique name for the current PR
const cdkTestStackName = process.env.CDK_STACK_NAME as string || 'AkuratStack'

const app = new cdk.App()

new RootStack(app, 'AkuratRootStack', {
    description: 'Root infrastructure for the Akurat App',
    env: {account: '412644677543', region: 'eu-central-1'},
    artifactsBucketName: 'akurat-artifacts',
})

new BaseStack(app, 'dev-AkuratStack', {
    description: '[dev] Backend infrastructure for the Akurat App',
    env: {account: '412644677543', region: 'eu-central-1'},
    envName: 'dev',
    artifactsBucketName: 'akurat-artifacts',
    userMgmt: {
        adminUsers: [
            {
                email: 'piotr.westphal@gmail.com',
                password: 'Passw0rd',
            },
        ],
        autoConfirmedEmails: [],
        acceptedEmailDomains: [],
    },
    logRetention: RetentionDays.ONE_WEEK,
    distribution: {
        distributionArtifactsS3KeyPrefix: 'distribution/dev',
        distributionParamsFilename: 'config.json',
        certificates: {
            apiGwCertArn: 'arn:aws:acm:eu-central-1:412644677543:certificate/06027de2-867f-4b00-aad5-096ebe9bb567',
            cloudFrontCertArn: 'arn:aws:acm:us-east-1:412644677543:certificate/728c3af2-42d8-4e68-a599-aa5a23ce7997',
        },
    },
})

new BaseStack(app, `int-${cdkTestStackName}`, {
    description: '[int] Backend infrastructure for the Akurat App',
    env: {account: '412644677543', region: 'eu-central-1'},
    envName: 'int',
    artifactsBucketName: 'akurat-artifacts',
    userMgmt: {
        adminUsers: [{email: testAdminEmail, password: testAdminPassword}],
        autoConfirmedEmails: [testAutoConfirmedEmail],
        acceptedEmailDomains: [testAcceptedEmailDomain],
    },
    logRetention: RetentionDays.ONE_WEEK,
})

new BaseStack(app, 'prod-AkuratStack', {
    description: '[prod] Backend infrastructure for the Akurat App',
    env: {account: '412644677543', region: 'eu-central-1'},
    envName: 'prod',
    artifactsBucketName: 'akurat-artifacts',
    userMgmt: {adminUsers: [], autoConfirmedEmails: [], acceptedEmailDomains: ['*']},
    logRetention: RetentionDays.ONE_MONTH,
    distribution: {
        distributionArtifactsS3KeyPrefix: 'distribution/prod',
        distributionParamsFilename: 'config.json',
        certificates: {
            apiGwCertArn: 'arn:aws:acm:eu-central-1:412644677543:certificate/06027de2-867f-4b00-aad5-096ebe9bb567',
            cloudFrontCertArn: 'arn:aws:acm:us-east-1:412644677543:certificate/728c3af2-42d8-4e68-a599-aa5a23ce7997',
        },
    },
})
