import {MainPkValue} from '../../consts'
import {ProfileEntity} from '../../entity.types'
import {ProfileCreateRequest, ProfileResponse} from '../profiles-mgmt.types'

export const toProfileResponse = ({
                                      sk,
                                      email,
                                      profileType,
                                      displayName,
                                      instagramProfile,
                                      createdAt,
                                      updatedAt,
                                  }: ProfileEntity): ProfileResponse => ({
    id: sk,
    email,
    profileType,
    displayName,
    instagramProfile,
    createdAt,
    updatedAt,
})

export const toProfileEntity = ({
                                    profileType,
                                    displayName,
                                    instagramProfile,
                                    sub,
                                    email,
                                }: ProfileCreateRequest & Readonly<{ sub: string, email: string }>,
                                now = Date.now()): ProfileEntity => ({
    pk: MainPkValue.PROFILE,
    sk: sub,
    email,
    profileType,
    displayName,
    instagramProfile,
    createdAt: now,
    updatedAt: now,
})