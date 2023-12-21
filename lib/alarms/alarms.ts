import {NodejsFunction, NodejsFunctionProps} from 'aws-cdk-lib/aws-lambda-nodejs'
import {RetentionDays} from 'aws-cdk-lib/aws-logs'
import {Topic} from 'aws-cdk-lib/aws-sns'
import {LambdaSubscription} from 'aws-cdk-lib/aws-sns-subscriptions'
import {Construct} from 'constructs'
import {join} from 'path'
import {globalCommonLambdaProps} from '../cdk.consts'
import {awsSdkV3ModuleName} from '../consts'
import {AlarmsParams, LambdaLayerDef} from '../types'

type AlarmsProps = Readonly<{
    alarms: AlarmsParams
    alarmsTopic: Topic
    httpLayer: LambdaLayerDef
    logRetention: RetentionDays
}>

export class Alarms extends Construct {

    constructor(scope: Construct,
                id: string,
                {
                    alarms: {webhookUrl},
                    alarmsTopic,
                    httpLayer,
                    logRetention,
                }: AlarmsProps) {
        super(scope, id)

        const commonProps: Partial<NodejsFunctionProps> = {
            ...globalCommonLambdaProps,
            logRetention,
        }

        const generalAlarmFunc = new NodejsFunction(this, 'GeneralAlarmFunc', {
            description: 'Send a general alarm',
            entry: join(__dirname, 'lambdas', 'general-alarm.ts'),
            bundling: {
                // need to list all modules that should not be bundled
                externalModules: [httpLayer.moduleName, awsSdkV3ModuleName],
            },
            layers: [httpLayer.layerVer],
            environment: {
                WEBHOOK_URL: webhookUrl,
            },
            ...commonProps,
        })

        alarmsTopic.addSubscription(new LambdaSubscription(generalAlarmFunc))
    }
}