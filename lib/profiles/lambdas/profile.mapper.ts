import {ProfileEntity} from '../../entity.types'
import {ProfileResponse} from '../profiles-mgmt.types'

export const toProfileResponse = ({
                                      sk,
                                      profileType,
                                      displayName,
                                      instagramProfile,
                                      createdAt,
                                      updatedAt,
                                  }: ProfileEntity): ProfileResponse => ({
    id: sk,
    profileType,
    displayName,
    instagramProfile,
    createdAt,
    updatedAt,
})