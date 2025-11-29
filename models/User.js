const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ["patient", "doctor"], default: "patient" },
  phone: { type: String },
  specialization: { type: String },
  age: { type: Number },
  gender: { type: String },
  photo: { type: String, default: '' }

});

module.exports = mongoose.model("User", userSchema);