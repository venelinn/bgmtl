/**
 * Image type definitions for Cloudinary and general image usage
 */

export interface CloudinaryImage {
	src: string
	alt?: string
	width?: number
	height?: number
}

export interface ImageData {
	url?: string
	alt?: string
	width?: number
	height?: number
	[key: string]: any
}

export type ImageSource = CloudinaryImage | ImageData
