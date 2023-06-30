const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.Number,
        ref: 'Patient',
    },
    doctorId: {
        type: mongoose.Schema.Types.Number,
        ref: 'Doctor',
    },
    hour: String,
});

module.exports = mongoose.model('Appointment', AppointmentSchema);