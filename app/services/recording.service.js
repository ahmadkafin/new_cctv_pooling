const moment = require('moment');
const fs = require('fs');
const db = require('../models');

const { Camera, RecordingChunks, Sequelize } = db;
const { Op } = Sequelize;
const parselabel = require('../helpers/parse_label_into_name.helper')

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

class RecordingService {
    async saveChunk({
        cameraName,
        alias,
        filePath,
        fileName,
        fileSize,
        duration,
        startTime,
        rtspUrl,
        location,
    }) {
        const identifier = (alias || cameraName || 'unknown').trim();
        let camera = await Camera.findOne({
            where: {
                [Op.or]: [
                    { alias: identifier },
                    { name: identifier }
                ]
            }
        });

        if (!camera) {
            camera = await Camera.create({
                alias: identifier,
                name: identifier,
                rtsp: rtspUrl || null,
                wilayah: location || null,
                available: true,
                isRecording: true
            });
        }

        let calculatedStartTime = new Date();
        if (duration) {
            const durationInMs = parseFloat(duration) * 1000;
            calculatedStartTime = new Date(Date.now() - durationInMs);
        }

        const [chunk, created] = await RecordingChunks.findOrCreate({
            where: { filePath },
            defaults: {
                cameraId: camera.id,
                filePath,
                fileName: fileName || filePath.split('/').pop(),
                fileSize: fileSize ? BigInt(fileSize) : BigInt(0),
                duration: duration ? parseFloat(duration) : null,
                startTime: calculatedStartTime,
            }
        });

        if (!created) {
            await chunk.update({
                fileSize: fileSize ? BigInt(fileSize) : chunk.fileSize,
                duration: duration ? parseFloat(duration) : chunk.duration,
                startTime: startTime ? new Date(startTime) : chunk.startTime,
            });
        }

        const plain = chunk.get({ plain: true });
        return {
            ...plain,
            id: plain.id.toString(),
            fileSize: plain.fileSize ? plain.fileSize.toString() : '0',
            cameraAlias: camera.alias,
            cameraName: camera.name || camera.alias,
        };
    }

    async getRecordingsByDate(cameraIdentifier, dateString) {
        const isUUID = UUID_REGEX.test(cameraIdentifier);
        const camera = await Camera.findOne({
            where: {
                [Op.or]: [
                    { alias: cameraIdentifier },
                    { name: cameraIdentifier },
                    ...(isUUID ? [{ id: cameraIdentifier }] : [])
                ]
            }
        });

        if (!camera) {
            return null;
        }

        const startOfDay = moment(dateString).startOf('day').toDate();
        const endOfDay = moment(dateString).endOf('day').toDate();

        const chunks = await RecordingChunks.findAll({
            where: {
                cameraId: camera.id,
                startTime: {
                    [Op.gte]: startOfDay,
                    [Op.lte]: endOfDay,
                }
            },
            order: [['startTime', 'ASC']],
        });

        return {
            camera: {
                id: camera.id,
                sqlServerId: camera.sqlServerId,
                st_name: parselabel.parseLabelIntoName(camera.alias),
                alias: camera.alias,
                name: camera.name || camera.alias,
                wilayah: camera.wilayah,
                area: camera.area,
                location: camera.location,
                rtspUrl: camera.rtsp,
            },
            date: dateString,
            totalChunks: chunks.length,
            recordings: chunks.map((chunk) => {
                const plain = chunk.get({ plain: true });
                return {
                    id: plain.id.toString(),
                    cameraId: plain.cameraId,
                    filePath: plain.filePath,
                    fileName: plain.fileName,
                    fileSize: plain.fileSize ? plain.fileSize.toString() : '0',
                    duration: plain.duration,
                    startTime: plain.startTime,
                    createdAt: plain.createdAt,
                    streamUrl: `/recordings/${encodeURIComponent(camera.alias)}/${encodeURIComponent(plain.fileName)}`
                };
            })
        };
    }

    async getAllCameras() {
        const cameras = await Camera.findAll({
            include: [{
                model: RecordingChunks,
                as: 'recordings',
                attributes: ['id']
            }],
            order: [['name', 'ASC']]
        });

        return cameras.map(cam => {
            const plain = cam.get({ plain: true });
            return {
                id: plain.id,
                st_name: parselabel.parseLabelIntoName(plain.name),
                name: plain.name,
                location: plain.location,
                rtspUrl: plain.rtspUrl,
                totalRecordings: plain.recordings ? plain.recordings.length : 0,
                createdAt: plain.createdAt,
                updatedAt: plain.updatedAt,
            };
        });
    }

    async cleanOldRecordings(retentionDays = 7) {
        const cutoffDate = moment().subtract(retentionDays, 'days').toDate();

        const oldChunks = await RecordingChunks.findAll({
            where: {
                startTime: {
                    [Op.lt]: cutoffDate
                }
            }
        });

        let filesDeleted = 0;
        for (const chunk of oldChunks) {
            try {
                if (chunk.filePath && fs.existsSync(chunk.filePath)) {
                    fs.unlinkSync(chunk.filePath);
                    filesDeleted++;
                }
            } catch (err) {
                console.error(`Failed to delete recording file ${chunk.filePath}:`, err.message);
            }
        }

        const deletedRows = await RecordingChunks.destroy({
            where: {
                startTime: {
                    [Op.lt]: cutoffDate
                }
            }
        });

        return { deletedRows, filesDeleted, cutoffDate };
    }
}

module.exports = new RecordingService();