const fs = require('fs');
const moment = require('moment');
const recordingService = require('../services/recording.service');

class RecordingController {
    async handleSegmentCreated(req, res) {
        try {
            const cameraName = req.body.path || req.query.path || req.body.name || req.body.cameraName || req.body.camera_name || 'unknown';
            const filePath = req.body.file || req.query.file || req.body.filePath || req.body.file_path || req.body.segmentPath;

            if (!filePath) {
                return res.status(400).json({
                    status: 400,
                    message: 'filePath is required (via body: file/filePath/segmentPath or query: file/path)'
                });
            }

            const fileName = req.body.fileName || req.body.file_name || filePath.split('/').pop().split('\\').pop();
            let fileSize = req.body.fileSize || req.body.file_size || req.body.size || 0;
            let startTime = req.body.startTime || req.body.start_time || req.body.time || null;

            try {
                if (fs.existsSync(filePath)) {
                    const stats = fs.statSync(filePath);
                    if (!fileSize) {
                        fileSize = stats.size;
                    }
                    if (!startTime) {
                        startTime = stats.birthtime || stats.mtime;
                    }
                }
            } catch (err) {
                console.warn(`[RecordingController] Unable to stat file at ${filePath}:`, err.message);
            }

            const chunk = await recordingService.saveChunk({
                cameraName,
                filePath,
                fileName,
                fileSize,
                startTime: startTime || new Date(),
                rtspUrl: req.body.rtspUrl || req.body.rtsp_url,
                location: req.body.location,
                duration: req.body.duration,
            });

            return res.status(201).json({
                status: 201,
                message: 'Recording chunk saved successfully',
                data: chunk
            });
        } catch (e) {
            console.error('[RecordingController] handleSegmentCreated error:', e);
            return res.status(500).json({
                status: 500,
                message: e.message
            });
        }
    }

    async getDailyPlayback(req, res) {
        try {
            const { cameraName } = req.params;
            const { date } = req.query;

            if (!date) {
                return res.status(400).json({
                    status: 400,
                    message: 'Query parameter date (YYYY-MM-DD) is mandatory'
                });
            }

            if (!moment(date, 'YYYY-MM-DD', true).isValid()) {
                return res.status(400).json({
                    status: 400,
                    message: 'Invalid date format. Expected YYYY-MM-DD'
                });
            }

            const result = await recordingService.getRecordingsByDate(cameraName, date);

            if (!result) {
                return res.status(404).json({
                    status: 404,
                    message: `Camera '${cameraName}' not found`,
                    data: null
                });
            }

            return res.status(200).json({
                status: 200,
                message: 'success',
                data: result
            });
        } catch (e) {
            console.error('[RecordingController] getDailyPlayback error:', e);
            return res.status(500).json({
                status: 500,
                message: e.message
            });
        }
    }

    async getAllCameras(req, res) {
        try {
            const cameras = await recordingService.getAllCameras();
            return res.status(200).json({
                status: 200,
                message: 'success',
                data: cameras
            });
        } catch (e) {
            console.error('[RecordingController] getAllCameras error:', e);
            return res.status(500).json({
                status: 500,
                message: e.message
            });
        }
    }
}

module.exports = new RecordingController();