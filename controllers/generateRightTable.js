const { Patient, Doctor, Appointment } = require('../models');

exports.generateRightTable = async (req, res) => {
    try {
        const patients = await Patient.find();
        const doctors = await Doctor.find();
        const appointments = await Appointment.find();

        const fakeTable = [];
        
        for (const appointment of appointments) {
            const patient = patients.find((p) => p.id === appointment.patientId);
            const doctor = doctors.find((d) => d.id === appointment.doctorId);

            if (!appointment.hour) {
                fakeTable.push(await getColor(appointment, patient, doctor, appointments));
            }

            const [startPatient, endPatient] = patient.hours.split('-');
            const [fromPatientAvailable, toPatientAvailable] = [parseInt(startPatient), parseInt(endPatient)];
            const [startDoctor, endDoctor] = doctor.hours.split('-');
            const [fromDoctorAvailable, toDoctorAvailable] = [parseInt(startDoctor), parseInt(endDoctor)];

            const appointmentHour = parseInt(appointment.hour);
        
            const isPatientAvailable = appointmentHour >= fromPatientAvailable && appointmentHour <= toPatientAvailable;
            const isDoctorAvailable = appointmentHour >= fromDoctorAvailable && appointmentHour <= toDoctorAvailable;
        
            if ((isPatientAvailable && isDoctorAvailable) || (isPatientAvailable && !isDoctorAvailable) || (!isPatientAvailable && isDoctorAvailable)) {
                if (appointment.color === "red") {
                    fakeTable.push(await getColor(appointment, patient, doctor, appointments));
                } else if (appointment.color === "yellow") {
                    fakeTable.push(await getColor(appointment, patient, doctor, appointments));
                } else {
                    fakeTable.push({
                        _id: appointment._id,
                        patientId: appointment.patientId,
                        doctorId: appointment.doctorId,
                        hour: appointment.hour,
                        color: appointment.color,
                    });
                }
            }
        }

        const rightTable = [];

        fakeTable.forEach(appointment => {
            const { patientId, doctorId, hour } = appointment;

            const patient = patients.find((p) => p.id === appointment.patientId);
            const doctor = doctors.find((d) => d.id === appointment.doctorId);

            const [startPatient, endPatient] = patient.hours.split('-');
            const [fromPatientAvailable, toPatientAvailable] = [parseInt(startPatient), parseInt(endPatient)];
            const [startDoctor, endDoctor] = doctor.hours.split('-');
            const [fromDoctorAvailable, toDoctorAvailable] = [parseInt(startDoctor), parseInt(endDoctor)];

            const conflictingAppointment = rightTable.find(appt =>
                (appt.patientId === patientId && appt.hour === hour) ||
                (appt.doctorId === doctorId && appt.hour === hour)
            );

            let key = false;

            if (conflictingAppointment) {
                let newHour = fromPatientAvailable >= fromDoctorAvailable ? fromPatientAvailable : fromDoctorAvailable;
                while (rightTable.some(appt => appt.hour === newHour.toString())) {
                    newHour++;
                }
                if ((newHour > toPatientAvailable || newHour > toDoctorAvailable)) {
                    key = true;
                }
                appointment.hour = key ? hour : newHour.toString();
            }

            rightTable.push(appointment);
        });

        for (const appointment1 of rightTable) {
            for (const appointment2 of appointments) {
                if (appointment1.patientId === appointment2.patientId &&
                    appointment1.doctorId === appointment2.doctorId &&
                    appointment1.hour === appointment2.hour) {
                        appointment1.color = 'green';
                }
            }
        }

        const colorCounts = {
            green: 0,
            blue: 0,
            red: 0,
        }

        for (const appointment of rightTable) {
            if (appointment.color === 'green') {
                colorCounts.green++;
            } else if (appointment.color === 'blue') {
                colorCounts.blue++;
            } else {
                colorCounts.red++;
            }
        }

        res.json({
            rightTable,
            colorCounts,
        });
    } catch (error) {
        console.error('Error generating right table: ', error);
        res.status(500).json({ error: 'An error occurred while generating right table' });
    }
}

function isAppointmentConflict(existingAppointment, newAppointment, hour) {
    return (
        (existingAppointment.patientId === newAppointment.patientId &&
        existingAppointment.hour === newAppointment.hour &&
        parseInt(existingAppointment.hour) === hour) ||
        (existingAppointment.doctorId === newAppointment.doctorId &&
        existingAppointment.hour === newAppointment.hour &&
        parseInt(existingAppointment.hour) === hour)
    );
}

const getColor = async (appointment, patient, doctor, appointments) => {
    const [startPatient, endPatient] = patient.hours.split('-');
    const [fromPatientAvailable, toPatientAvailable] = [parseInt(startPatient), parseInt(endPatient)];
    const [startDoctor, endDoctor] = doctor.hours.split('-');
    const [fromDoctorAvailable, toDoctorAvailable] = [parseInt(startDoctor), parseInt(endDoctor)];

    let nearestHour = fromPatientAvailable > fromDoctorAvailable ? fromPatientAvailable : fromDoctorAvailable;

    while (isDoctorBusy(appointment.doctorId, nearestHour, appointments) || isPatientBusy(appointment.patientId, nearestHour, appointments)) {
        if (!appointment.hour) {
            let key = false;
            if ((nearestHour > toPatientAvailable || nearestHour > toDoctorAvailable)) {
                return {
                    _id: appointment._id,
                    patientId: appointment.patientId,
                    doctorId: appointment.doctorId,
                    hour: nearestHour,
                    color: 'red',
                }
            }
            for (const existing of appointments) {
                if (existing === appointment) {
                    continue;
                }
                if (!isAppointmentConflict(existing, appointment, nearestHour)) {
                    key = true;
                    break;
                }
            }
            if (key) {
                return {
                    _id: appointment._id,
                    patientId: appointment.patientId,
                    doctorId: appointment.doctorId,
                    hour: nearestHour.toString(),
                    color: 'blue',
                }
            }
        } else if ((nearestHour > toPatientAvailable || nearestHour > toDoctorAvailable) && appointment.hour) {
            return {
                _id: appointment._id,
                patientId: appointment.patientId,
                doctorId: appointment.doctorId,
                hour: appointment.hour,
                color: 'red',
            }
        } else {
            let key = false;
            for (const existing of appointments) {
                if (existing === appointment) {
                    continue;
                }
                if (!isAppointmentConflict(existing, appointment, nearestHour)) {
                    key = true;
                    break;
                }
            }
            if (key) {
                return {
                    _id: appointment._id,
                    patientId: appointment.patientId,
                    doctorId: appointment.doctorId,
                    hour: nearestHour.toString(),
                    color: 'blue',
                }
            }
        }
        nearestHour++;
    }
}

function isDoctorBusy(doctorId, hour, appointments) {
    return appointments.some(
        (appointment) => appointment.doctorId === doctorId && parseInt(appointment.hour) === hour
    );
}
  
function isPatientBusy(patientId, hour, appointments) {
    return appointments.some(
        (appointment) => appointment.patientId === patientId && parseInt(appointment.hour) === hour
    );
}