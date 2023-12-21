import {HttpError, post} from 'http-client'

const webhookUrl = process.env.WEBHOOK_URL as string
export const handler = async () => {
    const message = 'Alarm!!'

    try {
        await post(webhookUrl, {}, {content: message})
        return 'Notification sent to Discord.'
    } catch (err) {
        console.error('Error sending notification:', err)
        const {code, message, status} = err as HttpError
        console.error({code, message, status})
        throw new Error('Failed to send notification to Discord.')
    }
}