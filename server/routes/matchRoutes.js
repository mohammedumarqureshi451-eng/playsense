const express = require("express");
const mongoose = require("mongoose");

const Match = require("../models/Match");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

const CRICKET_FIELDS = [
  "runs",
  "balls",
  "fours",
  "sixes",
  "wickets",
];

const FOOTBALL_FIELDS = [
  "goals",
  "assists",
  "shots",
  "shotsOnTarget",
  "passes",
  "passAccuracy",
  "tackles",
  "interceptions",
  "yellowCards",
  "redCards",
];

const ALL_NUMERIC_FIELDS = [
  ...CRICKET_FIELDS,
  ...FOOTBALL_FIELDS,
];

const isValidDate = (value) => {
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
};

const isFiniteNonNegative = (value) =>
  typeof value === "number" &&
  Number.isFinite(value) &&
  value >= 0;

const cleanNumber = (value) => {
  if (value === "" || value === null || typeof value === "undefined") {
    return undefined;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : NaN;
};

const validateMatchPayload = (body, { partial = false } = {}) => {
  const errors = [];

  const has = (key) =>
    Object.prototype.hasOwnProperty.call(body, key);

  if (!partial || has("sport")) {
    if (!["cricket", "football"].includes(body.sport)) {
      errors.push("Sport must be cricket or football.");
    }
  }

  if (!partial || has("opponent")) {
    const opponent = String(body.opponent || "").trim();

    if (!opponent) {
      errors.push("Opponent is required.");
    } else if (opponent.length > 120) {
      errors.push("Opponent is too long.");
    }
  }

  if (!partial || has("date")) {
    if (!isValidDate(body.date)) {
      errors.push("A valid match date is required.");
    }
  }

  if (!partial || has("result")) {
    if (!["Won", "Lost", "Draw"].includes(body.result)) {
      errors.push("Result must be Won, Lost or Draw.");
    }
  }

  const sport = body.sport;

  if (sport === "cricket") {
    for (const field of CRICKET_FIELDS) {
      if (has(field)) {
        const value = cleanNumber(body[field]);

        if (
          typeof value !== "undefined" &&
          !isFiniteNonNegative(value)
        ) {
          errors.push(`${field} must be a non-negative number.`);
        }
      }
    }

    if (
      has("runs") &&
      has("balls") &&
      isFiniteNonNegative(Number(body.runs)) &&
      isFiniteNonNegative(Number(body.balls)) &&
      Number(body.balls) === 0 &&
      Number(body.runs) > 0
    ) {
      errors.push("Runs cannot be positive when balls are zero.");
    }
  }

  if (sport === "football") {
    for (const field of FOOTBALL_FIELDS) {
      if (has(field)) {
        const value = cleanNumber(body[field]);

        if (
          typeof value !== "undefined" &&
          !isFiniteNonNegative(value)
        ) {
          errors.push(`${field} must be a non-negative number.`);
        }
      }
    }

    if (has("passAccuracy")) {
      const accuracy = cleanNumber(body.passAccuracy);

      if (
        typeof accuracy !== "undefined" &&
        (Number.isNaN(accuracy) ||
          accuracy < 0 ||
          accuracy > 100)
      ) {
        errors.push("Pass accuracy must be between 0 and 100.");
      }
    }

    if (
      has("shotsOnTarget") &&
      has("shots") &&
      isFiniteNonNegative(Number(body.shotsOnTarget)) &&
      isFiniteNonNegative(Number(body.shots)) &&
      Number(body.shotsOnTarget) > Number(body.shots)
    ) {
      errors.push("Shots on target cannot exceed total shots.");
    }

    if (
      has("redCards") &&
      has("yellowCards") &&
      isFiniteNonNegative(Number(body.redCards)) &&
      isFiniteNonNegative(Number(body.yellowCards)) &&
      Number(body.redCards) > Number(body.yellowCards)
    ) {
      errors.push("Red cards cannot exceed yellow cards.");
    }
  }

  return errors;
};

const buildMatchData = (body) => {
  const data = {};

  if (typeof body.sport !== "undefined") {
    data.sport = body.sport;
  }

  if (typeof body.opponent !== "undefined") {
    data.opponent = String(body.opponent).trim();
  }

  if (typeof body.date !== "undefined") {
    data.date = body.date;
  }

  if (typeof body.result !== "undefined") {
    data.result = body.result;
  }

  for (const field of ALL_NUMERIC_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      const number = cleanNumber(body[field]);

      if (typeof number !== "undefined") {
        data[field] = number;
      }
    }
  }

  return data;
};

// GET all matches for the authenticated user
router.get("/", protect, async (req, res, next) => {
  try {
    const matches = await Match.find({
      userId: req.userId,
    }).sort({ date: -1, createdAt: -1 });

    return res.status(200).json(matches);
  } catch (error) {
    next(error);
  }
});

// GET one match for the authenticated user
router.get("/:id", protect, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        message: "Invalid match ID.",
      });
    }

    const match = await Match.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!match) {
      return res.status(404).json({
        message: "Match not found.",
      });
    }

    return res.status(200).json(match);
  } catch (error) {
    next(error);
  }
});

// CREATE
router.post("/", protect, async (req, res, next) => {
  try {
    const errors = validateMatchPayload(req.body);

    if (errors.length > 0) {
      return res.status(400).json({
        message: "Match validation failed.",
        errors,
      });
    }

    const data = buildMatchData(req.body);

    const match = await Match.create({
      ...data,
      userId: req.userId,
    });

    return res.status(201).json(match);
  } catch (error) {
    next(error);
  }
});

// UPDATE
router.put("/:id", protect, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        message: "Invalid match ID.",
      });
    }

    const existingMatch = await Match.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!existingMatch) {
      return res.status(404).json({
        message: "Match not found.",
      });
    }

    const mergedBody = {
      ...existingMatch.toObject(),
      ...req.body,
      sport: req.body.sport || existingMatch.sport,
    };

    const errors = validateMatchPayload(mergedBody);

    if (errors.length > 0) {
      return res.status(400).json({
        message: "Match validation failed.",
        errors,
      });
    }

    const updates = buildMatchData(req.body);

    const updatedMatch = await Match.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.userId,
      },
      updates,
      {
        new: true,
        runValidators: true,
      }
    );

    return res.status(200).json(updatedMatch);
  } catch (error) {
    next(error);
  }
});

// DELETE
router.delete("/:id", protect, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        message: "Invalid match ID.",
      });
    }

    const deletedMatch = await Match.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!deletedMatch) {
      return res.status(404).json({
        message: "Match not found.",
      });
    }

    return res.status(200).json({
      message: "Match deleted successfully.",
      id: deletedMatch._id,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
