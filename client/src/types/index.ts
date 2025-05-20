/**
 * Type Definitions
 *
 * This module defines TypeScript interfaces and types used throughout the client application.
 */

/**
 * Template interface representing a template from the API
 */
export interface Template {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Component interface representing a component schema from the API
 */
export interface Component {
  id: string;
  template_id: string;
  key: string;
  title: string;
  schema_json: Record<string, any>;
  order_index: number;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
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
