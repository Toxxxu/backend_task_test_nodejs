const { Patient, Doctor, Appointment } = require('../models');

exports.generateRightTable = async (req, res) => {
    try {
        const patients = await Patient.find();
        const doctors = await Doctor.find();
        const appointments = await Appointment.find();

        const rightTable = [];

        for (const appointment of appointments) {
            const patient = patients.find((p) => p.id === appointment.patientId);
            const doctor = doctors.find((d) => d.id === appointment.doctorId);

            if (!appointment.hour) {
                rightTable.push(emptyHour(patients, doctors, appointments));
            }

            const [startPatient, endPatient] = patient.hours.split('-');
            const [fromPatientAvailable, toPatientAvailable] = [parseInt(startPatient), parseInt(endPatient)];
            const [startDoctor, endDoctor] = doctor.hours.split('-');
            const [fromDoctorAvailable, toDoctorAvailable] = [parseInt(startDoctor), parseInt(endDoctor)];

            const appointmentHour = parseInt(appointment.hour);
        
            const isPatientAvailable = appointmentHour >= fromPatientAvailable && appointment <= toPatientAvailable;
            const isDoctorAvailable = appointmentHour >= fromDoctorAvailable && appointmentHour <= toDoctorAvailable;
        
            
        }
    } catch (error) {
        console.error('Error generating left table: ', error);
        res.status(500).json({ error: 'An error occurred while generating left table' });
    }
}