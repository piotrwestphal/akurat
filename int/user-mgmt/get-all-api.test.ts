import * as request from 'supertest'
import {Response} from 'supertest'
import {authorizationHeaderKey} from '../../lib/auth-service/auth.consts'
import {testAcceptedEmailDomain, testAdminEmail} from '../../lib/consts'
import {UserListRes} from '../../lib/user-mgmt/user-mgmt.types'
import {createUser, deleteUser} from '../aws-helpers'
import {testCognitoUserPoolId, defaultUserToken, testRestApiEndpoint} from '../config'

describe('Get all users api tests', () => {

    const req = request(testRestApiEndpoint)

    test('GET "/users" should fetch users', async () => {
        const userEmailA = `gumis.rumcajs@${testAcceptedEmailDomain}`
        const userEmailB = `walentyna.krystyna@${testAcceptedEmailDomain}`
        const userEmailC = `tateusz.rycyk@${testAcceptedEmailDomain}`

        // Clean up
        await deleteUser(testCognitoUserPoolId, userEmailA)
        await deleteUser(testCognitoUserPoolId, userEmailB)
        await deleteUser(testCognitoUserPoolId, userEmailC)

        const userA = await createUser(testCognitoUserPoolId, userEmailA)
        const userB = await createUser(testCognitoUserPoolId, userEmailB)
        const userC = await createUser(testCognitoUserPoolId, userEmailC)

        await req.get(`api/v1users`)
            .set(authorizationHeaderKey, defaultUserToken)
            .expect('Content-Type', /json/)
            .expect(200)
            .then((res: Response) => {
                const {items} = res.body as UserListRes
                expect(items.length).toBe(4)
                expect(items.find(v => v.email === userEmailA)!.sub).toBe(userA.Username)
                expect(items.find(v => v.email === userEmailB)!.sub).toBe(userB.Username)
                expect(items.find(v => v.email === userEmailC)!.sub).toBe(userC.Username)
                expect(items.find(v => v.email === testAdminEmail)).toBeDefined()
            })

        // Clean up
        await deleteUser(testCognitoUserPoolId, userEmailA)
        await deleteUser(testCognitoUserPoolId, userEmailB)
        await deleteUser(testCognitoUserPoolId, userEmailC)
    })

    test('GET "/users" unauthorized', async () => {
        await req.get(`api/v1users`)
            .expect(401)
            .then((res: Response) => {
                expect(res.text).toMatch(/Unauthorized/)
            })
    })

    test('GET "/users/{id}" forbidden', async () => {
        await req.get(`api/v1users`)
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
