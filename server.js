require('dotenv').config();
const app = require('./app');
const db = require('./app/models');
const { initCleanupJob } = require('./app/jobs/cleanup.job');
const { initSyncJob } = require('./app/jobs/sync.job');

const PORT = parseInt(process.env.SERVER_PORT, 10) || parseInt(process.env.PORT, 10) || parseInt(process.argv[3], 10) || 3002;

async function startServer() {
    try {
        await db.sequelize.authenticate();
        console.info('Connected to PostgreSQL using Sequelize');

        // Sync models with database
        await db.sequelize.sync({ alter: true });
        console.info('Sequelize models synchronized successfully');

        // Initialize scheduled jobs
        initCleanupJob();
        initSyncJob();

        const server = app.listen(PORT, () => {
            console.info(`Server running and listening on http://localhost:${PORT}`);
        });

        const shutdown = async (signal) => {
            console.info(`\nReceived ${signal}. Shutting down gracefully...`);
            server.close(async () => {
                try {
                    await db.sequelize.close();
                    console.info('Database connection closed.');
                    process.exit(0);
                } catch (err) {
                    console.error('Error during database disconnect:', err);
                    process.exit(1);
                }
            });
        };

        process.on('SIGINT', () => shutdown('SIGINT'));
        process.on('SIGTERM', () => shutdown('SIGTERM'));

    } catch (e) {
        console.error('Failed to connect to database:', e);
        process.exit(1);
    }
}

startServer();