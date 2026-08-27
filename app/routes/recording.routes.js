const recController = require('../controllers/recording.controller');

module.exports = (app) => {
    app.post('/webhooks/segment-created', recController.handleSegmentCreated);
    app.get('/cameras', recController.getAllCameras);
    app.get('/recordings/:cameraName', recController.getDailyPlayback);
    app.get('/:cameraName', recController.getDailyPlayback);
};