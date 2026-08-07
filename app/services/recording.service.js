const prisma = require('../config/prisma')
class RecordingService {
    async saveChunk({
        cameraName,
        filePath,
        fileName,
        fileSize,
        startTime
    }) {
        await prisma.camera.upsert({
            where: { name: cameraName },
            update: {},
            create: { name: cameraName }
        });

        return await prisma.recordingChunkcreate({
            data: {
                cameraId: cameraName,
                filePath,
                filename,
                fileSize: BigInt(fileSize),
                startTime: startTime ? new Date(startTime) : new Date(),
            }
        });
    }

    async getRecordingsByDate(cameraName, dateString) {
        const startOfDay = new Date(`${dateString}T00:00:00.000Z`)
        const endOfDay = new Date(`${dateString}T23:59:59.999Z`)

        const chunks = await prisma.recordingChunk.findMany({
            where: {
                cameraId: cameraName,
                startTime: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
            },
            orderBy: { startTime: 'asc' }
        });

        return chunks.map((chunk) => ({
            ...chunk,
            id: chunk.id.toString(),
            fileSize: chunk.fileSize.toString(),
            streamUrl: `/stream/${chunk.cameraId}/${chunk.fileName}`,
        }));
    }
}

module.exports = new RecordingService();