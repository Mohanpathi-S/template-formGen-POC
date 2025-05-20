/**
 * Template Routes
 * 
 * This module defines routes for template-related operations.
 */
import { Router } from "express";
import { templateController } from "../controllers";

const router = Router();

/**
 * @route GET /api/templates
 * @desc Get all templates
 */
router.get("/", templateController.getAllTemplates);

/**
 * @route GET /api/templates/:id
 * @desc Get template by ID with its components
 */
router.get("/:id", templateController.getTemplateById);

/**
 * @route POST /api/templates
 * @desc Create a new template
 */
router.post("/", templateController.createTemplate);

export default router;
