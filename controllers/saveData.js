const axios = require('axios');

const { Appointment } = require('../models');

exports.saveData = async (req, res) => {
    try {
        const response = await axios.get('http://localhost:3001/generateRightTable');
        const data = await response.data;
        const appointmentsOfRightTable = data.rightTable;

        for (const appointment of appointmentsOfRightTable) {
            await Appointment.findByIdAndUpdate(appointment._id, { color: appointment.color === 'blue' || appointment.color === 'green' ? 'green' : 'red', hour: appointment.hour });
        }

        const appointments = await Appointment.find();

        res.json({
            appointments,
        });
    } catch (error) {
        console.error("Can't save data")
        res.status(500).json({ error: 'An error occurred while saving data' });
    }
}