import {ProfileType} from '../consts'
import {ImageRef, TimeStamps} from '../entity.types'

export type ProfileBaseReq = Readonly<{
    profileType: ProfileType
    displayName: string
    instagramProfile: string
    profileImage: ImageRef
}>

export type ProfileCreateRequest = Omit<ProfileBaseReq, 'profileImage'> & { profileImage?: ImageRef }
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

export type UploadImageResponse = ImageRef