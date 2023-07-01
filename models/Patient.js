const mongoose = require('mongoose');

const PatientSchema = new mongoose.Schema({
    _id: { 
        type: Number, 
        unique: true, 
        required: true,
    },
    hours: { 
        type: String,
        required: true,
    },
    name: String,
    dateOfBirth: String,
});

module.exports = mongoose.model('Patient', PatientSchema);