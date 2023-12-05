import {MainPkValue, MainTable, ProfileType} from './consts'

export interface TimeStamps {
    readonly createdAt: number
    readonly updatedAt: number
}

export type ImageRef = Readonly<{
    key: string
    origKey: string
    thumbKey: string
}>

export interface ProfileEntity extends TimeStamps {
    readonly [MainTable.PK]: MainPkValue.PROFILE
    readonly [MainTable.SK]: string                 // cognito sub
    readonly email: string
    readonly profileType: ProfileType
    readonly displayName: string
    readonly instagramProfile: string
    readonly profilePhoto: ImageRef
}