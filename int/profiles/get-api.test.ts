import * as request from 'supertest'
import {Response} from 'supertest'
import {MainPkValue, MainTable, ProfileType, testAdminEmail} from '../../lib/consts'
import {ProfileEntity} from '../../lib/entity.types'
import {deleteAllItemsFromTable, getUser, putItemIntoTable} from '../aws-helpers'
import {
    authorizationHeaderKey,
    defaultAccessToken,
    defaultUserToken,
    testMainTableName,
    testRestApiEndpoint,
} from '../config'

describe('Get a user api tests', () => {

    const req = request(testRestApiEndpoint)

    beforeEach(async () => await deleteAllItemsFromTable(testMainTableName, [MainTable.PK, MainTable.SK]))

    test('GET "/profiles/me" should fetch a current user profile', async () => {
        const now = Date.now()

        const {Username} = await getUser(defaultAccessToken)

        const profileEntity = {
            pk: MainPkValue.PROFILE,
            sk: Username!,
            email: testAdminEmail,
            profileType: ProfileType.PHOTO,
            displayName: 'Test',
            instagramProfile: '',
            profileImage: {
                prvw: {id: '', key: '', ext: '', height: 0, width: 0},
                orig: {id: '', key: '', ext: '', height: 0, width: 0},
                thmb: {id: '', key: '', ext: '', height: 0, width: 0},
            },
            createdAt: now,
            updatedAt: now,
        } satisfies ProfileEntity

        await putItemIntoTable(testMainTableName, profileEntity)

        await req.get(`api/v1/profiles/me`)
            .set(authorizationHeaderKey, defaultUserToken)
            .expect('Content-Type', /json/)
            .expect(200)
    })

    test('GET "/profiles/me" should not fetch a current user profile if profile not exist', async () => {
        await req.get(`api/v1/profiles/me`)
            .set(authorizationHeaderKey, defaultUserToken)
            .expect('Content-Type', /json/)
            .expect(404)
    })

    test('GET "/profiles/me" unauthorized', async () => {
        await req.get(`api/v1/profiles/me`)
            .expect(401)
            .then((res: Response) => {
                expect(res.text).toMatch(/Unauthorized/)
            })
    })

    test('GET "/profiles/me" forbidden', async () => {
        await req.get(`api/v1/profiles/me`)
            .set(authorizationHeaderKey, 'mock')
            .expect(401)
            .then((res: Response) => {
                // expect(res.text).toMatch(/not authorized/)
                expect(res.text).toMatch(/Unauthorized/)
            })
    })
})
