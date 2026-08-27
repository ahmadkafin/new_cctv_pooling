const { v4: uuidv4 } = require('crypto');
const db = require('../models');
const sqlserverService = require('./sqlserver.service');
const mediamtxService = require('./mediamtx.service');

const { Camera, RecordingChunks, Sequelize } = db;
const { Op } = Sequelize;

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

class CameraService {
    /**
     * Find camera by UUID ID, Integer SQL Server ID, or unique alias
     * @param {string|number} identifier 
     */
    async findByIdentifier(identifier) {
        if (!identifier) return null;

        const strIdentifier = String(identifier).trim();
        const isUUID = UUID_REGEX.test(strIdentifier);
        const isNumeric = /^\d+$/.test(strIdentifier);

        const conditions = [
            { alias: strIdentifier },
            { name: strIdentifier },
        ];

        if (isUUID) {
            conditions.push({ id: strIdentifier });
        }
        if (isNumeric) {
            conditions.push({ sqlServerId: parseInt(strIdentifier, 10) });
        }

        return await Camera.findOne({
            where: {
                [Op.or]: conditions
            }
        });
    }

    /**
     * Get all cameras from PostgreSQL with optional live stream diagnostics
     * @param {Object} options 
     */
    async getAllCameras({ includeHealth = false, availableOnly = false } = {}) {
        const whereClause = {};
        if (availableOnly) {
            whereClause.available = true;
        }

        const cameras = await Camera.findAll({
            where: whereClause,
            include: [{
                model: RecordingChunks,
                as: 'recordings',
                attributes: ['id']
            }],
            order: [['alias', 'ASC']]
        });

        const plainCameras = cameras.map(cam => {
            const plain = cam.get({ plain: true });
            return {
                id: plain.id,
                sqlServerId: plain.sqlServerId,
                alias: plain.alias,
                name: plain.name || plain.alias,
                rtsp: plain.rtsp,
                rtspUrl: plain.rtsp,
                wilayah: plain.wilayah,
                area: plain.area,
                location: cam.location,
                online: plain.online,
                ready: plain.ready,
                available: plain.available,
                isRecording: plain.isRecording,
                totalRecordings: plain.recordings ? plain.recordings.length : 0,
                createdAt: plain.createdAt,
                updatedAt: plain.updatedAt,
            };
        });

        if (!includeHealth) {
            return plainCameras;
        }

        // Fetch live stream diagnostics from MediaMTX concurrently
        const camerasWithHealth = await Promise.all(
            plainCameras.map(async (cam) => {
                if (!cam.available || !cam.rtsp) {
                    return {
                        ...cam,
                        streamHealth: {
                            status: 'DISABLED',
                            active: false,
                            ready: false,
                        }
                    };
                }
                const health = await mediamtxService.getStreamHealth(cam.alias);
                return {
                    ...cam,
                    streamHealth: health
                };
            })
        );

        return camerasWithHealth;
    }

    /**
     * Step 1: Synchronize cameras from SQL Server into PostgreSQL with Schema & ID Transformation
     * Integer ID (SQL Server) -> UUID PK (PostgreSQL) + sql_server_id tracking + alias routing key
     */
    async syncFromSqlServer() {
        const report = {
            startedAt: new Date().toISOString(),
            sqlServerTotal: 0,
            inserted: [],
            updated: [],
            unchanged: [],
            errors: []
        };

        try {
            // Fetch records from SQL Server
            const sqlServerRecords = await sqlserverService.fetchCameras();
            report.sqlServerTotal = sqlServerRecords.length;

            for (const record of sqlServerRecords) {
                try {
                    const sqlServerId = parseInt(record.id, 10);
                    const alias = (record.alias || `camera-${sqlServerId}`).trim();
                    const rtsp = record.rtsp ? record.rtsp.trim() : null;
                    const wilayah = record.wilayah ? record.wilayah.trim() : null;
                    const area = record.area ? record.area.trim() : null;
                    const online = Boolean(record.online);
                    const ready = Boolean(record.ready);
                    const available = record.available !== undefined ? Boolean(record.available) : true;

                    // Match camera by sqlServerId OR alias
                    let camera = await Camera.findOne({
                        where: {
                            [Op.or]: [
                                { sqlServerId: sqlServerId },
                                { alias: alias }
                            ]
                        }
                    });

                    if (!camera) {
                        // INSERT: Generate new UUID for PostgreSQL PK
                        const newCamera = await Camera.create({
                            sqlServerId: sqlServerId,
                            alias: alias,
                            name: alias,
                            rtsp: rtsp,
                            wilayah: wilayah,
                            area: area,
                            online: online,
                            ready: ready,
                            available: available,
                            isRecording: available, // Default recording to enabled when available
                        });
                        report.inserted.push({ id: newCamera.id, sqlServerId, alias });
                    } else {
                        // UPDATE: Retain existing PostgreSQL UUID id intact!
                        const hasChanges = 
                            camera.sqlServerId !== sqlServerId ||
                            camera.alias !== alias ||
                            camera.rtsp !== rtsp ||
                            camera.wilayah !== wilayah ||
                            camera.area !== area ||
                            camera.online !== online ||
                            camera.ready !== ready ||
                            camera.available !== available;

                        if (hasChanges) {
                            await camera.update({
                                sqlServerId: sqlServerId,
                                alias: alias,
                                name: alias,
                                rtsp: rtsp,
                                wilayah: wilayah,
                                area: area,
                                online: online,
                                ready: ready,
                                available: available,
                            });
                            report.updated.push({ id: camera.id, sqlServerId, alias });
                        } else {
                            report.unchanged.push({ id: camera.id, alias });
                        }
                    }
                } catch (recErr) {
                    report.errors.push({
                        recordId: record.id,
                        alias: record.alias,
                        error: recErr.message
                    });
                }
            }

            report.completedAt = new Date().toISOString();
            return report;
        } catch (err) {
            console.error('[CameraService] Fatal error during SQL Server -> PostgreSQL sync:', err);
            report.errors.push({ fatal: err.message });
            report.completedAt = new Date().toISOString();
            return report;
        }
    }

    /**
     * Step 2: Reconcile PostgreSQL Cameras with MediaMTX REST API using `alias` as the path key
     */
    async syncToMediaMTX() {
        const report = {
            startedAt: new Date().toISOString(),
            pgTotal: 0,
            activeInPg: 0,
            mediamtxTotal: 0,
            addedToMediaMTX: [],
            updatedInMediaMTX: [],
            removedFromMediaMTX: [],
            errors: []
        };

        try {
            const isOnline = await mediamtxService.isReachable();
            if (!isOnline) {
                report.errors.push('MediaMTX REST API is unreachable. Skipping MediaMTX sync cycle.');
                report.completedAt = new Date().toISOString();
                return report;
            }

            // 1. Fetch all PostgreSQL cameras
            const allPgCameras = await Camera.findAll();
            report.pgTotal = allPgCameras.length;

            const activeCameras = allPgCameras.filter(c => c.available && c.rtsp);
            report.activeInPg = activeCameras.length;

            const pgCameraMap = new Map(activeCameras.map(c => [c.alias, c]));

            // 2. Fetch all configured paths from MediaMTX
            const mtxPaths = await mediamtxService.listConfiguredPaths();
            report.mediamtxTotal = mtxPaths.length;
            const mtxPathMap = new Map(mtxPaths.map(p => [p.name, p]));

            // 3. Register or Update active PostgreSQL cameras in MediaMTX
            for (const camera of activeCameras) {
                const pathName = camera.alias;
                try {
                    const mtxConfig = mtxPathMap.get(pathName);

                    if (!mtxConfig) {
                        // Path does not exist in MediaMTX: Add it
                        await mediamtxService.addPath(pathName, {
                            source: camera.rtsp,
                            record: camera.isRecording
                        });
                        report.addedToMediaMTX.push(pathName);
                    } else {
                        // Path exists: Update if stream source or recording config changed
                        const isSourceDiff = mtxConfig.source !== camera.rtsp;
                        const isRecordDiff = mtxConfig.record !== camera.isRecording;

                        if (isSourceDiff || isRecordDiff) {
                            await mediamtxService.patchPath(pathName, {
                                source: camera.rtsp,
                                record: camera.isRecording
                            });
                            report.updatedInMediaMTX.push(pathName);
                        }
                    }
                } catch (err) {
                    report.errors.push({
                        alias: pathName,
                        action: 'add/update',
                        error: err.message
                    });
                }
            }

            // 4. Remove stale / unavailable paths from MediaMTX
            for (const mtxPath of mtxPaths) {
                const pathName = mtxPath.name;
                // Preserve internal / wildcard paths
                if (['all', 'all_others', '~^.*'].includes(pathName) || pathName.startsWith('~')) {
                    continue;
                }

                if (!pgCameraMap.has(pathName)) {
                    try {
                        await mediamtxService.deletePath(pathName);
                        report.removedFromMediaMTX.push(pathName);
                    } catch (err) {
                        report.errors.push({
                            alias: pathName,
                            action: 'delete',
                            error: err.message
                        });
                    }
                }
            }

            report.completedAt = new Date().toISOString();
            return report;
        } catch (err) {
            console.error('[CameraService] Fatal error during PostgreSQL -> MediaMTX sync:', err);
            report.errors.push({ fatal: err.message });
            report.completedAt = new Date().toISOString();
            return report;
        }
    }

    /**
     * Master End-to-End Synchronization:
     * SQL Server (Source) -> PostgreSQL (Transformer/Mirror) -> MediaMTX (Streamer)
     */
    async executeFullSync() {
        console.info('[SyncEngine] Starting full cross-database & streaming synchronization cycle...');
        
        // 1. Ingest & Transform from SQL Server into PostgreSQL
        const sqlServerToPgReport = await this.syncFromSqlServer();
        
        // 2. Reconcile PostgreSQL into MediaMTX
        const pgToMediaMtxReport = await this.syncToMediaMTX();

        return {
            timestamp: new Date().toISOString(),
            sqlServerToPostgres: sqlServerToPgReport,
            postgresToMediaMTX: pgToMediaMtxReport,
        };
    }

    /**
     * Stream Health & Diagnostic Monitoring for a camera by alias or ID
     */
    async getCameraHealth(identifier) {
        const camera = await this.findByIdentifier(identifier);
        if (!camera) {
            return null;
        }

        const streamHealth = await mediamtxService.getStreamHealth(camera.alias);
        return {
            camera: {
                id: camera.id,
                sqlServerId: camera.sqlServerId,
                alias: camera.alias,
                name: camera.name || camera.alias,
                wilayah: camera.wilayah,
                area: camera.area,
                rtsp: camera.rtsp,
                online: camera.online,
                ready: camera.ready,
                available: camera.available,
                isRecording: camera.isRecording
            },
            streamHealth
        };
    }

    /**
     * Create Camera locally and sync to MediaMTX
     */
    async createCamera(data) {
        const camera = await Camera.create({
            sqlServerId: data.sqlServerId ? parseInt(data.sqlServerId, 10) : null,
            alias: (data.alias || data.name).trim(),
            name: data.name ? data.name.trim() : (data.alias ? data.alias.trim() : null),
            rtsp: data.rtsp || data.rtspUrl || null,
            wilayah: data.wilayah || null,
            area: data.area || null,
            online: typeof data.online === 'boolean' ? data.online : false,
            ready: typeof data.ready === 'boolean' ? data.ready : false,
            available: typeof data.available === 'boolean' ? data.available : true,
            isRecording: typeof data.isRecording === 'boolean' ? data.isRecording : true,
        });

        if (camera.available && camera.rtsp) {
            try {
                await mediamtxService.setPath(camera.alias, {
                    source: camera.rtsp,
                    record: camera.isRecording
                });
            } catch (err) {
                console.warn(`[CameraService] Camera created in DB, but failed to sync to MediaMTX: ${err.message}`);
            }
        }

        return camera;
    }

    /**
     * Update Camera locally and sync to MediaMTX
     */
    async updateCamera(identifier, data) {
        const camera = await this.findByIdentifier(identifier);
        if (!camera) {
            return null;
        }

        const oldAlias = camera.alias;
        await camera.update({
            sqlServerId: data.sqlServerId !== undefined ? (data.sqlServerId ? parseInt(data.sqlServerId, 10) : null) : camera.sqlServerId,
            alias: data.alias ? data.alias.trim() : camera.alias,
            name: data.name !== undefined ? data.name : camera.name,
            rtsp: data.rtsp !== undefined ? data.rtsp : (data.rtspUrl !== undefined ? data.rtspUrl : camera.rtsp),
            wilayah: data.wilayah !== undefined ? data.wilayah : camera.wilayah,
            area: data.area !== undefined ? data.area : camera.area,
            online: typeof data.online === 'boolean' ? data.online : camera.online,
            ready: typeof data.ready === 'boolean' ? data.ready : camera.ready,
            available: typeof data.available === 'boolean' ? data.available : camera.available,
            isRecording: typeof data.isRecording === 'boolean' ? data.isRecording : camera.isRecording,
        });

        try {
            // If alias changed, remove old path from MediaMTX
            if (data.alias && data.alias !== oldAlias) {
                await mediamtxService.deletePath(oldAlias);
            }

            if (camera.available && camera.rtsp) {
                await mediamtxService.setPath(camera.alias, {
                    source: camera.rtsp,
                    record: camera.isRecording
                });
            } else {
                await mediamtxService.deletePath(camera.alias);
            }
        } catch (err) {
            console.warn(`[CameraService] Camera updated in DB, but failed to sync to MediaMTX: ${err.message}`);
        }

        return camera;
    }

    /**
     * Delete Camera locally and remove from MediaMTX
     */
    async deleteCamera(identifier) {
        const camera = await this.findByIdentifier(identifier);
        if (!camera) {
            return null;
        }

        const alias = camera.alias;
        await camera.destroy();

        try {
            await mediamtxService.deletePath(alias);
        } catch (err) {
            console.warn(`[CameraService] Camera deleted from DB, but failed to remove from MediaMTX: ${err.message}`);
        }

        return camera;
    }
}

module.exports = new CameraService();
