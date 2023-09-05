#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from 'aws-cdk-lib'
import {RetentionDays} from 'aws-cdk-lib/aws-logs'
import {mainInitialData} from '../env/init-data'
import {BaseStack} from '../lib/base-stack'
import {testAcceptedEmailDomain, testAdminEmail, testAdminPassword, testAutoConfirmedEmail} from '../lib/consts'
import {EdgeStack} from '../lib/edge-stack'
import {RootStack} from '../lib/root-stack'

// when triggered on the GH actions it gives a unique name for the current PR
const cdkTestStackName = process.env.CDK_STACK_NAME as string || 'AkuratStack'

const app = new cdk.App()

new RootStack(app, 'AkuratRootStack', {
    description: 'Root infrastructure for the Akurat App',
    env: {account: '412644677543', region: 'eu-central-1'},
    artifactsBucketName: 'akurat-artifacts',
})

new EdgeStack(app, 'AkuratEdgeStack', {
    description: 'Edge infrastructure for the Akurat App',
    env: {account: '412644677543', region: 'us-east-1'},
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
        acceptedEmailDomains: ['gmail.com'],
    },
    logRetention: RetentionDays.ONE_WEEK,
    distribution: {
        distributionArtifactsS3KeyPrefix: 'distribution/dev',
        distributionParamsFilename: 'config.json',
        edgeLambdaVerArn: 'arn:aws:lambda:us-east-1:412644677543:function:AkuratEdgeStack-EdgeLambdaA5DBBF2D-t2lIV2FgBfLM:7',
        certArn: 'arn:aws:acm:us-east-1:412644677543:certificate/c394dec0-266f-456f-a43a-78e6a1a49677',
        domainPrefix: 'dev',
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
    mainInitialData,
    distribution: {
        distributionArtifactsS3KeyPrefix: 'distribution/prod',
        distributionParamsFilename: 'config.json',
        edgeLambdaVerArn: 'arn:aws:lambda:us-east-1:412644677543:function:AkuratEdgeStack-EdgeLambdaA5DBBF2D-t2lIV2FgBfLM:7',
        certArn: 'arn:aws:acm:us-east-1:412644677543:certificate/728c3af2-42d8-4e68-a599-aa5a23ce7997',
    },
})
