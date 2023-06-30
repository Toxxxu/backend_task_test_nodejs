const express = require('express');
const mongoose = require('mongoose');

require('dotenv').config();

mongoose.connect(process.env.MONGODBURL)
    .then(() => { console.log('MongoDB connected'); })
    .catch((err) => { console.log('MongoDB error', err); });;

const app = express();
const PORT = 3001;

// app.get('/', (req, res) => {
//     res.send('Hello, World');
// });

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});