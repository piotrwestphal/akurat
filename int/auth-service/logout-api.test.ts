import * as request from 'supertest'
import { Response } from 'supertest'
import { testRestApiEndpoint } from '../config'
import { refreshTokenCookieKey, setCookieHeaderKey } from '../../lib/auth-service/auth.consts'

describe('User logout api tests', () => {

    const req = request(testRestApiEndpoint)

    test('GET "/auth/logout" should log out current user', async () => {

        await req.get('api/v1/auth/logout')
            .expect('Content-Type', /json/)
            .expect(200)
            .then((res: Response) => {
                const {[setCookieHeaderKey.toLowerCase()]: setCookieHeaderVals} = res.headers
                const setCookieHeader = setCookieHeaderVals[0] as string
                expect(setCookieHeader).toBeDefined()
                expect(setCookieHeader).toContain(`${refreshTokenCookieKey}=x`)
                expect(setCookieHeader).toContain('SameSite=Strict;')
                expect(setCookieHeader).toContain('Secure;')
                expect(setCookieHeader).toContain('HttpOnly;')
                expect(setCookieHeader).toContain(`Max-Age=0;`)
            })
    })
})