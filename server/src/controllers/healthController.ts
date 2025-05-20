/**
 * Health Controller
 * 
 * This controller handles HTTP requests related to server health.
 * It provides route handlers for checking the server status.
 */
import { Request, Response } from "express";
import { db } from "../config";

/**
 * Check server health
 * @route GET /api/health
 */
export async function checkHealth(req: Request, res: Response): Promise<void> {
  try {
    // Check database connection
    const dbResult = await db.query("SELECT 1");
    const dbStatus = dbResult.rows.length > 0 ? "OK" : "ERROR";

    res.json({
      status: "OK",
      message: "Server is running",
      database: dbStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: "ERROR",
      message: "Server is running but some services are unavailable",
      error: (error as Error).message,
      timestamp: new Date().toISOString()
    });
  }
}

export default {
  checkHealth,
};
