import * as request from 'supertest'
import {Response} from 'supertest'
import {MainTable, ProfileType, testAdminEmail} from '../../lib/consts'
import {ProfileCreateRequest, ProfileResponse} from '../../lib/profiles/profiles-mgmt.types'
import {deleteAllItemsFromTable} from '../aws-helpers'
import {authorizationHeaderKey, defaultUserToken, testMainTableName, testRestApiEndpoint} from '../config'

describe('Create a profile api tests', () => {

    const req = request(testRestApiEndpoint)

    beforeEach(async () => await deleteAllItemsFromTable(testMainTableName, [MainTable.PK, MainTable.SK]))

    test('POST "/profiles" should create a profile', async () => {
        const now = Date.now()

        const createReq = {
            profileType: ProfileType.BRAND,
            displayName: 'New Brand',
            instagramProfile: 'some-profile_Name',
        } satisfies ProfileCreateRequest

        await req.post('api/v1/profiles')
            .set(authorizationHeaderKey, defaultUserToken)
            .send(createReq)
            .expect('Content-Type', /json/)
            .expect(201)
            .then((res: Response) => {
                const {id, email, profileType, displayName, instagramProfile, createdAt, updatedAt}
                    = res.body as ProfileResponse
                expect(id).toBeDefined()
                const {location} = res.headers
                expect(location).toEqual(`/api/v1/profiles/${id}`)
                expect(email).toEqual(testAdminEmail)
                expect(profileType).toEqual(ProfileType.BRAND)
                expect(displayName).toEqual('New Brand')
                expect(instagramProfile).toEqual('some-profile_Name')
                expect(createdAt > now).toBeTruthy()
                expect(updatedAt > now).toBeTruthy()
            })
    })

    test('POST "/profiles" should not accept the profile because of the missing field', async () => {
        const createReq = {
            profileType: ProfileType.BRAND,
            instagramProfile: 'some-profile_Name',
        } as ProfileCreateRequest

        await req.post('api/v1/profiles')
            .set(authorizationHeaderKey, defaultUserToken)
            .send(createReq)
            .expect('Content-Type', /json/)
            .expect(400)
            .then((res: Response) => {
                expect(res.text).toContain('object has missing required properties')
            })
    })

    test('POST "/profiles" should not accept the profile because of the extra field', async () => {
        const createReq = {
            profileType: ProfileType.BRAND,
            displayName: 'New Brand',
            instagramProfile: 'some-profile_Name',
        } satisfies ProfileCreateRequest

        await req.post('api/v1/profiles')
            .set(authorizationHeaderKey, defaultUserToken)
            .send({...createReq, extraField: 'some-value'})
            .expect('Content-Type', /json/)
            .expect(400)
            .then((res: Response) => {
                expect(res.text).toContain('object instance has properties which are not allowed by the schema')
            })
    })

    test('POST "/profiles" should not accept the profile because of the wrong type', async () => {
        const createReq = {
            profileType: 'TEST' as ProfileType,
            displayName: 'New Brand',
            instagramProfile: 'some-profile_Name',
        } satisfies ProfileCreateRequest

        await req.post('api/v1/profiles')
            .set(authorizationHeaderKey, defaultUserToken)
            .send(createReq)
            .expect('Content-Type', /json/)
            .expect(400)
            .then((res: Response) => {
                expect(res.text).toContain('not found in enum')
            })
    })

    test('POST "/profiles" unauthorized', async () => {
        await req.post('api/v1/profiles')
            .expect(401)
            .then((res: Response) => {
                expect(res.text).toMatch(/Unauthorized/)
            })
    })

    test('POST "/profiles" forbidden', async () => {
        await req.post('api/v1/profiles')
            .set(authorizationHeaderKey, 'Basic mock')
            .expect(401)
            .then((res: Response) => {
                expect(res.text).toMatch(/Unauthorized/)
            })
    })
})
