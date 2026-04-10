import AbstractSource from './abstract.js'

export default new class Aniliberty extends AbstractSource {
	/**
	 * Base URL for the torrent source.
	 * Used by the validate() method to check source availability and should be used in the extensions query method.
	 */
	url = atob('aHR0cHM6Ly9hbmlsaWJyaWEudG9wL2FwaS92MQ==')
	routes = {
		status: `${this.url}/app/status`,
		torrentsRelease: `${this.url}/anime/torrents/release/`, // + "releaseId" - number
		release: `${this.url}/anime/releases/`, // + "alias" - string
		search: `${this.url}/app/search/releases` // + query= - string
	}
	
	/**
	 * Prepare title for api query
	 *
	 * @param {string} title
	 * @returns {string}
	 */
	#prepareTitle(title) {
		return title.toString().toLowerCase().replaceAll(/[-.,!?;:()\[\]{}<>«»„“'`"]/g, '').replaceAll(/\s+/g, ' ').replaceAll(' ', '-')
	}
	
	/**
	 * @param {string} route
	 * @param {array<AnilibertyQueryParams>} urlParams
	 *  @returns {string}
	 * */
	#buildQuery(route, urlParams = []) {
		const url = new URL(route)
		for (const urlParam in urlParams) {
			const {key, value} = urlParam
			url.searchParams.append(key, value)
		}
		return url.toString();
	}
	
	/**
	 * @param {import('./types').AnilibertyTorrent[]} entries
	 * @param {boolean} [batch=false]
	 * @returns {import('../index.json').TorrentResult[]}
	 **/
	#map(entries, batch = false) {
		return entries.map(({
			                    label,
			                    magnet,
			                    seeders = 0,
			                    leechers = 0,
			                    completed_times = 0,
			                    hash,
			                    size,
			                    updated_at
		                    }) => ({
			title: label,
			link: magnet,
			seeders: seeders >= 30000 ? 0 : seeders,
			leechers: leechers >= 30000 ? 0 : leechers,
			downloads: completed_times,
			hash,
			size,
			accuracy: (!batch) ? 'high' : 'medium',
			type: batch ? 'batch' : undefined,
			date: new Date(updated_at)
		}))
	}
	
	
	/**
	 * @param {string[]} titles
	 * @param {{ resolution?: string, exclusions?: string[], episodeCount?: number }} options
	 * @param {boolean} [batch=false]
	 * @returns {Promise<import('../index.json').TorrentResult[]>}
	 */
	async #query(titles, {resolution, exclusions, episode, episodeCount}, batch = false) {
		const filteredTitles = titles.filter(title => !/[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7ff]/.test(title.toString()))
		const torrents = [];
		
		for (const searchTitle of filteredTitles) {
			const res = await this.#tryGetReleaseByTitleOrId(searchTitle, batch)
			if (res && res.length > 0) {
				torrents.push(res);
			}
			await this.sleep(500)
		}
		
		// Try search if not found by alias (title)
		for (const searchTitle of filteredTitles) {
			const res = await this.#trySearchByTitle(searchTitle, batch)
			if (res && res.length > 0) {
				torrents.push(res);
				
				// When fond something it should be needed release
				return torrents;
			}
			await this.sleep(500)
		}
		
		return torrents
	}
	
	/**
	 * @param {string} titleOrId
	 * @param {boolean} [batch=false]
	 * @returns {Promise<import('../index.json').TorrentResult[]>}
	 */
	async #tryGetReleaseByTitleOrId(titleOrId, batch = false) {
		const url = this.routes.release + this.#prepareTitle(titleOrId) + '?include=torrents'
		const res = await fetch(this.#buildQuery(url))
		
		if (res?.ok) {
			try {
				const json = await res.json()
				if (json?.torrents) {
					return this.#map(json.torrents, batch)
				}
			} catch (e) {
			}
		}
		return [];
	}
	
	/**
	 * @param {string} title
	 * @param {boolean} [batch=false]
	 * @returns {Promise<import('../index.json').TorrentResult[]>}
	 */
	async #trySearchByTitle(title, batch = false) {
		const url = this.routes.search
		const searchParams = [
			{
				key: 'query',
				value: this.#prepareTitle(title)
			},
			{
				key: 'include',
				value: 'id,name,alias'
			}
		]
		const res = await fetch(this.#buildQuery(url, searchParams))
		
		if (res?.ok) {
			try {
				const json = await res.json()
				if (Array.isArray(json)) {
					const firstReleaseId = json[0]?.id
					if (firstReleaseId) {
						return this.#tryGetReleaseByTitleOrId(firstReleaseId, batch)
					}
				}
			} catch (e) {
			}
		}
		
		return [];
	}
	
	/** @type {import('../index.json').SearchFunction} */
	async single({anilistId, episode, episodeCount, titles, exclusions, resolution}) {
		return this.#query(titles, {resolution, exclusions, episode, episodeCount})
	}
	
	/** @type {import('../index.json').SearchFunction} */
	async batch({anilistId, episode, episodeCount, titles, exclusions, resolution}) {
		return this.#query(titles, {resolution, exclusions, episode, episodeCount}, true)
	}
	
	/** @type {import('../index.json').SearchFunction} */
	async movie(opts) {
		return [] // not really applicable for this type of search
	}
	
	/**
	 * Checks if the source URL is reachable.
	 *
	 * @remarks
	 * This method enables health checking and failover capabilities for sources.
	 * Implementations can validate against multiple fallback URLs and dynamically
	 * switch to a working endpoint for the current session when primary sources fail.
	 *
	 * @returns {() => Promise<boolean>} True if fetch succeeds.
	 */
	async validate() {
		return (await fetch(this.routes.status))?.ok
	}
	
	sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
}()