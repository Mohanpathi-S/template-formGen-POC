/**
 * Template Controller
 *
 * This controller handles HTTP requests related to templates.
 * It provides route handlers for CRUD operations on templates.
 */
import { Request, Response, NextFunction } from "express";
import { templateService } from "../services";
import { AppError } from "../middleware";

/**
 * Get all templates
 * @route GET /api/templates
 */
export async function getAllTemplates(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const templates = await templateService.getAllTemplates();
    res.json(templates);
  } catch (error) {
    next(error);
  }
}

/**
 * Get template by ID with its components
 * @route GET /api/templates/:id
 */
export async function getTemplateById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Get the ID from the request parameters
    const { id } = req.params;

    // Basic validation for ID
    if (!id || id.trim() === '') {
      throw new AppError('Template ID is required', 400);
    }

    const templateWithComponents = await templateService.getTemplateById(id);
    res.json(templateWithComponents);
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new template
 * @route POST /api/templates
 */
export async function createTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, description, created_by, components } = req.body;

    // Validate required fields
    if (!name) {
      throw new AppError("Template name is required", 400);
    }

    if (!components || !Array.isArray(components) || components.length === 0) {
      throw new AppError("At least one component is required", 400);
    }

    // Validate each component
    components.forEach((component, index) => {
      if (!component.key) {
        throw new AppError(`Component at index ${index} is missing a key`, 400);
      }
      if (!component.title) {
        throw new AppError(`Component at index ${index} is missing a title`, 400);
      }
      if (!component.schema_json) {
        throw new AppError(`Component at index ${index} is missing a schema`, 400);
      }
    });

    const templateData = {
      name,
      description,
      created_by,
      components
    };

    const result = await templateService.createTemplate(templateData);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export default {
  getAllTemplates,
  getTemplateById,
  createTemplate,
};
