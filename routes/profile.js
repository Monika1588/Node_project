const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Middleware to require login
function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  next();
}

// Multer config for photo upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '../public/uploads/');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, req.session.userId + '-' + Date.now() + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, 
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Only image files are allowed!'));
    } else {
      cb(null, true);
    }
  }
});


// GET CURRENT USER PROFILE
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId)
      .select('-passwordHash');
    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// UPDATE PROFILE + PASSWORD
router.post('/update', requireAuth, async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      specialization,
      oldPassword,
      newPassword,
      confirmPassword,
      age,
      gender
    } = req.body;

    const user = await User.findById(req.session.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Update fields
    user.name = name || user.name;
    user.email = email || user.email;
    user.phone = phone || user.phone;
    user.age = age || user.age;
    user.gender = gender || user.gender;

    if (req.session.role === 'doctor') {
      user.specialization = specialization || user.specialization;
    }

    // Password change
    if (oldPassword || newPassword || confirmPassword) {
      if (!oldPassword) return res.json({ message: 'Old password is required' });

      const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
      if (!isMatch) return res.json({ message: 'Old password is incorrect' });

      if (!newPassword || !confirmPassword)
        return res.json({ message: 'New & confirm password are required' });

      if (newPassword !== confirmPassword)
        return res.json({ message: 'Passwords do not match' });

      user.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    await user.save();
    res.json({ success: true, message: 'Profile updated successfully' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// UPLOAD PROFILE PHOTO
router.post('/photo', requireAuth, upload.single('photo'), async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // If a previous photo exists, delete it
    if (user.photo) {
      const oldPath = path.join(__dirname, '../public', user.photo);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    // Save new photo path
    user.photo = '/uploads/' + req.file.filename;
    await user.save();

    res.json({ success: true, photo: user.photo });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Photo upload failed' });
  }
});

// REMOVE PROFILE PHOTO
router.delete('/photo/remove', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // If no photo saved
    if (!user.photo) {
      return res.json({ success: true, message: "No photo to remove" });
    }

    // Delete file
    const filePath = path.join(__dirname, '../public', user.photo);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Remove from database
    user.photo = null;
    await user.save();

    
    res.json({ success: true, message: "Photo removed successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to remove photo" });
  }
});


module.exports = router;
