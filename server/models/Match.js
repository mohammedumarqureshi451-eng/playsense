const mongoose = require("mongoose");

const matchSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    sport: {
      type: String,
      enum: ["cricket", "football"],
      required: true,
    },

    opponent: {
      type: String,
      required: [true, "Opponent is required."],
      trim: true,
      minlength: [1, "Opponent is required."],
      maxlength: [120, "Opponent is too long."],
    },

    date: {
      type: Date,
      required: [true, "Match date is required."],
    },

    result: {
      type: String,
      enum: ["Won", "Lost", "Draw"],
      required: [true, "Match result is required."],
    },

    // Cricket fields
    runs: {
      type: Number,
      min: 0,
    },

    balls: {
      type: Number,
      min: 0,
    },

    fours: {
      type: Number,
      min: 0,
    },

    sixes: {
      type: Number,
      min: 0,
    },

    wickets: {
      type: Number,
      min: 0,
    },

    // Football fields
    goals: {
      type: Number,
      min: 0,
    },

    assists: {
      type: Number,
      min: 0,
    },

    shots: {
      type: Number,
      min: 0,
    },

    shotsOnTarget: {
      type: Number,
      min: 0,
    },

    passes: {
      type: Number,
      min: 0,
    },

    passAccuracy: {
      type: Number,
      min: 0,
      max: 100,
    },

    tackles: {
      type: Number,
      min: 0,
    },

    interceptions: {
      type: Number,
      min: 0,
    },

    yellowCards: {
      type: Number,
      min: 0,
    },

    redCards: {
      type: Number,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

matchSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model("Match", matchSchema);
