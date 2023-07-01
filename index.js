const express = require('express');
const mongoose = require('mongoose');

require('dotenv').config();

mongoose.connect(process.env.MONGODBURL)
    .then(() => { console.log('MongoDB connected'); })
    .catch((err) => { console.log('MongoDB error', err); });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

const { getData, sendData, clearData } = require('./controllers');

app.get('/data', (req, res) => getData(req, res));
app.post('/sendData', (req, res) => sendData(req, res));
app.delete('/clearData', (req, res) => clearData(req, res));

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
