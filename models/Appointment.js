const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patient: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },

  doctor: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },

  date: { 
    type: String,   // YYYY-MM-DD
    required: true 
  },

  time: { 
    type: String,   // HH:MM
    required: true 
  },

  reason: { 
    type: String, 
    default: "" 
  },

  patientNotes: { 
    type: String, 
    default: "" 
  },

  symptoms: { 
    type: String, 
    default: "" 
  },

  status: { 
    type: String, 
    enum: ["pending", "approved", "rejected", "completed"], 
    default: "pending" 
  },

  doctorMessage: { 
    type: String, 
    default: "" 
  }

}, { timestamps: true });

// Update status helper
appointmentSchema.methods.updateStatus = function(newStatus) {
  const allowed = ["pending", "approved", "rejected", "completed"];
  if (!allowed.includes(newStatus)) throw new Error("Invalid status");
  this.status = newStatus;
  return this.save();
};

module.exports = mongoose.model("Appointment", appointmentSchema);