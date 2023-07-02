const mongoose = require('mongoose');

const DoctorSchema = new mongoose.Schema({
    id: {
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

module.exports = mongoose.model('Doctor', DoctorSchema);