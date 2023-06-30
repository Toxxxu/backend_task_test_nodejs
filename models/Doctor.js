const mongoose = require('mongoose');
const autoIncrement = require('mongoose-auto-increment');

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

DoctorSchema.plugin(autoIncrement.plugin, {
    model: 'Doctor',
    field: '_id',
    startAt: 201,
    incrementBy: 1,
});

module.exports = mongoose.model('Doctor', DoctorSchema);