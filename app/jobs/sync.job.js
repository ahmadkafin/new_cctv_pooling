const cron = require('node-cron');
const cameraService = require('../services/camera.service');

function initSyncJob() {
    const cronSchedule = process.env.SYNC_CRON_SCHEDULE || '*/1 * * * *'; // Default: every 1 minute
    const isSqlServerEnabled = Boolean(process.env.MSSQL_HOST);

    console.info(`[SyncJob] Scheduled camera sync worker with schedule "${cronSchedule}" (SQL Server Ingestion: ${isSqlServerEnabled ? 'ENABLED' : 'DISABLED'})`);

    // Run initial sync shortly after startup
    setTimeout(async () => {
        try {
            console.info('[SyncJob] Running initial camera synchronization cycle...');
            let result;
            if (isSqlServerEnabled) {
                result = await cameraService.executeFullSync();
                const sqlReport = result.sqlServerToPostgres;
                const mtxReport = result.postgresToMediaMTX;
                console.info(`[SyncJob] Initial sync complete. SQL Server -> PG (Inserted: ${sqlReport.inserted.length}, Updated: ${sqlReport.updated.length}). PG -> MediaMTX (Added: ${mtxReport.addedToMediaMTX.length}, Updated: ${mtxReport.updatedInMediaMTX.length}, Removed: ${mtxReport.removedFromMediaMTX.length})`);
            } else {
                result = await cameraService.syncToMediaMTX();
                console.info(`[SyncJob] Initial PG -> MediaMTX sync complete. (Added: ${result.addedToMediaMTX.length}, Updated: ${result.updatedInMediaMTX.length}, Removed: ${result.removedFromMediaMTX.length})`);
            }
        } catch (err) {
            console.warn('[SyncJob] Initial sync warning:', err.message);
        }
    }, 3000);

    // Schedule recurring sync cycle
    cron.schedule(cronSchedule, async () => {
        try {
            if (isSqlServerEnabled) {
                const result = await cameraService.executeFullSync();
                const sqlReport = result.sqlServerToPostgres;
                const mtxReport = result.postgresToMediaMTX;

                const hasChanges =
                    sqlReport.inserted.length > 0 ||
                    sqlReport.updated.length > 0 ||
                    mtxReport.addedToMediaMTX.length > 0 ||
                    mtxReport.updatedInMediaMTX.length > 0 ||
                    mtxReport.removedFromMediaMTX.length > 0;

                if (hasChanges) {
                    console.info(`[SyncJob] Sync cycle completed with changes: SQLServer->PG (Ins: ${sqlReport.inserted.length}, Upd: ${sqlReport.updated.length}) | PG->MediaMTX (Add: ${mtxReport.addedToMediaMTX.length}, Upd: ${mtxReport.updatedInMediaMTX.length}, Del: ${mtxReport.removedFromMediaMTX.length})`);
                }
            } else {
                const result = await cameraService.syncToMediaMTX();
                if (result.addedToMediaMTX.length > 0 || result.updatedInMediaMTX.length > 0 || result.removedFromMediaMTX.length > 0) {
                    console.info(`[SyncJob] PG -> MediaMTX sync completed: ${result.addedToMediaMTX.length} added, ${result.updatedInMediaMTX.length} updated, ${result.removedFromMediaMTX.length} removed.`);
                }
            }
        } catch (err) {
            console.warn('[SyncJob] Sync cycle warning:', err.message);
        }
    });
}

module.exports = { initSyncJob };
