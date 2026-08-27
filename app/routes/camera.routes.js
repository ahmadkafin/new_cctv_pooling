const cameraController = require('../controllers/camera.controller');

module.exports = (app) => {
    // Synchronization Endpoints
    app.post('/api/sync', cameraController.syncAll);
    app.post('/api/sync/sqlserver', cameraController.syncSqlServer);
    app.post('/api/sync/mediamtx', cameraController.syncMediaMtx);
    app.get('/api/sync/test-sqlserver', cameraController.testSqlServer);
    app.post('/api/cameras/sync', cameraController.syncAll);

    // Camera CRUD & Diagnostics
    app.get('/api/cameras', cameraController.getAll);
    app.post('/api/cameras', cameraController.create);
    app.get('/api/cameras/:id', cameraController.getById);
    app.put('/api/cameras/:id', cameraController.update);
    app.delete('/api/cameras/:id', cameraController.delete);
    app.get('/api/cameras/:id/health', cameraController.getHealth);
};
