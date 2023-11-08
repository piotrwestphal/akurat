#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib'
import {RetentionDays} from 'aws-cdk-lib/aws-logs'
import 'source-map-support/register'
import {BaseStack} from '../lib/base-stack'
import {testAdminEmail, testAdminPassword} from '../lib/consts'
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
    authService: {
        userPoolIdParamName: 'akurat/auth-service-mock/dev/user-pool-id',
    },
    distribution: {
        domainPrefix: 'dev',
        distributionArtifactsS3KeyPrefix: 'distribution/dev',
        distributionParamsFilename: 'config.json',
        edgeLambdaVerArn: 'arn:aws:lambda:us-east-1:412644677543:function:AkuratEdgeStack-EdgeLambdaA5DBBF2D-t2lIV2FgBfLM:7',
        certArn: 'arn:aws:acm:us-east-1:412644677543:certificate/c394dec0-266f-456f-a43a-78e6a1a49677',
    },
    logRetention: RetentionDays.ONE_WEEK,
})

new BaseStack(app, `int-${cdkTestStackName}`, {
    description: '[int] Backend infrastructure for the Akurat App',
    env: {account: '412644677543', region: 'eu-central-1'},
    envName: 'int',
    artifactsBucketName: 'akurat-artifacts',
    authService: {
        testUser: {email: testAdminEmail, password: testAdminPassword},
    },
    logRetention: RetentionDays.ONE_WEEK,
})

new BaseStack(app, 'prod-AkuratStack', {
    description: '[prod] Backend infrastructure for the Akurat App',
    env: {account: '412644677543', region: 'eu-central-1'},
    envName: 'prod',
    artifactsBucketName: 'akurat-artifacts',
    authService: {
        userPoolIdParamName: 'akurat/auth-service-mock/prod/user-pool-id',
    },
    distribution: {
        distributionArtifactsS3KeyPrefix: 'distribution/prod',
        distributionParamsFilename: 'config.json',
        edgeLambdaVerArn: 'arn:aws:lambda:us-east-1:412644677543:function:AkuratEdgeStack-EdgeLambdaA5DBBF2D-t2lIV2FgBfLM:7',
        certArn: 'arn:aws:acm:us-east-1:412644677543:certificate/728c3af2-42d8-4e68-a599-aa5a23ce7997',
    },
    logRetention: RetentionDays.ONE_MONTH,
})
