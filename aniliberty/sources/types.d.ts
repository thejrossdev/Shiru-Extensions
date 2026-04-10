export interface AnilibertyResponse {
	torrents: AnilibertyTorrent[]
}

export interface AnilibertyTorrent {
	id: number
	hash: string
	size: number
	type: AnilibertyType
	label: string
	codec: AnilibertyCodec
	color: AnilibertyColor
	magnet: string
	seeders: number
	quality: AnilibertyQuality
	bitrate: any
	filename: string
	leechers: number
	sort_order: number
	created_at: string
	updated_at: string
	is_hardsub: boolean
	description: string
	completed_times: number
	release: AnilibertyRelease
}

export interface AnilibertyType {
	value: string
	description: string
}

export interface AnilibertyCodec {
	value: string
	label: string
	description: string
	label_color?: string
	label_is_visible: boolean
}

export interface AnilibertyColor {
	value: string
	description: string
}

export interface AnilibertyQuality {
	value: string
	description: string
}

export interface AnilibertyRelease {
	id: number
	type: AnilibertyType2
	year: number
	name: AnilibertyName
	alias: string
	season: AnilibertySeason
	poster: AnilibertyPoster
	fresh_at: string
	created_at: string
	updated_at: string
	is_ongoing: boolean
	age_rating: AnilibertyAgeRating
	publish_day: AnilibertyPublishDay
	description: string
	notification: any
	episodes_total: any
	external_player: any
	is_in_production: boolean
	is_blocked_by_geo: boolean
	is_blocked_by_copyrights: boolean
	added_in_users_favorites: number
	average_duration_of_episode: any
	added_in_planned_collection: number
	added_in_watched_collection: number
	added_in_watching_collection: number
	added_in_postponed_collection: number
	added_in_abandoned_collection: number
}

export interface AnilibertyType2 {
	value: string
	description: string
}

export interface AnilibertyName {
	main: string
	english: string
	alternative: any
}

export interface AnilibertySeason {
	value: string
	description: string
}

export interface AnilibertyPoster {
	src: string
	preview: string
	thumbnail: string
	optimized: AnilibertyOptimized
}

export interface AnilibertyOptimized {
	src: string
	preview: string
	thumbnail: string
}

export interface AnilibertyAgeRating {
	value: string
	label: string
	is_adult: boolean
	description: string
}

export interface AnilibertyPublishDay {
	value: number
	description: string
}

export interface AnilibertyQueryParams extends Object {
	key: string,
	value: string
}