const { Patient, Doctor, Appointment } = require('../models');

exports.sendData = async (req, res) => {
    const { patients, doctors, appointments } = req.body;

    const successCount = {
        patients: 0,
        doctors: 0,
        appointments: 0,
    };
    const formatErrors = [];
    const duplicateErrors = [];

    try {
        for (const patient of patients) {
            const existingPatient = await Patient.findOne({ _id: patient._id });
            if (existingPatient) {
                duplicateErrors.push(patient);
                continue;
            }

            const newPatient = new Patient(patient);
            try {
                await newPatient.save();
                successCount.patients++;
            } catch (error) {
                formatErrors.push(patient);
            }
        }
    } catch (error) {
        console.error('Error saving patients: ', error);
    }

    try {
        for (const doctor of doctors) {
            const existingDoctor = await Doctor.findOne({ _id: doctor._id });
            if (existingDoctor) {
                duplicateErrors.push(doctor);
                continue;
            }

            const newDoctor = new Doctor(doctor);
            try {
                await newDoctor.save();
                successCount.doctors++;
            } catch (error) {
                formatErrors.push(doctor);
            }
        }
    } catch (error) {
        console.error('Error saving doctors: ', error);
    }

    try {
        for (const appointment of appointments) {
            const newAppointment = new Appointment(appointment);
            try {
                await newAppointment.save();
                successCount.appointments++;
            } catch (error) {
                formatErrors.push(appointment);
            }
        }
    } catch (error) {
        console.error('Error saving appointments: ', error);
    }

    const deleteCounts = {
        patients: 0,
        doctors: 0,
        appointments: 0,
    };

    res.json({
        patients: [],
        doctors: [],
        appointments: [],
        successCount,
        formatErrors,
        duplicateErrors,
        deleteCounts,
    });
};
