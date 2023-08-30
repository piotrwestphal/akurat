import { cookieHeaderKey } from '../auth.consts'

export const getCookieValue = (headers: Record<string, string>, key: string) => {
    if (!headers[cookieHeaderKey]) {
        return ''
    }
    const cookieEntries = headers[cookieHeaderKey].split(';')
    const cookieMap = new Map(cookieEntries.map(v => v.split('=') as [string, string]))
    return cookieMap.get(key)
}