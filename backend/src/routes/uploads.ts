import { Router } from "express";
import fs from "node:fs";
import multer from "multer";
import { config } from "../config.js";
import { requireAuth } from "../middleware/auth.js";

fs.mkdirSync(config.uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, config.uploadDir),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}-${safe}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const isPdf = file.mimetype === "application/pdf" || /\.pdf$/i.test(file.originalname);
    const isImage =
      /^image\/(png|jpeg|webp)$/i.test(file.mimetype) ||
      /\.(png|jpe?g|webp)$/i.test(file.originalname);
    if (!isPdf && !isImage) {
      cb(new Error("Only PDF, PNG, JPG, or WebP files are allowed"));
      return;
    }
    cb(null, true);
  },
});

export const uploadsRouter = Router();

uploadsRouter.use(requireAuth);

uploadsRouter.post("/", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  const url = `/uploads/${req.file.filename}`;
  res.status(201).json({
    file: {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      url,
    },
  });
});

export function uploadsStaticPath() {
  return config.uploadDir;
}
