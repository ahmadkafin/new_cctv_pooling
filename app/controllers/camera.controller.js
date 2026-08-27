const cameraService = require('../services/camera.service');
const sqlserverService = require('../services/sqlserver.service');

class CameraController {
    async getAll(req, res) {
        try {
            const includeHealth = req.query.includeHealth === 'true' || req.query.health === '1';
            const availableOnly = req.query.availableOnly === 'true' || req.query.available === '1';
            const cameras = await cameraService.getAllCameras({ includeHealth, availableOnly });
            return res.status(200).json({
                status: 200,
                message: 'success',
                total: cameras.length,
                data: cameras
            });
        } catch (e) {
            console.error('[CameraController] getAll error:', e);
            return res.status(500).json({
                status: 500,
                message: e.message
            });
        }
    }

    async getById(req, res) {
        try {
            const { id } = req.params;
            const camera = await cameraService.findByIdentifier(id);
            if (!camera) {
                return res.status(404).json({
                    status: 404,
                    message: `Camera "${id}" not found`,
                    data: null
                });
            }
            return res.status(200).json({
                status: 200,
                message: 'success',
                data: camera
            });
        } catch (e) {
            console.error('[CameraController] getById error:', e);
            return res.status(500).json({
                status: 500,
                message: e.message
            });
        }
    }

    async create(req, res) {
        try {
            const { alias, name, rtsp, rtspUrl, wilayah, area, online, ready, available, isRecording } = req.body;
            const identifier = (alias || name || '').trim();

            if (!identifier) {
                return res.status(400).json({
                    status: 400,
                    message: 'Camera alias or name is required and cannot be empty'
                });
            }

            const existing = await cameraService.findByIdentifier(identifier);
            if (existing) {
                return res.status(409).json({
                    status: 409,
                    message: `Camera with alias/name "${identifier}" already exists`
                });
            }

            const camera = await cameraService.createCamera({
                alias: identifier,
                name: name || identifier,
                rtsp: rtsp || rtspUrl,
                wilayah,
                area,
                online,
                ready,
                available,
                isRecording
            });

            return res.status(201).json({
                status: 201,
                message: 'Camera created and registered in PostgreSQL and MediaMTX',
                data: camera
            });
        } catch (e) {
            console.error('[CameraController] create error:', e);
            return res.status(500).json({
                status: 500,
                message: e.message
            });
        }
    }

    async update(req, res) {
        try {
            const { id } = req.params;
            const updated = await cameraService.updateCamera(id, req.body);

            if (!updated) {
                return res.status(404).json({
                    status: 404,
                    message: `Camera "${id}" not found`,
                    data: null
                });
            }

            return res.status(200).json({
                status: 200,
                message: 'Camera updated and synchronized with MediaMTX',
                data: updated
            });
        } catch (e) {
            console.error('[CameraController] update error:', e);
            return res.status(500).json({
                status: 500,
                message: e.message
            });
        }
    }

    async delete(req, res) {
        try {
            const { id } = req.params;
            const deleted = await cameraService.deleteCamera(id);

            if (!deleted) {
                return res.status(404).json({
                    status: 404,
                    message: `Camera "${id}" not found`,
                    data: null
                });
            }

            return res.status(200).json({
                status: 200,
                message: 'Camera deleted and removed from MediaMTX',
                data: { id: deleted.id, alias: deleted.alias, name: deleted.name }
            });
        } catch (e) {
            console.error('[CameraController] delete error:', e);
            return res.status(500).json({
                status: 500,
                message: e.message
            });
        }
    }

    async getHealth(req, res) {
        try {
            const { id } = req.params;
            const health = await cameraService.getCameraHealth(id);

            if (!health) {
                return res.status(404).json({
                    status: 404,
                    message: `Camera "${id}" not found`,
                    data: null
                });
            }

            return res.status(200).json({
                status: 200,
                message: 'success',
                data: health
            });
        } catch (e) {
            console.error('[CameraController] getHealth error:', e);
            return res.status(500).json({
                status: 500,
                message: e.message
            });
        }
    }

    // Sync Endpoints
    async syncAll(req, res) {
        try {
            const result = await cameraService.executeFullSync();
            return res.status(200).json({
                status: 200,
                message: 'Full synchronization (SQL Server -> PostgreSQL -> MediaMTX) completed',
                data: result
            });
        } catch (e) {
            console.error('[CameraController] syncAll error:', e);
            return res.status(500).json({
                status: 500,
                message: e.message
            });
        }
    }

    async syncSqlServer(req, res) {
        try {
            const result = await cameraService.syncFromSqlServer();
            return res.status(200).json({
                status: 200,
                message: 'SQL Server to PostgreSQL synchronization completed',
                data: result
            });
        } catch (e) {
            console.error('[CameraController] syncSqlServer error:', e);
            return res.status(500).json({
                status: 500,
                message: e.message
            });
        }
    }

    async syncMediaMtx(req, res) {
        try {
            const result = await cameraService.syncToMediaMTX();
            return res.status(200).json({
                status: 200,
                message: 'PostgreSQL to MediaMTX synchronization completed',
                data: result
            });
        } catch (e) {
            console.error('[CameraController] syncMediaMtx error:', e);
            return res.status(500).json({
                status: 500,
                message: e.message
            });
        }
    }

    async testSqlServer(req, res) {
        try {
            const result = await sqlserverService.testConnection();
            return res.status(result.connected ? 200 : 503).json({
                status: result.connected ? 200 : 503,
                data: result
            });
        } catch (e) {
            return res.status(500).json({
                status: 500,
                message: e.message
            });
        }
    }
}

module.exports = new CameraController();
