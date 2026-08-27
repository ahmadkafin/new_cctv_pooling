const cron = require('node-cron');
const recordingService = require('../services/recording.service');

function initCleanupJob() {
    const retentionDays = parseInt(process.env.RETENTION_DAYS, 10) || 7;
    const cronSchedule = process.env.CLEANUP_CRON_SCHEDULE || '0 2 * * *'; // Run daily at 02:00 AM

    console.info(`[CleanupJob] Scheduled recording cleanup job with schedule "${cronSchedule}" (retention: ${retentionDays} days)`);

    cron.schedule(cronSchedule, async () => {
        console.info(`[CleanupJob] Running scheduled cleanup for recordings older than ${retentionDays} days...`);
        try {
            const result = await recordingService.cleanOldRecordings(retentionDays);
            console.info(`[CleanupJob] Cleanup finished: ${result.deletedRows} database records removed, ${result.filesDeleted} physical files deleted.`);
        } catch (err) {
            console.error('[CleanupJob] Error executing cleanup job:', err.message);
        }
    });
}

module.exports = { initCleanupJob };
