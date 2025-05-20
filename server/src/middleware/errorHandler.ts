/**
 * Error Handler Middleware
 * 
 * This module provides middleware for handling errors in the Express application.
 * It ensures consistent error responses across the API.
 */
import { Request, Response, NextFunction } from "express";
import { ApiError } from "../types";

/**
 * Custom error class for API errors
 */
export class AppError extends Error {
  status: number;
  details?: string | Record<string, any>;

  /**
   * Create a new AppError
   * @param {string} message - Error message
   * @param {number} status - HTTP status code
   * @param {string | Record<string, any>} details - Additional error details
   */
  constructor(message: string, status: number = 500, details?: string | Record<string, any>) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Not Found error handler middleware
 * Handles 404 errors for routes that don't exist
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new AppError(`Not Found - ${req.originalUrl}`, 404);
  next(error);
};

/**
 * Global error handler middleware
 * Handles all errors and sends a standardized response
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error("Error:", err);

  // Default error values
  let status = 500;
  let message = "Internal Server Error";
  let details: string | Record<string, any> | undefined = undefined;

  // Handle AppError instances
  if (err instanceof AppError) {
    status = err.status;
    message = err.message;
    details = err.details;
  } 
  // Handle Multer errors
  else if (err.name === "MulterError") {
    status = 400;
    message = `File upload error: ${err.message}`;
  } 
  // Handle validation errors
  else if (err.name === "ValidationError") {
    status = 400;
    message = err.message;
  } 
  // Handle other known errors
  else if (err.message) {
    message = err.message;
  }

  // Create standardized error response
  const errorResponse: ApiError = {
    error: message,
    status,
  };

  // Add details if available
  if (details) {
    errorResponse.details = details;
  }

  // Send error response
  res.status(status).json({
    success: false,
    error: errorResponse,
  });
};

export default {
  AppError,
  notFoundHandler,
  errorHandler,
};
