const sequelizePaginate = require('sequelize-paginate');

module.exports = (sequelize, DataType) => {
    const Camera = sequelize.define('Camera', {
        id: {
            type: DataType.UUID,
            primaryKey: true,
            defaultValue: DataType.UUIDV4,
            allowNull: false,
        },
        sqlServerId: {
            type: DataType.INTEGER,
            allowNull: true,
            field: 'sql_server_id',
            comment: 'Original integer PK from SQL Server'
        },
        alias: {
            type: DataType.STRING,
            allowNull: false,
            field: 'alias',
            comment: 'Unique identifier / slug used for MediaMTX paths'
        },
        name: {
            type: DataType.STRING,
            allowNull: true,
            field: 'name',
        },
        rtsp: {
            type: DataType.TEXT,
            allowNull: true,
            field: 'rtsp',
            comment: 'RTSP stream URL'
        },
        wilayah: {
            type: DataType.STRING,
            allowNull: true,
            field: 'wilayah',
        },
        area: {
            type: DataType.STRING,
            allowNull: true,
            field: 'area',
        },
        online: {
            type: DataType.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            field: 'online',
        },
        ready: {
            type: DataType.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            field: 'ready',
        },
        available: {
            type: DataType.BOOLEAN,
            allowNull: false,
            defaultValue: true,
            field: 'available',
        },
        isRecording: {
            type: DataType.BOOLEAN,
            allowNull: false,
            defaultValue: true,
            field: 'is_recording',
        },
    }, {
        tableName: 'cameras',
        timestamps: true,
        underscored: true,
        indexes: [
            {
                unique: true,
                fields: ['alias'],
            },
            {
                unique: true,
                fields: ['sql_server_id'],
                where: {
                    sql_server_id: { [sequelize.Sequelize.Op.ne]: null }
                }
            }
        ]
    });

    // Prototype accessors for backwards compatibility without altering SQL database schema
    Object.defineProperty(Camera.prototype, 'rtspUrl', {
        get() {
            return this.rtsp;
        },
        set(value) {
            this.rtsp = value;
        },
        enumerable: true,
        configurable: true
    });

    Object.defineProperty(Camera.prototype, 'location', {
        get() {
            const w = this.wilayah;
            const a = this.area;
            if (w && a) return `${w} - ${a}`;
            return w || a || null;
        },
        enumerable: true,
        configurable: true
    });

    Object.defineProperty(Camera.prototype, 'isActive', {
        get() {
            return this.available;
        },
        set(val) {
            this.available = val;
        },
        enumerable: true,
        configurable: true
    });

    Camera.associate = (models) => {
        Camera.hasMany(models.RecordingChunks, {
            foreignKey: 'cameraId',
            as: 'recordings',
            onDelete: 'CASCADE'
        });
    };

    sequelizePaginate.paginate(Camera);
    return Camera;
};