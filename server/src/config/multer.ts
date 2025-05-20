/**
 * Multer Configuration
 * 
 * This module configures multer for handling file uploads.
 * It sets up storage location, filename generation, and file filtering.
 */
import multer from "multer";
import path from "path";
import fs from "fs";
import env from "./environment";

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "../../", env.UPLOADS_DIR);
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

/**
 * Configure storage for uploaded files
 */
const storage = multer.diskStorage({
  /**
   * Set the destination directory for uploaded files
   */
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  
  /**
   * Generate a unique filename for uploaded files
   */
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

/**
 * Filter function to allow only Excel files
 */
const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = [
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.oasis.opendocument.spreadsheet",
  ];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only Excel files are allowed"));
  }
};

/**
 * Configure multer with storage, file size limits, and file filtering
 */
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter,
});

export default upload;
