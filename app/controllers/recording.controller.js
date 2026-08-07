const recordingService = require('../services/recording.service');
const fs = require('fs')

class RecordingController {
    async handleSegmentCreated(req, res) {
        try {
            const cameraName = req.body.path || req.query.path || 'unknown';
            const filePath = req.body.file || req.query.file;

            if (!filePath) {
                return res.status(400).json({
                    status: 'error',
                    message: 'filePath missing'
                });
            }

            const stats = fs.statSync(filePath);
            const fileName = filePath.split('/').pop();

            const chunk = await recordingService.saveChunk({
                cameraName,
                filePath,
                fileName,
                fileSize: stats.size,
                startTime: stats.birthtime
            })
            return res.status(201).json({
                status: 201,
                message: 'created',
                data: {
                    id: chunk.id.toString()
                }
            });
        } catch (e) {
            return res.status(500).json({
                status: 500,
                message: e.message
            })
        }
    }

    async getDailyPlayback(req, res) {
        try {
            const { cameraName } = req.params;
            const { date } = req.query;

            if (!date) {
                return res.status(400).json({
                    message: "Query parameter date must be (YYYY-MM-DD) and mandatory"
                })
            }
            const recordings = await recordingService.getRecordingsByDate(cameraName, date);
            return res.status(200).json({
                status: 200,
                message: 'success',
                data: recordings,
            })
        } catch (e) {
            return res.status(500).json({
                status: 500,
                message: e.message,
            })
        }
    }
};

module.exports = new RecordingController();