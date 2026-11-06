import multer from "multer"; // eslint-disable-line import/no-extraneous-dependencies
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { AppError } from "../utils/appError.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TOURS_DIR = path.join(__dirname, "..", "public", "img", "tours");

fs.mkdirSync(TOURS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, TOURS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = [
      ".jpg",
      ".jpeg",
      ".png",
      ".webp",
      ".gif",
      ".avif",
    ].includes(ext)
      ? ext
      : ".jpg";

    const key = req.params?.id ?? "new";
    const safeKey = String(key).replace(/[^a-zA-Z0-9-_]/g, "-");

    cb(null, `tour-${safeKey}-${Date.now()}${safeExt}`);
  },
});

const fileFilter = (_req, file, cb) => {
  if (!file.mimetype.startsWith("image/")) {
    return cb(new AppError("Only image files are allowed", 400), false);
  }
  cb(null, true);
};

/**
 * Parses a single optional `imageCover` file.
 * Safe to use on requests that also send JSON-only payloads —
 * multer simply leaves req.file undefined if no file part is sent.
 */
export const uploadTourCover = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).single("imageCover");
