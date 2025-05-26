/**
 * Type Definitions
 *
 * This module defines TypeScript interfaces and types used throughout the application.
 */

/**
 * Template interface representing a template in the database
 */
export interface Template {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  is_deleted: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * SubComponent interface representing a subcomponent within a component
 */
export interface SubComponent {
  key: string;
  title: string;
  schema_json: Record<string, any>;
}

/**
 * Component interface representing a component schema in the database
 */
export interface Component {
  id: string;
  template_id: string;
  key: string;
  title: string;
  schema_json: Record<string, any>;
  subcomponents?: SubComponent[];
  order_index: number;
  is_deleted: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * TemplateWithComponents interface representing a template with its components
 */
export interface TemplateWithComponents {
  template: Template;
  components: Component[];
}

/**
 * CreateTemplateDto interface for creating a new template
 */
export interface CreateTemplateDto {
  name: string;
  description?: string;
  created_by: string;
  components: CreateComponentDto[];
}

/**
 * CreateComponentDto interface for creating a new component
 */
export interface CreateComponentDto {
  key: string;
  title: string;
  schema_json: Record<string, any>;
  subcomponents?: SubComponent[];
}

/**
 * ApiError interface for standardized API error responses
 */
export interface ApiError {
  error: string;
  message?: string;
  details?: string | Record<string, any>;
  status: number;
}

/**
 * ApiResponse interface for standardized API responses
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

/**
 * SchemaGenerationResult interface for AI schema generation results
 */
export interface SchemaGenerationResult {
  type: string;
  properties: Record<string, any>;
  required?: string[];
}
