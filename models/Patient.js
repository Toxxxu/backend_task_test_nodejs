const mongoose = require('mongoose');
const autoIncrement = require('mongoose-auto-increment');

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

PatientSchema.plugin(autoIncrement.plugin, {
    model: 'Patient',
    field: '_id',
    startAt: 101,
    incrementBy: 1,
});

module.exports = mongoose.model('Patient', PatientSchema);