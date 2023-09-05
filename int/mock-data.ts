import {faker} from '@faker-js/faker'
import {randomUUID} from 'crypto'
import {MainPkValue, ProfileType} from '../lib/consts'
import {ProfileEntity} from '../lib/entity.types'

export const randomProfile = (): ProfileEntity => {
    const firstName = faker.person.firstName()
    const lastName = faker.person.lastName()
    return {
        pk: MainPkValue.PROFILE,
        sk: randomUUID(),
        profileType: faker.helpers.enumValue(ProfileType),
        displayName: `${firstName} ${lastName}`,
        email: faker.internet.email({firstName, lastName}),
        instagramProfile: faker.internet.userName({firstName, lastName}),
        createdAt: Date.now(),
        updatedAt: Date.now(),
    }
}