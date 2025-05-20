/**
 * Environment Configuration
 * 
 * This module loads and provides access to environment variables used throughout the application.
 * It uses dotenv to load variables from .env file and provides default values for required variables.
 */
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

/**
 * Environment configuration object with typed access to all environment variables
 */
export const env = {
  // Server configuration
  PORT: parseInt(process.env.PORT || "3001", 10),
  NODE_ENV: process.env.NODE_ENV || "development",
  
  // Database configuration
  DB_USER: process.env.DB_USER || "postgres",
  DB_HOST: process.env.DB_HOST || "localhost",
  DB_NAME: process.env.DB_NAME || "template_generator",
  DB_PASSWORD: process.env.DB_PASSWORD || "postgres",
  DB_PORT: parseInt(process.env.DB_PORT || "5434", 10),
  
  // API keys
  EURI_API_KEY: process.env.EURI_API_KEY || "",
  
  // File upload configuration
  UPLOADS_DIR: process.env.UPLOADS_DIR || "../uploads",
};

/**
 * Validates that all required environment variables are set
 * @returns {boolean} True if all required variables are set, false otherwise
 */
export const validateEnv = (): boolean => {
  const requiredVars = ["DB_NAME", "EURI_API_KEY"];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error(`Missing required environment variables: ${missingVars.join(", ")}`);
    return false;
  }
  
  return true;
};

export default env;
