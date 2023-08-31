import * as request from 'supertest'
import { Response } from 'supertest'
import { deleteUser } from '../aws-helpers'
import { testAcceptedEmailDomain, testAutoConfirmedEmail } from '../../lib/consts'
import { testCognitoUserPoolId, testRestApiEndpoint } from '../config'
import { AuthReq, ConfirmForgotPasswordReq, ForgotPasswordReq } from '../../lib/auth-service/auth.types'

describe('Confirm forgot password api tests', () => {

    const req = request(testRestApiEndpoint)

    test('POST "/auth/confirm-forgot" should not accept if wrong confirmation code', async () => {
        const signUpReq = {
            email: testAutoConfirmedEmail,
            password: 'testTest1',
        } satisfies AuthReq

        // Clean up
        await deleteUser(testCognitoUserPoolId, signUpReq.email)

        await req.post('v1/auth/signup')
            .send(signUpReq)
            .expect('Content-Type', /json/)
            .expect(200)

        await req.post('v1/auth/forgot')
            .send({email: signUpReq.email} satisfies ForgotPasswordReq)
            .expect('Content-Type', /json/)
            .expect(200)

        const confirmForgotReq = {
            email: signUpReq.email,
            password: 'NewPassword',
            confirmationCode: '123',
        } satisfies ConfirmForgotPasswordReq

        await req.post('v1/auth/confirm-forgot')
            .send(confirmForgotReq)
            .expect('Content-Type', /json/)
            .expect(400)
            .then((res: Response) => {
                expect(res.text).toMatch(/Invalid verification code provided, please try again/)
            })

        // Clean up
        await deleteUser(testCognitoUserPoolId, signUpReq.email)
    }, 15000)

    test(`POST "/auth/confirm-forgot" should not accept if no password forgotten notification has been sent`, async () => {
        const signUpReq = {
            email: testAutoConfirmedEmail,
            password: 'testTest1',
        } satisfies AuthReq

        // Clean up
        await deleteUser(testCognitoUserPoolId, signUpReq.email)

        await req.post('v1/auth/signup')
            .send(signUpReq)
            .expect('Content-Type', /json/)
            .expect(200)

        const confirmForgotReq = {
            email: signUpReq.email,
            password: 'NewPassword',
            confirmationCode: '123',
        } satisfies ConfirmForgotPasswordReq

        await req.post('v1/auth/confirm-forgot')
            .send(confirmForgotReq)
            .expect('Content-Type', /json/)
            .expect(400)
            .then((res: Response) => {
                expect(res.text).toMatch(/Invalid code provided, please request a code again/)
            })

        // Clean up
        await deleteUser(testCognitoUserPoolId, signUpReq.email)
    })

    test(`POST "/auth/confirm-forgot" should not accept if user is not confirmed`, async () => {
        const signUpReq = {
            email: `not.confirmed.user@${testAcceptedEmailDomain}`,
            password: 'testTest1',
        } satisfies AuthReq

        // Clean up
        await deleteUser(testCognitoUserPoolId, signUpReq.email)

        await req.post('v1/auth/signup')
            .send(signUpReq)
            .expect('Content-Type', /json/)
            .expect(200)

        const confirmForgotReq = {
            email: signUpReq.email,
            password: 'NewPassword',
            confirmationCode: '123',
        } satisfies ConfirmForgotPasswordReq

        await req.post('v1/auth/confirm-forgot')
            .send(confirmForgotReq)
            .expect('Content-Type', /json/)
            .expect(400)
            .then((res: Response) => {
                expect(res.text).toMatch(/Invalid code provided, please request a code again/)
            })

        // Clean up
        await deleteUser(testCognitoUserPoolId, signUpReq.email)
    })

    test(`POST "/auth/confirm-forgot" should not accept if user not found`, async () => {
        const confirmForgotReq = {
            email: `non-existing-user@${testAcceptedEmailDomain}`,
            password: 'NewPassword',
            confirmationCode: '123',
        } satisfies ConfirmForgotPasswordReq

        await req.post('v1/auth/confirm-forgot')
            .send(confirmForgotReq)
            .expect('Content-Type', /json/)
            .expect(400)
            .then((res: Response) => {
                expect(res.text).toMatch(/User not found/)
            })
    })

    test('POST "/auth/confirm-forgot" should not accept because of the missing field', async () => {
        const confirmForgotReq = {
            email: `any-user@${testAcceptedEmailDomain}`,
            password: 'NewPassword',
        } as ConfirmForgotPasswordReq

        await req.post('v1/auth/confirm-forgot')
            .send(confirmForgotReq)
            .expect('Content-Type', /json/)
            .expect(400)
            .then((res: Response) => {
                expect(res.text).toContain('object has missing required properties')
            })
    })

    test('POST "/auth/confirm-forgot" should not accept because of the extra field', async () => {
        const confirmForgotReq = {
            email: `any-user@${testAcceptedEmailDomain}`,
            password: 'NewPassword',
            confirmationCode: '123',
            extra: 'field'
        } as ConfirmForgotPasswordReq

        await req.post('v1/auth/confirm-forgot')
            .send(confirmForgotReq)
            .expect('Content-Type', /json/)
            .expect(400)
            .then((res: Response) => {
                expect(res.text).toContain('object instance has properties which are not allowed by the schema')
            })
    })
})
