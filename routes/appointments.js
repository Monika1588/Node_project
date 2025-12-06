const express = require('express');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const router = express.Router();

// Middleware: ensure user logged-in
function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  next();
}

// GET ALL DOCTORS 
router.get('/doctors', async (req, res) => {
  try {
    const doctors = await User.find({ role: 'doctor' }).select('-passwordHash');
    res.json({ doctors });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATIENT CREATES APPOINTMENT
router.post('/', requireAuth, async (req, res) => {
  try {
    if (req.session.role !== 'patient') {
      return res.status(403).json({ message: 'Only patients can book appointments' });
    }

    const { doctorId, date, time, reason } = req.body;

    if (!doctorId || !date || !time) {
      return res.status(400).json({ message: 'Missing fields' });
    }

    // Slot conflict check
    const conflict = await Appointment.findOne({
      doctor: doctorId,
      date,
      time
    });

    if (conflict) {
      return res.status(400).json({ message: 'Slot already taken' });
    }

    // Create new appointment
    const appt = await Appointment.create({
      patient: req.session.userId,
      doctor: doctorId,
      date,
      time,
      reason,
      status: 'pending'
    });

    res.json({
      message: 'Appointment requested successfully',
      appointment: appt
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET APPOINTMENTS 
router.get('/', requireAuth, async (req, res) => {
  try {
    let filter = {};

    if (req.session.role === 'patient') {
      filter = { patient: req.session.userId };
    } else if (req.session.role === 'doctor') {
      filter = { doctor: req.session.userId };
    } else {
      return res.status(403).json({ message: 'Invalid role' });
    }

    const appts = await Appointment.find(filter)
      .populate('patient', 'name email phone symptoms')
      .populate('doctor', 'name email phone specialization')
      .sort({ date: 1, time: 1 });

    res.json({ appointments: appts });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// VIEW DOCTOR DETAILS 
router.get('/doctor/:id', requireAuth, async (req, res) => {
  try {
    const doctor = await User.findById(req.params.id).select('-passwordHash');

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    res.json({ doctor });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// VIEW PATIENT DETAILS 
router.get('/patient/:id', requireAuth, async (req, res) => {
  try {

    if (req.session.role !== 'doctor') {
      return res.status(403).json({ message: 'Only doctors can view patient details' });
    }

    const patient = await User.findById(req.params.id).select('-passwordHash');

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    res.json({ patient });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DOCTOR UPDATES STATUS + MESSAGE
router.post('/:id/status', requireAuth, async (req, res) => {
  try {
    if (req.session.role !== 'doctor') {
      return res.status(403).json({ message: 'Only doctors can update status' });
    }

    const { status, doctorMessage } = req.body;
    const appt = await Appointment.findById(req.params.id);

    if (!appt) return res.status(404).json({ message: 'Appointment not found' });

    if (appt.doctor.toString() !== req.session.userId) {
      return res.status(403).json({ message: 'Not allowed' });
    }

    const valid = ['pending', 'approved', 'rejected', 'completed'];
    if (!valid.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    appt.status = status;

    if (status === 'rejected') {
      appt.doctorMessage = doctorMessage || 'No reason provided';
    } else {
      appt.doctorMessage = '';
    }

    await appt.save();

    res.json({
      message: 'Appointment status updated',
      appointment: appt
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
