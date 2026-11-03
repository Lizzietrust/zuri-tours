import multer from "multer"; // eslint-disable-line import/no-extraneous-dependencies
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { AppError } from "../utils/appError.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const USERS_DIR = path.join(__dirname, "..", "public", "img", "users");

fs.mkdirSync(USERS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, USERS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
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
    const userId = req.user?._id?.toString() ?? "anon";

    cb(null, `user-${userId}-${Date.now()}${safeExt}`);
  },
});

const fileFilter = (_req, file, cb) => {
  if (!file.mimetype.startsWith("image/")) {
    return cb(new AppError("Only image files are allowed", 400), false);
  }
  cb(null, true);
};

export const uploadUserPhoto = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
}).single("photo");
