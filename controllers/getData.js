const { Patient, Doctor, Appointment } = require('../models');

exports.getData = async (req, res) => {
    try {
        const patients = await Patient.find();
        const doctors = await Doctor.find();
        const appointments = await Appointment.find();

        res.json({
            patients,
            doctors,
            appointments,
        })
    } catch (error) {
        console.error('Error getting data', error);
        res.status(500).json({ error: 'An error occurred while retrieving data from database'} );
    }
};