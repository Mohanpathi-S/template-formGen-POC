/**
 * Upload Controller
 * 
 * This controller handles HTTP requests related to file uploads.
 * It provides route handlers for uploading and processing files.
 */
import { Request, Response, NextFunction } from "express";
import { uploadService } from "../services";
import { AppError } from "../middleware";

/**
 * Upload and process an Excel file
 * @route POST /api/upload
 */
export async function uploadFile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.file) {
      throw new AppError("No file uploaded", 400);
    }

    const filePath = req.file.path;
    const originalFileName = req.file.originalname;

    // Process the Excel file
    const result = await uploadService.processExcelFile(filePath, originalFileName);

    // Return the extracted components for review in the UI
    // Instead of saving directly to the database
    res.status(200).json({
      success: true,
      fileName: result.fileName,
      components: result.components
    });
  } catch (error) {
    next(error);
  }
}

export default {
  uploadFile,
};
