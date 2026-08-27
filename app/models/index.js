const Sequelize = require('sequelize');
const pg = require('pg');
const config = require('../config/sequelize');
const Camera = require('./Camera.model');
const RecordingChunks = require('./RecordingChunks.model');

const commonOptions = {
    dialect: 'postgres',
    dialectModule: pg,
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    schema: config.SCHEMA || 'public',
    searchPath: config.SCHEMA || 'public',
    pool: config.pool,
    define: {
        underscored: true,
        timestamps: true,
    }
};

let sequelize;
if (config.DATABASE_URL) {
    sequelize = new Sequelize(config.DATABASE_URL, commonOptions);
} else {
    sequelize = new Sequelize(
        config.DB,
        config.USER,
        config.PASSWORD,
        {
            host: config.HOST,
            port: config.PORT,
            ...commonOptions
        }
    );
}

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.Camera = Camera(sequelize, Sequelize.DataTypes);
db.RecordingChunks = RecordingChunks(sequelize, Sequelize.DataTypes);

Object.values(db)
    .filter(model => typeof model?.associate === 'function')
    .forEach(model => model.associate(db));

module.exports = db;