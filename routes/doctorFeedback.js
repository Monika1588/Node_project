const express = require('express');
const Appointment = require('../models/Appointment');
const router = express.Router();

router.get('/doctor/feedback', async (req, res) => {
  const doctorId = req.session.userId;

  const feedbacks = await Appointment.find({
    doctor: doctorId,
    feedback: { $ne: null }
  }).populate("patient", "name");

  res.render("doctorFeedback", { feedbacks });
});

module.exports = router;