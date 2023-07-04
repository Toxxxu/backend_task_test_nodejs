const axios = require('axios');

const { Patient, Doctor } = require('../models');

exports.viewCard = async (req, res) => {
    try {
        const id = req.params.id;

        console.log(id);

        const patients = await Patient.find();
        const doctors = await Doctor.find();

        const response = await axios.get('http://localhost:3001/generateRightTable');
        const data = await response.data;
        const appointments = data.rightTable;

        const viewAppt = appointments.filter((appt) => appt._id === id)[0];

        const patientData = patients.filter((p) => p.id === viewAppt.patientId)[0];
        const doctorData = doctors.filter((d) => d.id === viewAppt.doctorId)[0];
        
        const view = {
            patientData,
            doctorData,
            appointment: viewAppt.hour,
        };

        res.json({
            view,
        })
    } catch (error) {
        console.error('Error viewing card: ', error);
        res.status(500).json({ error: 'An error occurred while viewing card' });
    }
}