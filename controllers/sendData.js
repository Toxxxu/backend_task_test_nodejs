const moment = require('moment');

const { Patient, Doctor, Appointment } = require('../models');

exports.sendData = async (req, res) => {
    const { patients, doctors, appointments } = req.body;

    const successCount = {
        patients: 0,
        doctors: 0,
        appointments: 0,
    };
    const successPatients = [];
    const successDoctors = [];
    const successAppointments = [];
    const wrongFormatPatients = [];
    const wrongFormatDoctors = [];
    const wrongFormatAppointments = [];
    const duplicatePatients = [];
    const duplicateDoctors = [];

    try {
        for (const patient of patients) {
            const existingPatient = await Patient.findOne({ id: patient.id });
            // checking if there is duplicate
            if (existingPatient) {
                duplicatePatients.push(patient);
                continue;
            }

            const newPatient = new Patient(patient);
            // checking if there is no format errors for patient otherwise saving it
            try {
                if (Object.keys(patient).length >= 5) {
                    throw new Error('Useless property found');
                }
                if (!patient.id) {
                    throw new Error('There is no id');
                }
                if (patient.hours.includes('-') && patient.hours.split('-').length === 2) {
                    const [start, end] = patient.hours.split('-');
                    const from = parseInt(start);
                    const to = parseInt(end);
                    if (from > to) {
                        throw new Error('The start is bigger than end');
                    } else if (from === to) {
                        throw new Error(`The hours can't be the same`);
                    } else if (from >= 25 || to >= 25) {
                        throw new Error('There is wrong format hours');
                    }
                } else {
                    throw new Error('There is no hyphen or given wrong format');
                }
                if (patient.name && patient.name.split(' ').length >= 3) {
                    throw new Error('Useless third word in name found');
                }
                if (patient.dateOfBirth && !moment(patient.dateOfBirth, 'DD.MM.YYYY', true).isValid()) {
                    throw new Error('There is given wrong format date');
                }
                await newPatient.save();
                successPatients.push(newPatient);
                successCount.patients++;
            } catch (error) {
                console.log(error, patient);
                wrongFormatPatients.push(patient);
            }
        }
    } catch (error) {
        console.error('Error saving patients: ', error);
    }

    try {
        for (const doctor of doctors) {
            // checking if there is duplicate
            const existingDoctor = await Doctor.findOne({ id: doctor.id });
            if (existingDoctor) {
                duplicateDoctors.push(doctor);
                continue;
            }

            const newDoctor = new Doctor(doctor);
            // checking if there is no format errors for patient otherwise saving it
            try {
                if (Object.keys(doctor).length >= 5) {
                    throw new Error('Useless property found');
                }
                if (!doctor.id) {
                    throw new Error('There is no id');
                }
                if (doctor.hours.includes('-') && doctor.hours.split('-').length === 2) {
                    const [start, end] = doctor.hours.split('-');
                    const from = parseInt(start);
                    const to = parseInt(end);
                    if (from > to) {
                        throw new Error('The start is bigger than end');
                    } else if (from === to) {
                        throw new Error(`The hours can't be same`);
                    } else if (from >= 25 || to >= 25) {
                        throw new Error('There is wrong format hours');
                    }
                } else {
                    throw new Error('There is no hyphen or given wrong format');
                }
                if (doctor.name && doctor.name.split(' ').length >= 3) {
                    throw new Error('Useless third word in name found');
                }
                if (doctor.dateOfBirth && !moment(doctor.dateOfBirth, 'DD.MM.YYYY', true).isValid()) {
                    throw new Error('There is given wrong format date');
                }
                await newDoctor.save();
                successDoctors.push(newDoctor);
                successCount.doctors++;
            } catch (error) {
                console.log(error, doctor);
                wrongFormatDoctors.push(doctor);
            }
        }
    } catch (error) {
        console.error('Error saving doctors: ', error);
    }

    try {
        for (const appointment of appointments) {
            const newAppointment = new Appointment(appointment);
            try {
                if (Object.keys(appointment).length >= 4) {
                    throw new Error('Useless property found');
                }
                if (!appointment.patientId || !appointment.doctorId) {
                    throw new Error('There is no patient or doctor');
                }
                if (appointment.hour && appointment.hour.length >= 3 && parseInt(appointment.hour) >= 25) {
                    throw new Error('Wrong format appointment hour');
                }
                // generating a color for an appointment
                // it assigns as green or yellow or red
                newAppointment.color = await setAppointmentColor(appointment, patients, doctors, appointments);
                await newAppointment.save();
                successAppointments.push(newAppointment);
                successCount.appointments++;
            } catch (error) {
                wrongFormatAppointments.push(appointment);
            }
        }
    } catch (error) {
        console.error('Error saving appointments: ', error);
    }

    res.json({
        successPatients,
        successDoctors,
        successAppointments,
        successCount,
        wrongFormatPatients,
        wrongFormatDoctors,
        wrongFormatAppointments,
        duplicatePatients,
        duplicateDoctors,
    });
};

// generating color for an appointment
const setAppointmentColor = async (appointment, patients, doctors, appointments) => {
    const patient = patients.filter((p) => p.id === appointment.patientId)[0];
    const doctor = doctors.filter((d) => d.id === appointment.doctorId)[0];

    // if hour doesn't exist then put red
    if (!appointment.hour) {
        return 'red';
    }

    if (!isValidAppointmentTime(appointment.hour, patient.hours, doctor.hours)) {
        return 'red';
    } else if (isAppointmentConflicting(appointment, appointments)) {
        return 'yellow';
    } else {
        return 'green';
    }
}

// checking if the time is valid for an appointment
function isValidAppointmentTime(appointmentHour, patientHours, doctorHours) {
    const [patientStart, patientEnd] = patientHours.split('-');
    const [doctorStart, doctorEnd] = doctorHours.split('-');

    return (
        parseInt(appointmentHour) >= parseInt(patientStart) &&
        parseInt(appointmentHour) >= parseInt(doctorStart) &&
        parseInt(appointmentHour) < parseInt(patientEnd) &&
        parseInt(appointmentHour) < parseInt(doctorEnd)
    );
}

// checking the conflict in appointments
function isAppointmentConflicting(appointment, appointments) {
    return appointments.some((appt) => {
        return (
            ((appt.patientId === appointment.patientId && appt.doctorId !== appointment.doctorId) ||
            (appt.patientId !== appointment.patientId && appt.doctorId === appointment.doctorId)) &&
            appt.hour === appointment.hour
        );
    });
}
