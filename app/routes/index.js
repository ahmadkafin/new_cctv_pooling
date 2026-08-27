module.exports = (app) => {
    require('./camera.routes')(app);
    require('./recording.routes')(app);
};