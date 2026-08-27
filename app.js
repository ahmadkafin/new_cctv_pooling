const path = require('path');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();

app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));
app.use(cookieParser());

// Static file hosting
app.use('/static', express.static(path.join(__dirname, 'public')));
const recordingsDir = process.env.RECORDINGS_DIR || './recordings';
app.use('/recordings', express.static(path.resolve(recordingsDir)));

// Register application routes
require('./app/routes/index')(app);

app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        message: 'CCTV Pooling & MediaMTX Recording Backend',
        timestamp: new Date().toISOString()
    });
});

module.exports = app;