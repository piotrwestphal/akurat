import {ProfileType} from '../consts'
import {TimeStamps} from '../entity.types'

export type ProfileBaseReq = Readonly<{
    profileType: ProfileType
    displayName: string
    instagramProfile: string
}>

export type ProfileCreateRequest = ProfileBaseReq
export type ProfileUpdateRequest = ProfileBaseReq
export type ProfileResponse = Readonly<{
    id: string
    email: string
}> & ProfileBaseReq & TimeStamps