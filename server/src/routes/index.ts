/**
 * Routes Index
 * 
 * This module exports all route modules for easy access.
 */
import { Router } from "express";
import healthRoutes from "./healthRoutes";
import templateRoutes from "./templateRoutes";
import uploadRoutes from "./uploadRoutes";

const router = Router();

/**
 * Register all routes
 */
router.use("/health", healthRoutes);
router.use("/templates", templateRoutes);
router.use("/upload", uploadRoutes);

export default router;
