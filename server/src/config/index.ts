/**
 * Configuration Index
 * 
 * This module exports all configuration modules for easy access.
 */
import env, { validateEnv } from "./environment";
import db from "./database";
import upload from "./multer";
import aiClient from "./aiClient";

export {
  env,
  validateEnv,
  db,
  upload,
  aiClient,
};

export default {
  env,
  validateEnv,
  db,
  upload,
  aiClient,
};
