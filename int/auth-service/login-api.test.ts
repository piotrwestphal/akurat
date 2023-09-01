import * as request from 'supertest'
import { Response } from 'supertest'
import { deleteUser, registerUser } from '../aws-helpers'
import { testAcceptedEmailDomain, testAdminEmail, testAdminPassword } from '../../lib/consts'
import { testCognitoUserPoolClientId, testCognitoUserPoolId, testRestApiEndpoint } from '../config'
import { AuthReq, AuthRes } from '../../lib/auth-service/auth.types'
import {
    refreshTokenCookieKey,
    refreshTokenValidityDurationDays,
    setCookieHeaderKey
} from '../../lib/auth-service/auth.consts'

describe('User login api tests', () => {

    const req = request(testRestApiEndpoint)

    test('POST "/auth/login" should login', async () => {
        const loginReq = {
            email: testAdminEmail,
            password: testAdminPassword,
        } satisfies AuthReq

        await req.post('api/v1/auth/login')
            .send(loginReq)
            .expect('Content-Type', /json/)
            .expect(200)
            .then((res: Response) => {
                const {token, expiresIn, accessToken} = res.body as AuthRes
                expect(token).toBeDefined()
                expect(expiresIn).toBe(900) // idToken expiration time in seconds
                expect(accessToken).toBeDefined()

                const {[setCookieHeaderKey.toLowerCase()]: setCookieHeaderVals} = res.headers
                const setCookieHeader = setCookieHeaderVals[0] as string
                expect(setCookieHeader).toBeDefined()
                expect(setCookieHeader).toContain(`${refreshTokenCookieKey}=`)
                expect(setCookieHeader).toContain('SameSite=Strict;')
                expect(setCookieHeader).toContain('Secure;')
                expect(setCookieHeader).toContain('HttpOnly;')
                expect(setCookieHeader).toContain(`Max-Age=${refreshTokenValidityDurationDays * 24 * 60 * 60};`)
            })
    })

    test(`POST "/auth/login" should not accept if user is not confirmed`, async () => {
        const loginReq: AuthReq = {
            email: `kornwalia.pomidor@${testAcceptedEmailDomain}`,
            password: 'Passw0$rd',
        }
        // Clean up
        await deleteUser(testCognitoUserPoolId, loginReq.email)

        await registerUser(testCognitoUserPoolClientId, loginReq)
        await req.post('api/v1/auth/login')
            .send(loginReq)
            .expect(409)
            .then((res: Response) => {
                expect(res.text).toMatch(/User is not confirmed/)
            })

        // Clean up
        await deleteUser(testCognitoUserPoolId, loginReq.email)
    })

    test(`POST "/auth/login" should not accept if user doesn't exist in db`, async () => {
        const loginReq: AuthReq = {
            email: 'Milka@Walesa.com',
            password: 'Passw0$rd',
        }
        await req.post('api/v1/auth/login')
            .send(loginReq)
            .expect(400)
            .then((res: Response) => {
                expect(res.text).toMatch(/Incorrect username or password/)
            })
    })

    test(`POST "/auth/login" should not accept if email in the wrong format`, async () => {
        const loginReq: AuthReq = {
            email: 'Lech.Walesa.com',
            password: 'Wałęsa',
        }
        await req.post('api/v1/auth/login')
            .send(loginReq)
            .expect(400)
            .then((res: Response) => {
                expect(res.text).toMatch(/is not a valid email address/)
            })
    })

    test(`POST "/auth/login" should not accept if wrong password`, async () => {
        const loginReq: AuthReq = {
            email: testAdminEmail,
            password: `${testAdminPassword}!!`,
        }
        await req.post('api/v1/auth/login')
            .send(loginReq)
            .expect(400)
            .then((res: Response) => {
                expect(res.text).toMatch(/Incorrect username or password/)
            })
    })

    test('POST "/auth/login" should not accept because of the missing field', async () => {
        const loginReq = {
            email: 'Lech',
        } as AuthReq

        await req.post('api/v1/auth/login')
            .expect(400)
            .send(loginReq)
            .then((res: Response) => {
                expect(res.text).toContain('object has missing required properties')
            })
    })

    test('POST "/auth/login" should not accept because of the extra field', async () => {
        const loginReq = {
            email: 'Lech',
            password: 'Wałęsa',
            hack: 'let me in'
        } as AuthReq

        await req.post('api/v1/auth/login')
            .expect(400)
            .send(loginReq)
            .then((res: Response) => {
                expect(res.text).toContain('object instance has properties which are not allowed by the schema')
            })
    })
})
