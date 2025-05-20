/**
 * Services Index
 * 
 * This module exports all services for easy access.
 */
import { generateSchemaFromData } from "./schemaGeneratorService";
import templateService from "./templateService";
import uploadService from "./uploadService";

export {
  generateSchemaFromData,
  templateService,
  uploadService,
};

export default {
  generateSchemaFromData,
  templateService,
  uploadService,
};
