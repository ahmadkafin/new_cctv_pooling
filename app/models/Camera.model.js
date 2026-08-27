const sequelizePaginate = require('sequelize-paginate');

module.exports = (sequelize, DataType) => {
    const Camera = sequelize.define('Camera', {
        id: {
            type: DataType.UUID,
            primaryKey: true,
            defaultValue: DataType.UUIDV4,
            allowNull: false,
        },
        name: {
            type: DataType.STRING,
            allowNull: false,
            unique: true,
        },
        location: {
            type: DataType.STRING,
            allowNull: true,
        },
        rtspUrl: {
            type: DataType.STRING,
            allowNull: true,
            field: 'rtsp_url'
        },
    }, {
        tableName: 'cameras',
        timestamps: true,
        underscored: true,
        indexes: [
            {
                unique: true,
                fields: ["name"],
            }
        ]
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