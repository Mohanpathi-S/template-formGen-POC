/**
 * Upload Routes
 * 
 * This module defines routes for file upload operations.
 */
import { Router } from "express";
import { uploadController } from "../controllers";
import upload from "../config/multer";

const router = Router();

/**
 * @route POST /api/upload
 * @desc Upload and process an Excel file
 */
router.post("/", upload.single("file"), uploadController.uploadFile);

export default router;
