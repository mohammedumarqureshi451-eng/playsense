const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

// IMPORTANT:
// Load .env BEFORE importing routes/middleware that read process.env.
dotenv.config();

const matchRoutes = require("./routes/matchRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();

const PORT = Number(process.env.PORT) || 5000;
const MONGO_URI = process.env.MONGO_URI;

const allowedOrigins = [
  process.env.CLIENT_URL,
].filter(Boolean);

if (!MONGO_URI) {
  console.error("❌ MONGO_URI is missing from server/.env");
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.error("❌ JWT_SECRET is missing from server/.env");
  process.exit(1);
}

app.disable("x-powered-by");

/* =========================================================
   CORS
   ========================================================= */

app.use(
  cors({
    origin(origin, callback) {
      // Allow requests without an Origin header.
      // This supports server-to-server requests and
      // local health checks.
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        new Error(`CORS blocked origin: ${origin}`)
      );
    },
    credentials: true,
  })
);

/* =========================================================
   BODY PARSING
   ========================================================= */

app.use(
  express.json({
    limit: "100kb",
  })
);

/* =========================================================
   HEALTH CHECK
   ========================================================= */

app.get("/api/health", (req, res) => {
  res.status(200).json({
    ok: true,
    service: "PlaySense API",
    database:
      mongoose.connection.readyState === 1
        ? "connected"
        : "disconnected",
  });
});

/* =========================================================
   API ROUTES
   ========================================================= */

app.use("/api/auth", authRoutes);
app.use("/api/matches", matchRoutes);

/* =========================================================
   404 HANDLER
   ========================================================= */

app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
    path: req.originalUrl,
  });
});

/* =========================================================
   CENTRALIZED ERROR HANDLER
   ========================================================= */

app.use((err, req, res, next) => {
  console.error("API error:", err);

  if (
    err.message &&
    err.message.startsWith("CORS blocked origin:")
  ) {
    return res.status(403).json({
      message: "Origin is not allowed by the API.",
    });
  }

  if (
    err instanceof SyntaxError &&
    err.status === 400
  ) {
    return res.status(400).json({
      message: "Invalid JSON payload.",
    });
  }

  if (err.name === "ValidationError") {
    return res.status(400).json({
      message: "Validation failed.",
      errors: Object.values(err.errors).map(
        (item) => item.message
      ),
    });
  }

  if (err.name === "CastError") {
    return res.status(400).json({
      message: "Invalid resource identifier.",
    });
  }

  res.status(err.status || 500).json({
    message:
      err.status && err.status < 500
        ? err.message
        : "Internal server error.",
  });
});

/* =========================================================
   START SERVER
   ========================================================= */

const startServer = async () => {
  try {
    await mongoose.connect(MONGO_URI);

    console.log("✅ MongoDB connected");
    console.log("🔐 JWT authentication configured");

    app.listen(PORT, () => {
      console.log(
        `🚀 PlaySense API running on port ${PORT}`
      );

      console.log(
        `🌐 Allowed client origins: ${
          allowedOrigins.join(", ") ||
          "none configured"
        }`
      );
    });
  } catch (error) {
    console.error(
      "❌ MongoDB connection failed:",
      error.message
    );

    process.exit(1);
  }
};

startServer();

module.exports = app; 