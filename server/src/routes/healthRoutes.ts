/**
 * Health Routes
 * 
 * This module defines routes for server health checks.
 */
import { Router } from "express";
import { healthController } from "../controllers";

const router = Router();

/**
 * @route GET /api/health
 * @desc Check server health
 */
router.get("/", healthController.checkHealth);

export default router;
