const { Patient, Doctor, Appointment } = require('../models');

exports.clearData = async (req, res) => {
    const deleteCounts = {};
    try {
        const patients = await Patient.find();
        const doctors = await Doctor.find();
        const appointments = await Appointment.find();

        const deleteResult = await Promise.all([
            Patient.deleteMany(),
            Doctor.deleteMany(),
            Appointment.deleteMany(),
        ]);

        deleteCounts.patients = deleteResult[0]?.deletedCount || 0;
        deleteCounts.doctors = deleteResult[1]?.deletedCount || 0;
        deleteCounts.appointments = deleteResult[2]?.deletedCount || 0;

        res.json({
            patients,
            doctors,
            appointments,
            deleteCounts,
        });
    } catch (error) {
        console.error('Error clearing data:', error);
        res.status(500).send('An error occurred while clearing the data');
    }
};