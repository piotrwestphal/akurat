import * as request from 'supertest'
import { Response } from 'supertest'
import { deleteUser, registerUser } from '../aws-helpers'
import { testAcceptedEmailDomain, testAutoConfirmedEmail } from '../../lib/consts'
import { testCognitoUserPoolClientId, testCognitoUserPoolId, testRestApiEndpoint } from '../config'
import { ConfirmSignupReq } from '../../lib/auth-service/auth.types'

describe('Confirm user signup api tests', () => {

    const req = request(testRestApiEndpoint)

    test('POST "/auth/confirm-signup" should not accept if wrong confirmation code', async () => {
        const confirmSignupReq = {
            email: `adrian@${testAcceptedEmailDomain}`,
            confirmationCode: '123',
        } satisfies ConfirmSignupReq

        // Clean up
        await deleteUser(testCognitoUserPoolId, confirmSignupReq.email)

        await registerUser(testCognitoUserPoolClientId, {email: confirmSignupReq.email, password: 'Password1'})

        await req.post('v1/auth/confirm-signup')
            .send(confirmSignupReq)
            .expect('Content-Type', /json/)
            .expect(400)
            .then((res: Response) => {
                expect(res.text).toMatch(/Invalid verification code provided, please try again/)
            })

        // Clean up
        await deleteUser(testCognitoUserPoolId, confirmSignupReq.email)
    })

    test('POST "/auth/confirm-signup" should not accept if user does not exist', async () => {
        const confirmSignupReq = {
            email: `adrian@test.com`,
            confirmationCode: '123',
        } satisfies ConfirmSignupReq

        await req.post('v1/auth/confirm-signup')
            .send(confirmSignupReq)
            .expect('Content-Type', /json/)
            .expect(400)
            .then((res: Response) => {
                expect(res.text).toMatch(/Username\/client id combination not found/)
            })
    })

    test(`POST "/auth/confirm-signup" should not accept if user already confirmed`, async () => {
        const confirmSignupReq = {
            email: testAutoConfirmedEmail,
            confirmationCode: '123',
        } satisfies ConfirmSignupReq
        // Clean up
        await deleteUser(testCognitoUserPoolId, confirmSignupReq.email)

        await registerUser(testCognitoUserPoolClientId, {email: confirmSignupReq.email, password: 'Password1'})
        await req.post('v1/auth/confirm-signup')
            .send(confirmSignupReq)
            .expect(400)
            .then((res: Response) => {
                expect(res.text).toMatch(/User cannot be confirmed. Current status is CONFIRMED/)
            })

        // Clean up
        await deleteUser(testCognitoUserPoolId, confirmSignupReq.email)
    })

    test(`POST "/auth/confirm-signup" should not accept if email in the wrong format`, async () => {
        const confirmSignupReq: ConfirmSignupReq = {
            email: 'Lech.Walesa.com',
            confirmationCode: '123',
        }
        await req.post('v1/auth/confirm-signup')
            .send(confirmSignupReq)
            .expect(400)
            .then((res: Response) => {
                expect(res.text).toMatch(/is not a valid email address/)
            })
    })

    test('POST "/auth/confirm-signup" should not accept because of the missing field', async () => {
        const confirmSignupReq = {
            email: `Adrian@Mentzen.com`,
        } as ConfirmSignupReq

        await req.post('v1/auth/confirm-signup')
            .expect(400)
            .send(confirmSignupReq)
            .then((res: Response) => {
                expect(res.text).toContain('object has missing required properties')
            })
    })

    test('POST "/auth/confirm-signup" should not accept because of the extra field', async () => {
        const confirmSignupReq = {
            email: `Lech@${testAcceptedEmailDomain}`,
            confirmationCode: '123',
            hack: 'let me in'
        } as ConfirmSignupReq

        await req.post('v1/auth/confirm-signup')
            .expect(400)
            .send(confirmSignupReq)
            .then((res: Response) => {
                expect(res.text).toContain('object instance has properties which are not allowed by the schema')
            })
    })
})
