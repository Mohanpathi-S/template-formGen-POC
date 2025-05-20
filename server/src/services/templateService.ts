/**
 * Template Service
 *
 * This service handles business logic related to templates and components.
 * It provides methods for CRUD operations on templates and components.
 */
import { db } from "../config";
import { AppError } from "../middleware";
import {
  Template,
  Component,
  TemplateWithComponents,
  CreateTemplateDto
} from "../types";

/**
 * Get all templates
 * @returns {Promise<Template[]>} Array of templates
 */
export async function getAllTemplates(): Promise<Template[]> {
  try {
    const result = await db.query(
      "SELECT * FROM templates WHERE is_deleted = FALSE ORDER BY created_at DESC"
    );
    return result.rows;
  } catch (error) {
    console.error("Error fetching templates:", error);
    throw new AppError("Failed to fetch templates", 500);
  }
}

/**
 * Get a template by ID with its components
 * @param {string} id - The template ID
 * @returns {Promise<TemplateWithComponents>} The template with its components
 */
export async function getTemplateById(id: string): Promise<TemplateWithComponents> {
  try {
    // Get template
    const templateResult = await db.query(
      "SELECT * FROM templates WHERE id = $1 AND is_deleted = FALSE",
      [id]
    );

    if (templateResult.rows.length === 0) {
      throw new AppError("Template not found", 404);
    }

    // Get components
    const componentsResult = await db.query(
      "SELECT * FROM component_schemas WHERE template_id = $1 AND is_deleted = FALSE ORDER BY order_index",
      [id]
    );

    return {
      template: templateResult.rows[0],
      components: componentsResult.rows,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error("Error fetching template:", error);
    throw new AppError("Failed to fetch template", 500);
  }
}

/**
 * Create a new template with components
 * @param {CreateTemplateDto} templateData - The template data
 * @returns {Promise<TemplateWithComponents>} The created template with its components
 */
export async function createTemplate(templateData: CreateTemplateDto): Promise<TemplateWithComponents> {
  const { name, description, created_by, components } = templateData;

  // Start a transaction
  const client = await db.getClient();

  try {
    await client.query("BEGIN");

    // Check if a template with this name already exists
    const existingTemplate = await client.query(
      "SELECT id FROM templates WHERE name = $1 AND is_deleted = FALSE",
      [name]
    );

    if (existingTemplate.rows.length > 0) {
      // Return a specific error for duplicate template name
      throw new AppError(
        `A template with the name "${name}" already exists. Please choose a different name.`,
        409,
        { error: "Duplicate template name" }
      );
    }

    // Create template
    const templateResult = await client.query(
      "INSERT INTO templates (name, description, created_by) VALUES ($1, $2, $3) RETURNING *",
      [name, description || null, created_by || "00000000-0000-0000-0000-000000000000"]
    );

    const template = templateResult.rows[0];

    // Create components
    const componentPromises = components.map(async (component, index) => {
      const result = await client.query(
        "INSERT INTO component_schemas (template_id, key, title, schema_json, order_index) VALUES ($1, $2, $3, $4, $5) RETURNING *",
        [template.id, component.key, component.title, component.schema_json, index]
      );
      return result.rows[0];
    });

    const createdComponents = await Promise.all(componentPromises);

    // Create audit log
    await client.query(
      "INSERT INTO template_audit_logs (template_id, change_type, performed_by, diff_json) VALUES ($1, $2, $3, $4)",
      [
        template.id,
        "CREATE",
        created_by || "00000000-0000-0000-0000-000000000000",
        JSON.stringify({ snapshot: { template: { name, components: components.map(c => c.key) } } }),
      ]
    );

    await client.query("COMMIT");

    return {
      template,
      components: createdComponents,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    if (error instanceof AppError) {
      throw error;
    }
    console.error("Error creating template:", error);
    throw new AppError("Failed to create template", 500, { details: (error as Error).message });
  } finally {
    client.release();
  }
}

export default {
  getAllTemplates,
  getTemplateById,
  createTemplate,
};
