const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');

const MONGO = 'mongodb://127.0.0.1:27017/hospitalDB';

async function run() {
  await mongoose.connect(MONGO);
  console.log('Connected to MongoDB');

  // create a doctor and a patient (if not exists)
  const docEmail = 'doc1@example.com';
  const patEmail = 'pat1@example.com';

  if (!await User.findOne({ email: docEmail })) {
    const h = await bcrypt.hash('password', 10);
    await new User({ name: 'Dr. Raj', email: docEmail, passwordHash: h, role: 'doctor', specialization: 'General Physician' }).save();
    console.log('Doctor created:', docEmail);
  }
  if (!await User.findOne({ email: patEmail })) {
    const h = await bcrypt.hash('password', 10);
    await new User({ name: 'Aarti', email: patEmail, passwordHash: h, role: 'patient' }).save();
    console.log('Patient created:', patEmail);
  }

  mongoose.disconnect();
}
run();   