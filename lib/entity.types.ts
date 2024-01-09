import {MainPkValue, MainTable, ProfileType} from './consts'

export interface TimeStamps {
    readonly createdAt: number
    readonly updatedAt: number
}

export type ImgRef = Readonly<{
    id: string
    key: string
    ext: string
    width: number
    height: number
}>

export type ImageVariants = Readonly<{
    prvw: ImgRef        // preview
    orig: ImgRef        // original
    thmb: ImgRef        // thumbnail
}>

export interface ProfileEntity extends TimeStamps {
    readonly [MainTable.PK]: MainPkValue.PROFILE
    readonly [MainTable.SK]: string                 // cognito sub
    readonly profileType: ProfileType
    readonly email: string
    readonly displayName: string
    readonly instagramProfile: string
    readonly profileImage?: ImageVariants
}