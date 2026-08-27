const sequelizePaginate = require('sequelize-paginate');

module.exports = (sequelize, DataType) => {
    const RecordingChunks = sequelize.define('RecordingChunks', {
        id: {
            type: DataType.UUID,
            primaryKey: true,
            allowNull: false,
            defaultValue: DataType.UUIDV4,
        },
        cameraId: {
            type: DataType.UUID,
            allowNull: false,
            field: 'camera_id',
        },
        filePath: {
            type: DataType.STRING,
            allowNull: false,
            unique: true,
            field: 'file_path',
        },
        fileName: {
            type: DataType.STRING,
            allowNull: false,
            field: 'file_name',
        },
        fileSize: {
            type: DataType.BIGINT,
            allowNull: false,
            defaultValue: 0,
            field: 'file_size',
        },
        startTime: {
            type: DataType.DATE,
            allowNull: false,
            defaultValue: DataType.NOW,
            field: 'start_time',
        }
    }, {
        tableName: 'recording_chunks',
        timestamps: true,
        underscored: true,
        indexes: [
            {
                name: 'recording_chunks_camera_id_start_time_idx',
                fields: ['camera_id', 'start_time']
            },
            {
                unique: true,
                fields: ['file_path']
            }
        ]
    });

    RecordingChunks.associate = (models) => {
        RecordingChunks.belongsTo(models.Camera, {
            foreignKey: 'cameraId',
            as: 'camera'
        });
    };

    sequelizePaginate.paginate(RecordingChunks);
    return RecordingChunks;
};