/**
 * Express Application
 * 
 * This module sets up the Express application with middleware and routes.
 * It's separated from the server entry point to allow for easier testing.
 */
import express from "express";
import cors from "cors";
import routes from "./routes";
import { errorHandler, notFoundHandler } from "./middleware";

/**
 * Create and configure the Express application
 * @returns {express.Application} The configured Express app
 */
export function createApp(): express.Application {
  const app = express();

  // Configure middleware
  app.use(cors());
  app.use(express.json());
  
  // Register API routes
  app.use("/api", routes);
  
  // Handle 404 errors
  app.use(notFoundHandler);
  
  // Global error handler
  app.use(errorHandler);
  
  return app;
}

export default createApp;
