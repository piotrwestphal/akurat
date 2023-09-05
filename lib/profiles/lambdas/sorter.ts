import {ProfileType} from '../../consts'
import {ProfileEntity} from '../../entity.types'

export const defaultSort = (a: ProfileEntity, b: ProfileEntity) => {
    if (a.createdAt === b.createdAt) {
        if (a.displayName === b.displayName) {
            const keys = Object.keys(ProfileType)
            return keys.indexOf(a.profileType) > keys.indexOf(b.profileType) ? 1 : -1
        }
        return parseInt(a.displayName) - parseInt(b.displayName)
    }
    return a.createdAt > b.createdAt ? 1 : -1
}
