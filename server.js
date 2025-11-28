const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const path = require("path");

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

    // ROUTES
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