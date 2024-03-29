import {ProfileType} from '../consts'
import {ImageVariants, TimeStamps} from '../entity.types'

export type ProfileBaseReq = Readonly<{
    profileType: ProfileType
    displayName: string
    instagramProfile: string
    profileImage?: ImageVariants
}>

export type ProfileCreateRequest = ProfileBaseReq
export type ProfileUpdateRequest = ProfileBaseReq
export type ProfileResponse = Readonly<{
    id: string
    email: string
}> & ProfileBaseReq & TimeStamps

export type ProfilesResponse = Readonly<{
    items: ProfileResponse[]
    next?: string
}>

export type UploadImageRequest = Readonly<{
    image: string
}>

export type UploadImageResponse = ImageVariants