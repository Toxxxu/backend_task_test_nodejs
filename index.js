const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

require('dotenv').config();

mongoose.connect(process.env.MONGODBURL)
    .then(() => { console.log('MongoDB connected'); })
    .catch((err) => { console.log('MongoDB error', err); });

const app = express();
const PORT = process.env.PORT || 3001;

const corsOptions = {
    origin: 'http://localhost:3000',
    optionsSuccessStatus: 200 
};
  
app.use(cors(corsOptions));

app.use(express.json());

app.use(express.static(path.join(__dirname + "/public")));

const { getData, sendData, clearData, generateRightTable, viewCard, saveData } = require('./controllers/index');

app.get('/getData', (req, res) => getData(req, res));
app.get('/generateRightTable', (req, res) => generateRightTable(req, res));
app.get('/viewCard/:id', (req, res) => viewCard(req, res));
app.put('/saveData', (req, res) => saveData(req, res));
app.post('/sendData', (req, res) => sendData(req, res));
app.delete('/clearData', (req, res) => clearData(req, res));

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
