const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const path = require("path");
const multer = require("multer");
const fs = require("fs");
require("dotenv").config(); 

// Routes 
const authRoutes = require("./routes/auth");
const apptRoutes = require("./routes/appointments");
const profileRoutes = require("./routes/profile");

// MongoDB URL from .env
const MONGO_URL = process.env.MONGO_URL;

async function startServer() {
  try { 
    // Connect to MongoDB
    await mongoose.connect(MONGO_URL);
    console.log("✅ MongoDB Connected");
    
    const app = express();

    // Middlewares
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(cookieParser());

    // Session
    app.use(
      session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 },
      })
    );

    // CORS
    app.use((req, res, next) => {
      res.header("Access-Control-Allow-Origin", "*");
      res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept"
      );
      res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS"
      );
      next();
    });

    // MULTER CONFIG
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, path.join(__dirname, "uploads"));
      },
      filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${req.session.userId}_${Date.now()}${ext}`);
      },
    });
    const upload = multer({ storage });

    // Serve uploads folder
    app.use("/uploads", express.static(path.join(__dirname, "uploads")));

    const User = require("./models/User");

    // UPLOAD PROFILE PHOTO
    app.post("/api/profile/photo", upload.single("photo"), async (req, res) => {
      try {
        if (!req.session.userId)
          return res.status(401).json({ success: false, message: "Not logged in" });

        const user = await User.findById(req.session.userId);
        if (!user) return res.json({ success: false, message: "User not found" });

        // Delete old photo if exists
        if (user.photo) {
          const oldPath = path.join(__dirname, user.photo);
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }

        user.photo = `/uploads/${req.file.filename}`;
        await user.save();

        res.json({ success: true, photo: user.photo });
      } catch (err) {
        console.error(err);
        res.json({ success: false, message: "Upload failed" });
      }
    });

    // REMOVE PROFILE PHOTO
    app.delete("/api/profile/photo/remove", async (req, res) => {
      try {
        if (!req.session.userId)
          return res.status(401).json({ success: false, message: "Not logged in" });

        const user = await User.findById(req.session.userId);
        if (!user) return res.json({ success: false, message: "User not found" });

        // Delete file
        if (user.photo) {
          const filePath = path.join(__dirname, user.photo);
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }

        user.photo = null;
        await user.save();

        res.json({ success: true, message: "Photo removed" });
      } catch (err) {
        console.error(err);
        res.json({ success: false, message: "Failed to remove photo" });
      }
    });

    // ROUTES
    app.use("/api/auth", authRoutes);
    app.use("/api/appointments", apptRoutes);
    app.use("/api/profile", profileRoutes);

    // Frontend
    app.use(express.static(path.join(__dirname, "public")));

    app.get("/", (req, res) => {
      res.sendFile(path.join(__dirname, "public", "index.html"));
    });

    // 404
    app.use((req, res) => {
      res.status(404).send("404: Page not found");
    });

    // ERROR HANDLER
    app.use((err, req, res, next) => {
      console.error("🚨 Server Error:", err);
      res.status(500).json({ message: "Internal Server Error" });
    });

    // Start server
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () =>
      console.log(`🚀 Server running at http://localhost:${PORT}`)
    );
  } catch (err) {
    console.error("❌ Server failed to start", err);
  }
}

startServer();
