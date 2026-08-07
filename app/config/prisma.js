const { Pool } = require('pg')
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg')

const connString = process.env.DATABSE_URL;
const pool = new Pool({ connString });

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

module.exports = prisma;