#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from 'aws-cdk-lib'
import {RootStack} from '../lib/root-stack'
import {BaseStack} from '../lib/base-stack'

const app = new cdk.App()

new RootStack(app, 'AkuratRootStack', {
    description: 'Root infrastructure for the Akurat App',
    env: {account: '412644677543', region: 'eu-central-1'},
    artifactsBucketName: 'akurat-artifacts'
})

new BaseStack(app, 'dev-AkuratStack', {
    description: 'Backend infrastructure for the Akurat App',
    env: {account: '412644677543', region: 'eu-central-1'},
    envName: 'dev',
    artifactsBucketName: 'akurat-artifacts'
})

new BaseStack(app, 'prod-AkuratStack', {
    description: 'Backend infrastructure for the Akurat App',
    env: {account: '412644677543', region: 'eu-central-1'},
    envName: 'prod',
    artifactsBucketName: 'akurat-artifacts',
    certificateArns: {
        apiGw: 'arn:aws:acm:eu-central-1:412644677543:certificate/06027de2-867f-4b00-aad5-096ebe9bb567',
        cloudFront: 'arn:aws:acm:us-east-1:412644677543:certificate/728c3af2-42d8-4e68-a599-aa5a23ce7997'
    }
})
