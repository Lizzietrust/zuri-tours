import express from "express";
import rateLimit from "express-rate-limit";
import { geocodePlace } from "../controllers/geocodeController.js";

const router = express.Router();

/**
 * Geocoding is cheap for us (cached) but expensive upstream (Nominatim).
 * 60 requests / 15 min per IP is plenty for typing + retries.
 */
const geocodeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "error",
    message: "Too many location lookups. Please slow down.",
  },
});

router.get("/", geocodeLimiter, geocodePlace);

export default router;
