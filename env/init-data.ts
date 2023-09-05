import {marshall} from '@aws-sdk/util-dynamodb'
import {faker} from '@faker-js/faker'
import {randomProfile} from '../int/mock-data'
import {ProfileEntity} from '../lib/entity.types'
import {splitIntoChunks} from '../lib/utils'

const entities: ProfileEntity[] = faker.helpers.multiple(randomProfile, {count: 200})
const putRequests = entities.map(v => ({PutRequest: {Item: marshall(v)}}))
const chunks = splitIntoChunks(putRequests, 25)

export const mainInitialData = Object.fromEntries(
    chunks.map((v, idx) => [`Profiles${idx}`, v]))