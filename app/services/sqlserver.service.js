class SqlServerService {
    constructor() {
        this.config = {
            user: process.env.MSSQL_USER || 'sa',
            password: process.env.MSSQL_PASS || '',
            server: process.env.MSSQL_HOST || 'localhost',
            database: process.env.MSSQL_DB || 'cctv_master',
            port: parseInt(process.env.MSSQL_PORT, 10) || 1433,
            options: {
                encrypt: process.env.MSSQL_ENCRYPT === 'true',
                trustServerCertificate: true,
                connectTimeout: 10000,
                requestTimeout: 30000,
            },
            pool: {
                max: 10,
                min: 0,
                idleTimeoutMillis: 30000
            }
        };
        this.tableName = process.env.MSSQL_TABLE || 'cctv';
        this.pool = null;
    }

    /**
     * Get or create a connected SQL Server connection pool
     */
    async getPool() {
        let sql;
        try {
            sql = require('mssql');
        } catch (e) {
            throw new Error('The "mssql" package is required to connect to SQL Server. Please run "npm install mssql".');
        }

        if (!this.pool || !this.pool.connected) {
            this.pool = await new sql.ConnectionPool(this.config).connect();
        }
        return this.pool;
    }

    /**
     * Test connection to SQL Server
     */
    async testConnection() {
        try {
            const pool = await this.getPool();
            const result = await pool.request().query('SELECT 1 AS connected');
            return {
                connected: true,
                message: 'Successfully connected to SQL Server',
                server: this.config.server,
                database: this.config.database
            };
        } catch (err) {
            return {
                connected: false,
                message: err.message,
                server: this.config.server,
                database: this.config.database
            };
        }
    }

    /**
     * Fetch all CCTV camera records from SQL Server
     * @param {Date} [updatedSince] Optional timestamp filter for incremental sync
     * @returns {Promise<Array>} List of raw camera records
     */
    async fetchCameras(updatedSince = null) {
        try {
            const pool = await this.getPool();
            const request = pool.request();

            let query = `
                SELECT 
                    id, 
                    alias, 
                    rtsp, 
                    wilayah, 
                    area, 
                    online, 
                    ready, 
                    available, 
                    created_at, 
                    updated_at 
                FROM ${this.tableName}
            `;

            if (updatedSince) {
                request.input('since', updatedSince);
                query += ` WHERE updated_at >= @since`;
            }

            query += ` ORDER BY id ASC`;

            const result = await request.query(query);
            return result.recordset || [];
        } catch (err) {
            console.error('[SqlServerService] Error querying CCTV table from SQL Server:', err.message);
            throw err;
        }
    }

    /**
     * Close the connection pool
     */
    async close() {
        if (this.pool) {
            try {
                await this.pool.close();
                this.pool = null;
            } catch (err) {
                console.error('[SqlServerService] Error closing SQL Server pool:', err.message);
            }
        }
    }
}

module.exports = new SqlServerService();
