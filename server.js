require('dotenv').config();
const app = require('./app');
const prisma = require('./app/config/prisma');

const PORT = parseInt(process.env.SERVER_PORT) || process.argv[3] || 3002


async function startServer() {
    try {
        await prisma.$connect();
        console.info("Connected to PostgreSQL using Prisma");

        app.listen(PORT, () => {
            console.info(`Listening on http://localhost:${PORT}`)
        });
    } catch (e) {
        console.error('Failed to connect to database:', e);
        process.exit(1);
    }
}

startServer();