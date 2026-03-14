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
    }

    /**
     * Prepare title for api query
     */
    #prepareTitle(title) {
        return title.trim().toLowerCase().replaceAll(' ', '-').replaceAll(':', '')
    }

    /**
     * @param {string} searchTitle
     *  @returns {string}
     * */
    async #buildQuery(searchTitle) {
        return this.routes.release + this.#prepareTitle(searchTitle) + '?include=torrents'
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
        const searchTitles = [titles['en'], titles['x-jat']]

        for (const searchTitle of searchTitles) {
            const res = await fetch(this.#buildQuery(searchTitle))
            if (res?.ok) {
                try {
                    const json = await res.json()
                    if (json?.torrents) {
                        return this.#map(json.torrents, batch)
                    }
                } catch (e) {
                }
            }
        }

        return []
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
}()