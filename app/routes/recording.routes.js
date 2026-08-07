const recController = require('../controllers/recording.controller');

module.exports = (app) => {
    app.post('/webhooks/segment-created', recController.handleSegmentCreated);
    app.get('/:cameraName', recController.getDailyPlayback);
}