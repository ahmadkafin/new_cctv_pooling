const axios = require('axios');

class MediaMTXService {
    constructor() {
        this.baseURL = process.env.MEDIAMTX_API_URL || 'http://localhost:9997';
        this.client = axios.create({
            baseURL: this.baseURL,
            timeout: 5000,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
    }

    /**
     * Check if MediaMTX Control API is reachable
     */
    async isReachable() {
        try {
            await this.client.get('/v3/paths/list', { params: { page: 0, itemsPerPage: 1 } });
            return true;
        } catch (err) {
            return false;
        }
    }

    /**
     * List all path configurations in MediaMTX
     * @returns {Promise<Array>} List of configured path objects
     */
    async listConfiguredPaths() {
        try {
            let allItems = [];
            let page = 0;
            let totalPages = 1;

            while (page < totalPages) {
                const response = await this.client.get('/v3/config/paths/list', {
                    params: { page, itemsPerPage: 100 }
                });
                const data = response.data || {};
                const items = data.items || [];
                allItems = allItems.concat(items);
                totalPages = data.pageCount || 1;
                page++;
            }

            return allItems;
        } catch (err) {
            console.error('[MediaMTX] Failed to list configured paths:', err.message);
            throw err;
        }
    }

    /**
     * Get configuration for a specific path
     * @param {string} name 
     */
    async getPathConfig(name) {
        try {
            const response = await this.client.get(`/v3/config/paths/get/${encodeURIComponent(name)}`);
            return response.data;
        } catch (err) {
            if (err.response && err.response.status === 404) {
                return null;
            }
            throw err;
        }
    }

    /**
     * Add a new path configuration to MediaMTX
     * @param {string} name Camera/path name
     * @param {Object} config Path configuration ({ source, record, ... })
     */
    async addPath(name, config) {
        try {
            const payload = {
                source: config.source,
                record: typeof config.record === 'boolean' ? config.record : true,
                ...config
            };
            const response = await this.client.post(`/v3/config/paths/add/${encodeURIComponent(name)}`, payload);
            return response.data;
        } catch (err) {
            console.error(`[MediaMTX] Failed to add path "${name}":`, err.response?.data || err.message);
            throw err;
        }
    }

    /**
     * Patch an existing path configuration
     * @param {string} name 
     * @param {Object} patchConfig 
     */
    async patchPath(name, patchConfig) {
        try {
            const response = await this.client.patch(`/v3/config/paths/patch/${encodeURIComponent(name)}`, patchConfig);
            return response.data;
        } catch (err) {
            console.error(`[MediaMTX] Failed to patch path "${name}":`, err.response?.data || err.message);
            throw err;
        }
    }

    /**
     * Upsert a path configuration (add if missing, patch if existing)
     * @param {string} name 
     * @param {Object} config 
     */
    async setPath(name, config) {
        const existing = await this.getPathConfig(name);
        if (existing) {
            // Check if updates are needed
            const needsUpdate = 
                existing.source !== config.source ||
                (typeof config.record === 'boolean' && existing.record !== config.record);

            if (needsUpdate) {
                return await this.patchPath(name, {
                    source: config.source,
                    record: typeof config.record === 'boolean' ? config.record : existing.record
                });
            }
            return existing;
        } else {
            return await this.addPath(name, config);
        }
    }

    /**
     * Remove a path configuration from MediaMTX
     * @param {string} name 
     */
    async deletePath(name) {
        try {
            const response = await this.client.delete(`/v3/config/paths/delete/${encodeURIComponent(name)}`);
            return response.data;
        } catch (err) {
            if (err.response && err.response.status === 404) {
                // Path already deleted or not found
                return null;
            }
            console.error(`[MediaMTX] Failed to delete path "${name}":`, err.response?.data || err.message);
            throw err;
        }
    }

    /**
     * List all live runtime paths in MediaMTX
     */
    async listActiveStreams() {
        try {
            const response = await this.client.get('/v3/paths/list');
            return response.data?.items || [];
        } catch (err) {
            console.error('[MediaMTX] Failed to list active streams:', err.message);
            throw err;
        }
    }

    /**
     * Get live runtime status for a specific stream
     * @param {string} name 
     */
    async getActiveStream(name) {
        try {
            const response = await this.client.get(`/v3/paths/get/${encodeURIComponent(name)}`);
            return response.data;
        } catch (err) {
            if (err.response && err.response.status === 404) {
                return null;
            }
            throw err;
        }
    }

    /**
     * Retrieve full stream health and diagnostic metrics
     * @param {string} name 
     */
    async getStreamHealth(name) {
        try {
            const [config, runtime] = await Promise.allSettled([
                this.getPathConfig(name),
                this.getActiveStream(name)
            ]);

            const configData = config.status === 'fulfilled' ? config.value : null;
            const runtimeData = runtime.status === 'fulfilled' ? runtime.value : null;

            const isConfigured = !!configData;
            const isLive = !!runtimeData;
            const isReady = !!runtimeData?.ready;

            return {
                name,
                configured: isConfigured,
                source: configData?.source || null,
                record: configData?.record ?? false,
                active: isLive,
                ready: isReady,
                readyTime: runtimeData?.readyTime || null,
                tracks: runtimeData?.tracks || [],
                bytesReceived: runtimeData?.bytesReceived || 0,
                readersCount: Array.isArray(runtimeData?.readers) ? runtimeData.readers.length : 0,
                status: isReady ? 'ONLINE' : (isConfigured ? (isLive ? 'CONNECTING' : 'OFFLINE') : 'UNCONFIGURED'),
                error: null
            };
        } catch (err) {
            return {
                name,
                configured: false,
                active: false,
                ready: false,
                status: 'ERROR',
                error: err.message
            };
        }
    }
}

module.exports = new MediaMTXService();
