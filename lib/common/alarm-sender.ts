import {PublishCommand, SNSClient} from '@aws-sdk/client-sns'
import {AlarmMessage} from '../types'

export const sendAlarm = (snsClient: SNSClient,
                          wellConfigurationTopicArn: string,
                          message: AlarmMessage) =>
    snsClient.send(new PublishCommand({
        TopicArn: wellConfigurationTopicArn,
        Message: JSON.stringify(message),
    }))