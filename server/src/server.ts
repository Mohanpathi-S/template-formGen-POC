/**
 * Server Entry Point
 *
 * This is the main entry point for the application.
 * It creates and starts the Express server.
 */
import { createApp } from "./app";
import { env, validateEnv, db } from "./config";

/**
 * Start the server
 */
async function startServer() {
  try {
    // Validate environment variables
    if (!validateEnv()) {
      console.error("Invalid environment configuration. Exiting...");
      process.exit(1);
    }

    // Create Express app
    const app = createApp();

    // Start the server
    const server = app.listen(env.PORT, () => {
      console.log(`Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
    });

    // Handle graceful shutdown
    process.on("SIGTERM", () => gracefulShutdown(server));
    process.on("SIGINT", () => gracefulShutdown(server));
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

/**
 * Gracefully shut down the server
 * @param {any} server - The HTTP server instance
 */
function gracefulShutdown(server: any) {
  console.log("Shutting down server...");

  server.close(async () => {
    console.log("Server closed");

    try {
      // Close database connection
      await db.close();
      console.log("All connections closed");
      process.exit(0);
    } catch (error) {
      console.error("Error during shutdown:", error);
      process.exit(1);
    }
  });

  // Force shutdown after 10 seconds if graceful shutdown fails
  setTimeout(() => {
    console.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10000);
}

// Start the server
startServer();
