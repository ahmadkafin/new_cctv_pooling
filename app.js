const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser')

const app = express();

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));
app.use(cookieParser());
app.use('/static', express.static('public'));

require('./app/routes/index')(app)

app.get('/', (req, res) => {
    res.json({ msg: "Hello from server" });
})

module.exports = app;