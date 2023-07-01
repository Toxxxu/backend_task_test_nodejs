const mongoose = require('mongoose');

const DoctorSchema = new mongoose.Schema({
    _id: {
        type: Number,
        unique: true,
        required: true,
    },
    hourse: {
        type: String,
        required: true,
    },
    name: String,
    dateOfBirth: String,
});

module.exports = mongoose.model('Doctor', DoctorSchema);