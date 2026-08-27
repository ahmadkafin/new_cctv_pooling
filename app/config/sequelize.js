require('dotenv').config();

module.exports = {
    DATABASE_URL: process.env.DATABASE_URL,
    HOST: process.env.PGSQL_HOST || 'localhost',
    USER: process.env.PGSQL_USER || 'postgres',
    PASSWORD: process.env.PGSQL_PASS || '',
    DB: process.env.PGSQL_DB || 'cctv_pooling',
    PORT: parseInt(process.env.PGSQL_PORT, 10) || 5432,
    SCHEMA: process.env.PGSQL_SCHEMA || 'public',
    DIALECT: process.env.PGSQL_DIALECT || 'postgres',
    pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
};