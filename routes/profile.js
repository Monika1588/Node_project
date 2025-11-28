// routes/profile.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');

// Middleware to require login
function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  next();
}

// ============================
// GET CURRENT USER PROFILE
// ============================
router.get('/', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId).select('-passwordHash');
    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================
// UPDATE PROFILE + PASSWORD
// ============================
router.post('/update', requireAuth, async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      specialization,
      oldPassword,
      newPassword,
      confirmPassword
    } = req.body;

    const user = await User.findById(req.session.userId);

    if (!user) return res.status(404).json({ message: 'User not found' });

    // -----------------------------
    // UPDATE BASIC PROFILE FIELDS
    // -----------------------------
    user.name = name || user.name;
    user.email = email || user.email;
    user.phone = phone || user.phone;



    if (req.session.role === 'doctor') {
      user.specialization = specialization || user.specialization;
    }

    // -----------------------------
    // PASSWORD UPDATE LOGIC
    // -----------------------------
    if (oldPassword || newPassword || confirmPassword) {
      if (!oldPassword) {
        return res.json({ message: 'Old password is required' });
      }

      const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
      if (!isMatch) {
        return res.json({ message: 'Old password is incorrect' });
      }

      if (!newPassword || !confirmPassword) {
        return res.json({ message: 'New & confirm password are required' });
      }

      if (newPassword !== confirmPassword) {
        return res.json({ message: 'Passwords do not match' });
      }

      // Hash and update new password
      user.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    // Save updated user
    await user.save();

    res.json({ message: 'Profile updated successfully', success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
