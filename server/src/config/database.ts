/**
 * Database Configuration
 * 
 * This module provides a singleton instance of the PostgreSQL connection pool.
 * It ensures that only one pool is created and shared across the application.
 */
import { Pool, PoolClient } from "pg";
import env from "./environment";

/**
 * Database class implementing the Singleton pattern for PostgreSQL connection pool
 */
class Database {
  private static instance: Database;
  private pool: Pool;

  /**
   * Private constructor to prevent direct instantiation
   */
  private constructor() {
    this.pool = new Pool({
      user: env.DB_USER,
      host: env.DB_HOST,
      database: env.DB_NAME,
      password: env.DB_PASSWORD,
      port: env.DB_PORT,
    });

    // Log connection events
    this.pool.on("connect", () => {
      console.log("Connected to PostgreSQL database");
    });

    this.pool.on("error", (err) => {
      console.error("Unexpected error on idle PostgreSQL client", err);
    });
  }

  /**
   * Get the singleton instance of the Database class
   * @returns {Database} The singleton instance
   */
  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  /**
   * Get the PostgreSQL connection pool
   * @returns {Pool} The connection pool
   */
  public getPool(): Pool {
    return this.pool;
  }

  /**
   * Execute a query on the database
   * @param {string} text - The SQL query text
   * @param {any[]} params - The query parameters
   * @returns {Promise<any>} The query result
   */
  public async query(text: string, params?: any[]): Promise<any> {
    const start = Date.now();
    const result = await this.pool.query(text, params);
    const duration = Date.now() - start;
    
    console.log(`Executed query: ${text} - Duration: ${duration}ms - Rows: ${result.rowCount}`);
    
    return result;
  }

  /**
   * Get a client from the pool for transactions
   * @returns {Promise<PoolClient>} A client from the pool
   */
  public async getClient(): Promise<PoolClient> {
    return await this.pool.connect();
  }

  /**
   * Close the database connection pool
   * @returns {Promise<void>}
   */
  public async close(): Promise<void> {
    await this.pool.end();
    console.log("Database connection pool closed");
  }
}

// Export the singleton instance
export const db = Database.getInstance();
export default db;
