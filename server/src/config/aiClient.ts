/**
 * AI Client Configuration
 * 
 * This module provides a singleton instance of the EuriClient for AI operations.
 * It ensures that only one client is created and shared across the application.
 */
import { EuriClient } from "euri";
import env from "./environment";

/**
 * AIClient class implementing the Singleton pattern for EuriClient
 */
class AIClient {
  private static instance: AIClient;
  private client: EuriClient;

  /**
   * Private constructor to prevent direct instantiation
   */
  private constructor() {
    this.client = new EuriClient({
      apiKey: env.EURI_API_KEY,
    });
  }

  /**
   * Get the singleton instance of the AIClient class
   * @returns {AIClient} The singleton instance
   */
  public static getInstance(): AIClient {
    if (!AIClient.instance) {
      AIClient.instance = new AIClient();
    }
    return AIClient.instance;
  }

  /**
   * Get the EuriClient instance
   * @returns {EuriClient} The EuriClient instance
   */
  public getClient(): EuriClient {
    return this.client;
  }

  /**
   * Create a chat completion using the EuriClient
   * @param {Object} options - The chat completion options
   * @param {string} options.prompt - The prompt to send to the AI
   * @param {string} options.systemPrompt - The system prompt to use
   * @param {number} options.temperature - The temperature to use (0-1)
   * @returns {Promise<string>} The AI response content
   */
  public async createChatCompletion(options: {
    prompt: string;
    systemPrompt?: string;
    temperature?: number;
  }): Promise<string> {
    const { prompt, systemPrompt = "", temperature = 0.2 } = options;
    
    const completion = await this.client.createChatCompletion({
      model: "claude-3-5-sonnet-20240620",
      messages: [
        {
          role: "system",
          content: systemPrompt || "You are a helpful AI assistant.",
        },
        { role: "user", content: prompt },
      ],
      temperature,
      max_tokens: 4000,
    });

    // Handle both string and structured content formats
    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error("No content returned from AI model");
    }

    if (typeof content === 'string') {
      return content;
    } else {
      // Extract text from structured content
      return content
        .filter(item => item.type === 'text')
        .map(item => item.text)
        .join('\n');
    }
  }
}

// Export the singleton instance
export const aiClient = AIClient.getInstance();
export default aiClient;
