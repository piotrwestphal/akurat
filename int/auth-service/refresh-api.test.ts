import * as request from 'supertest'
import { Response } from 'supertest'
import { testCognitoUserPoolClientId, testRestApiEndpoint } from '../config'
import { authorize } from '../aws-helpers'
import { testAdminEmail, testAdminPassword } from '../../lib/consts'
import { AuthReq, AuthRes } from '../../lib/auth-service/auth.types'

describe('Refresh token api tests', () => {

    const req = request(testRestApiEndpoint)

    test('GET "/auth/refresh" should receive refreshed tokens', async () => {
        const loginReq = {
            email: testAdminEmail,
            password: testAdminPassword,
        } satisfies AuthReq

        const {RefreshToken} = await authorize(testCognitoUserPoolClientId, loginReq)
        await req.get('api/v1auth/refresh')
            .set('Cookie', `token=${RefreshToken}`)
            .expect('Content-Type', /json/)
            .expect(200)
            .then((res: Response) => {
                const {token, expiresIn, accessToken} = res.body as AuthRes
                expect(token).toBeDefined()
                expect(expiresIn).toBe(900) // idToken expiration time in seconds
                expect(accessToken).toBeDefined()
            })
    })

    test('GET "/auth/refresh" should not accept if invalid token', async () => {
        await req.get('api/v1auth/refresh')
            .set('Cookie', `token=abc`)
            .expect('Content-Type', /json/)
            .expect(401)
            .then((res: Response) => {
                expect(res.text).toMatch(/Invalid token/)
            })
    })
})
