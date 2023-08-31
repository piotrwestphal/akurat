import * as request from 'supertest'
import { Response } from 'supertest'
import { testCognitoUserPoolId, defaultUserToken, testRestApiEndpoint } from '../config'
import { createUser, deleteUser } from '../aws-helpers'
import { randomUUID } from 'crypto'
import { testAcceptedEmailDomain } from '../../lib/consts'
import { UserRes } from '../../lib/user-mgmt/user-mgmt.types'
import { UserStatusType } from '@aws-sdk/client-cognito-identity-provider'
import { authorizationHeaderKey } from '../../lib/auth-service/auth.consts'

describe('Get a user api tests', () => {

    const req = request(testRestApiEndpoint)

    test('GET "/users/{id}" should fetch a user', async () => {
        const now = Date.now()
        const userEmail = `adela.kolano@${testAcceptedEmailDomain}`

        // Clean up
        await deleteUser(testCognitoUserPoolId, userEmail)

        const user = await createUser(testCognitoUserPoolId, userEmail)
        const userSub = user.Username

        await req.get(`v1/users/${userSub}`)
            .set(authorizationHeaderKey, defaultUserToken)
            .expect('Content-Type', /json/)
            .expect(200)
            .then((res: Response) => {
                const {username, sub, email, emailVerified, enabled, status, createdAt, updatedAt} = res.body as UserRes
                expect(username).toEqual(userSub)
                expect(sub).toEqual(userSub)
                expect(email).toEqual(userEmail)
                expect(emailVerified).toBeFalsy()
                expect(enabled).toBeTruthy()
                expect(status).toBe(UserStatusType.FORCE_CHANGE_PASSWORD)
                expect(createdAt > now).toBeTruthy()
                expect(updatedAt > now).toBeTruthy()
            })

        // Clean up
        await deleteUser(testCognitoUserPoolId, userEmail)
    })

    test('GET "/users/{id}" should not fetch a user with non-existing id', async () => {
        await req.get(`v1/users/${randomUUID()}`)
            .set(authorizationHeaderKey, defaultUserToken)
            .expect('Content-Type', /json/)
            .expect(404)
    })

    test('GET "/users/{id}" unauthorized', async () => {
        await req.get(`v1/users/${randomUUID()}`)
            .expect(401)
            .then((res: Response) => {
                expect(res.text).toMatch(/Unauthorized/)
            })
    })

    test('GET "/users/{id}" forbidden', async () => {
        await req.get(`v1/users/${randomUUID()}`)
            .set(authorizationHeaderKey, 'mock')
            .expect(401)
            // TODO
            // .expect(403)
            .then((res: Response) => {
                // expect(res.text).toMatch(/not authorized/)
                expect(res.text).toMatch(/Unauthorized/)
            })
    })
})
