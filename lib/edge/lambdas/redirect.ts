import {extname} from 'path'

export async function handler(event: any) {
    const {request} = event.Records[0].cf
    if (!extname(request.uri)) {
        request.uri = '/index.html'
    }
    return request
}