const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const path = require("path");
const multer = require("multer"); // For profile photo uploads

// Routes
const authRoutes = require("./routes/auth");
const apptRoutes = require("./routes/appointments");
const profileRoutes = require("./routes/profile"); // Profile management

// Local MongoDB URL
const MONGO_URL = "mongodb://127.0.0.1:27017/hospitalDB";

async function startServer() {
  try {
    // CONNECT DATABASE
    await mongoose.connect(MONGO_URL);
    console.log("✅ MongoDB Connected");

    const app = express();

    // MIDDLEWARES
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(cookieParser());

    // SESSION (simple authentication)
    app.use(
      session({
        secret: "supersecretkey",
        resave: false,
        saveUninitialized: false,
        cookie: {
          httpOnly: true,
          maxAge: 24 * 60 * 60 * 1000, // 1 day
        },
      })
    );

    // CORS (optional, useful if frontend hosted separately)
    app.use((req, res, next) => {
      res.header("Access-Control-Allow-Origin", "*");
      res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept"
      );
      res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
      next();
    });

    // ----------------------
    // MULTER CONFIG (profile photo uploads)
    // ----------------------
    const storage = multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, path.join(__dirname, "uploads")); // uploads folder
      },
      filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        // use userId (assumes req.session.userId is set after login)
        cb(null, `${req.session.userId || Date.now()}${ext}`);
      },
    });
    const upload = multer({ storage: storage });

    // Serve uploads folder publicly
    app.use("/uploads", express.static(path.join(__dirname, "uploads")));

    // ----------------------
    // PROFILE PHOTO UPLOAD ROUTE
    // ----------------------
    app.post("/api/profile/photo", upload.single("photo"), async (req, res) => {
      try {
        if (!req.session.userId) return res.status(401).json({ success: false, message: "Not logged in" });
        
        const User = require("./models/User"); // Your user model
        const user = await User.findById(req.session.userId);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        user.photo = `/uploads/${req.file.filename}`;
        await user.save();

        res.json({ success: true, photo: user.photo });
      } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Upload failed" });
      }
    });

    // ----------------------
    // ROUTES
    // ----------------------
    app.use("/api/auth", authRoutes);          // Register/Login
    app.use("/api/appointments", apptRoutes);  // Appointment CRUD
    app.use("/api/profile", profileRoutes);    // Profile management

    // STATIC FRONTEND
    app.use(express.static(path.join(__dirname, "public")));

    // DEFAULT ROUTE
    app.get("/", (req, res) => {
      res.sendFile(path.join(__dirname, "public", "index.html"));
    });

    // 404 HANDLER
    app.use((req, res) => {
      res.status(404).send("404: Page not found");
    });

    // ERROR HANDLER
    app.use((err, req, res, next) => {
      console.error("🚨 Server Error:", err);
      res.status(500).json({ message: "Internal Server Error" });
    });

    // START SERVER
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });

  } catch (err) {
    console.error("❌ Server failed to start", err);
  }
}

startServer();
