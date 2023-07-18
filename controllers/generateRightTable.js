const { Patient, Doctor, Appointment } = require('../models');

exports.generateRightTable = async (req, res) => {
  try {
    const patients = await Patient.find();
    const doctors = await Doctor.find();
    const appointments = await Appointment.find();

    const rightTable = [];

    const colorCounts = {
      green: 0,
      blue: 0,
      red: 0,
    }

    appointments.sort((a, b) => compareAppointments(a, b, patients, doctors));

    for (const appointment of appointments) {
      const patient = patients.find((p) => p.id === appointment.patientId);
      const doctor = doctors.find((d) => d.id === appointment.doctorId);

      const [startPatient, endPatient] = patient.hours.split('-');
      const [fromPatientAvailable, toPatientAvailable] = [parseInt(startPatient), parseInt(endPatient)];
      const [startDoctor, endDoctor] = doctor.hours.split('-');
      const [fromDoctorAvailable, toDoctorAvailable] = [parseInt(startDoctor), parseInt(endDoctor)];
      
      let newHour = fromPatientAvailable >= fromDoctorAvailable ? fromPatientAvailable : fromDoctorAvailable;

      if (!appointment.hour) {
        while (isAppointmentConflicting(appointment, rightTable, newHour)) {
          newHour++;
        }
        if (!(newHour > toPatientAvailable || newHour > toDoctorAvailable)) {
          appointment.hour = newHour.toString();
          appointment.color = 'blue';
          colorCounts.blue++;
        } else {
          appointment.hour = newHour.toString();
          appointment.color = 'red';
          colorCounts.red++;
        }
      } else {
        while (isAppointmentConflicting(appointment, rightTable, newHour)) {
          newHour++;
        }
        if (!(newHour > toPatientAvailable || newHour > toDoctorAvailable)) {
          if (newHour.toString() === appointment.hour) {
            appointment.hour = newHour.toString();
            appointment.color = 'green';
            colorCounts.green++;
          } else {
            appointment.hour = newHour.toString();
            appointment.color = 'blue';
            colorCounts.blue++;
          }
        } else {
          appointment.hour = newHour.toString();
          appointment.color = 'red';
          colorCounts.red++;
        }
      }
      rightTable.push(appointment);
    }

    rightTable.sort((a, b) => a.patientId - b.patientId);
    rightTable.sort((a, b) => a.doctorId - b.doctorId);
    rightTable.sort((a, b) => a.hour - b.hour);

    res.json({
      rightTable,
      colorCounts,
    })
  } catch (error) {
    console.error('Error generating right table: ', error);
    res.status(500).json({ error: 'An error occurred while generating right table' });
  }
}

function compareAppointments(appointment1, appointment2, patients, doctors) {
  const patient1 = patients.find(patient => patient.id === appointment1.patientId);
  const patient2 = patients.find(patient => patient.id === appointment2.patientId);
  const doctor1 = doctors.find(doctor => doctor.id === appointment1.doctorId);
  const doctor2 = doctors.find(doctor => doctor.id === appointment2.doctorId);

  const patient1Hours = patient1.hours.split("-");
  const patient2Hours = patient2.hours.split("-");
  const doctor1Hours = doctor1.hours.split("-");
  const doctor2Hours = doctor2.hours.split("-");

  const patient1StartHour = parseInt(patient1Hours[0]);
  const patient2StartHour = parseInt(patient2Hours[0]);
  const doctor1StartHour = parseInt(doctor1Hours[0]);
  const doctor2StartHour = parseInt(doctor2Hours[0]);

  const patient1EndHour = parseInt(patient1Hours[1]);
  const patient2EndHour = parseInt(patient2Hours[1]);
  const doctor1EndHour = parseInt(doctor1Hours[1]);
  const doctor2EndHour = parseInt(doctor2Hours[1]);

  if (patient1StartHour !== patient2StartHour) {
    return patient1StartHour - patient2StartHour;
  } else if (patient1EndHour !== patient2EndHour) {
    return patient1EndHour - patient2EndHour;
  } else if (doctor1StartHour !== doctor2StartHour) {
    return doctor1StartHour - doctor2StartHour;
  } else {
    return doctor1EndHour - doctor2EndHour;
  }
}

function isAppointmentConflicting(appointment, appointments, hour) {
  return appointments.some((appt) => {
      return (
          ((appt.patientId === appointment.patientId && appt.doctorId !== appointment.doctorId) ||
          (appt.patientId !== appointment.patientId && appt.doctorId === appointment.doctorId)) &&
          parseInt(appt.hour) === hour
      );
  });
}