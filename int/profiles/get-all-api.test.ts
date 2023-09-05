import * as request from 'supertest'
import {Response} from 'supertest'
import {authorizationHeaderKey} from '../../lib/auth-service/auth.consts'
import {MainTable} from '../../lib/consts'
import {ProfilesResponse} from '../../lib/profiles/profiles-mgmt.types'
import {deleteAllItemsFromTable, putItemIntoTable} from '../aws-helpers'
import {defaultUserToken, testMainTableName, testRestApiEndpoint} from '../config'
import {randomProfile} from '../mock-data'

describe('Get a user api tests', () => {

    const req = request(testRestApiEndpoint)

    beforeEach(async () => await deleteAllItemsFromTable(testMainTableName, [MainTable.PK, MainTable.SK]))

    test('GET "/profiles" should fetch a current user profile', async () => {
        const ent1 = randomProfile()
        const ent2 = randomProfile()
        const ent3 = randomProfile()
        const ent4 = randomProfile()
        const ent5 = randomProfile()
        await putItemIntoTable(testMainTableName, ent1)
        await putItemIntoTable(testMainTableName, ent2)
        await putItemIntoTable(testMainTableName, ent3)
        await putItemIntoTable(testMainTableName, ent4)
        await putItemIntoTable(testMainTableName, ent5)

        await req.get(`api/v1/profiles`)
            .set(authorizationHeaderKey, defaultUserToken)
            .expect('Content-Type', /json/)
            .expect(200)
            .then((res: Response) => {
                const {items, next} = res.body as ProfilesResponse
                expect(next).toBeUndefined()
                expect(items.length).toBe(5)
                expect(items.find(v => v.id === ent1.sk)).toBeDefined()
                expect(items.find(v => v.id === ent2.sk)).toBeDefined()
                expect(items.find(v => v.id === ent3.sk)).toBeDefined()
                expect(items.find(v => v.id === ent4.sk)).toBeDefined()
                expect(items.find(v => v.id === ent5.sk)).toBeDefined()
            })
    })

    test('GET "/profiles" unauthorized', async () => {
        await req.get(`api/v1/profiles`)
            .expect(401)
            .then((res: Response) => {
                expect(res.text).toMatch(/Unauthorized/)
            })
    })

    test('GET "/profiles" forbidden', async () => {
        await req.get(`api/v1/profiles`)
            .set(authorizationHeaderKey, 'mock')
            .expect(401)
            .then((res: Response) => {
                // expect(res.text).toMatch(/not authorized/)
                expect(res.text).toMatch(/Unauthorized/)
            })
    })
})
