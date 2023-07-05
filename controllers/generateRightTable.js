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

            // if hour doesn't exist then generate for it random hour
            if (!appointment.hour) {
                fakeTable.push(await getColor(appointment, patient, doctor, appointments));
            }

            // getting numbers for patient doctors and when patient and doctor is doing an appointment
            const [startPatient, endPatient] = patient.hours.split('-');
            const [fromPatientAvailable, toPatientAvailable] = [parseInt(startPatient), parseInt(endPatient)];
            const [startDoctor, endDoctor] = doctor.hours.split('-');
            const [fromDoctorAvailable, toDoctorAvailable] = [parseInt(startDoctor), parseInt(endDoctor)];

            const appointmentHour = parseInt(appointment.hour);
            
            // checking if the doctor and patient can visit same time 
            const isPatientAvailable = appointmentHour >= fromPatientAvailable && appointmentHour <= toPatientAvailable;
            const isDoctorAvailable = appointmentHour >= fromDoctorAvailable && appointmentHour <= toDoctorAvailable;
        
            // generating an hour for an appointment but there might be some mistakes while generating it
            // I made a fakeTable to generate random hours for this
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

        console.log(fakeTable);

        const rightTable = [];

        // this is another forEach which fixes the hours for an appointments
        // it won't match with other appointments if there is same doctor or same patient at same time doing same appointment
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
                // getting an hour between what is larger when patient can be in hospital or nearlier or doctor
                let newHour = fromPatientAvailable >= fromDoctorAvailable ? fromPatientAvailable : fromDoctorAvailable;
                while (rightTable.some(appt => appt.hour === newHour.toString())) {
                    newHour++;
                }
                // checking it's larger number then put to this key true because u won't give any other possible number for this appointment
                if ((newHour > toPatientAvailable || newHour > toDoctorAvailable)) {
                    key = true;
                }
                appointment.hour = key ? hour : newHour.toString();
            }

            rightTable.push(appointment);
        });

        // this is double loop to check if the patient, doctor and hours are the same as used to be then put it green
        for (const appointment1 of rightTable) {
            for (const appointment2 of appointments) {
                if (appointment1.patientId === appointment2.patientId &&
                    appointment1.doctorId === appointment2.doctorId &&
                    appointment1.hour === appointment2.hour && (appointment2.color === 'green' || appointment2.color === 'yellow')) {
                        appointment1.color = 'green';
                }
            }
        }

        const colorCounts = {
            green: 0,
            blue: 0,
            red: 0,
        }

        // counts all the colors of the appointment
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

// checking if there is any conflict with an appointment
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

// giving color blue for possible appointment otherwise red if impossible
const getColor = async (appointment, patient, doctor, appointments) => {
    const [startPatient, endPatient] = patient.hours.split('-');
    const [fromPatientAvailable, toPatientAvailable] = [parseInt(startPatient), parseInt(endPatient)];
    const [startDoctor, endDoctor] = doctor.hours.split('-');
    const [fromDoctorAvailable, toDoctorAvailable] = [parseInt(startDoctor), parseInt(endDoctor)];

    // getting nearest hour of the appointment
    let nearestHour = fromPatientAvailable > fromDoctorAvailable ? fromPatientAvailable : fromDoctorAvailable;

    // checking if it returns any appointment
    let changed = false;

    while (isDoctorBusy(appointment.doctorId, nearestHour, appointments) || isPatientBusy(appointment.patientId, nearestHour, appointments)) {
        // if there is no given hour then generate for it
        if (!appointment.hour) {
            let key = false;
            if ((nearestHour > toPatientAvailable || nearestHour > toDoctorAvailable)) {
                changed = true;
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
                changed = true;
                return {
                    _id: appointment._id,
                    patientId: appointment.patientId,
                    doctorId: appointment.doctorId,
                    hour: nearestHour.toString(),
                    color: 'blue',
                }
            }
        } else if ((nearestHour > toPatientAvailable || nearestHour > toDoctorAvailable) && appointment.hour) {
            // if there is given hour and appointment not possible then put red
            changed = true;
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
            // if it's possible to change hour of the appointment then put blue
            if (key) {
                changed = true;
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

    // like it seems it doesn't return any appointment then set up it as default because patient and doctor won't be in the hospital given time
    if (!changed) {
        return {
            _id: appointment._id,
            patientId: appointment.patientId,
            doctorId: appointment.doctorId,
            hour: "0",
            color: 'red',
        }
    }
}

// checking if doctor is busy
function isDoctorBusy(doctorId, hour, appointments) {
    return appointments.some(
        (appointment) => appointment.doctorId === doctorId && parseInt(appointment.hour) === hour
    );
}
 
// checking if patient is busy
function isPatientBusy(patientId, hour, appointments) {
    return appointments.some(
        (appointment) => appointment.patientId === patientId && parseInt(appointment.hour) === hour
    );
}