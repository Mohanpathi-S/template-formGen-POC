/**
 * Schema Generator Service
 * 
 * This service is responsible for generating JSON schemas from data using AI.
 * It uses the EuriClient to generate schemas and provides fallback mechanisms.
 */
import { aiClient } from "../config";
import { parseJsonSafely } from "../utils";
import { SchemaGenerationResult } from "../types";

/**
 * Generate a JSON schema from data using AI
 * @param {any[]} data - The data to generate a schema for
 * @returns {Promise<SchemaGenerationResult>} The generated schema
 */
export async function generateSchemaFromData(data: any[]): Promise<SchemaGenerationResult> {
  if (!data || data.length === 0) {
    return { type: "object", properties: {} };
  }

  try {
    // For normal data, use sample rows and AI
    const sampleData = data.slice(0, Math.min(5, data.length));

    // Create a prompt for the AI
    const prompt = `
      Generate a JSON Schema for the following data:
      ${JSON.stringify(sampleData, null, 2)}

      The schema should follow this format:
       {
        "type": "object",
        "required": [],
        "properties": {
          "field1": { "type": "string", "title": "Field 1" },
          "field2": { "type": "number", "title": "Field 2" }
        }
      }

      Detect appropriate data types, including strings, numbers, dates, and nested objects or arrays.
      Only output valid JSON.
    `;

    // Call AI with system prompt
    const content = await aiClient.createChatCompletion({
      prompt,
      systemPrompt: "You are a helpful AI assistant that generates JSON Schema from data. Only respond with valid JSON Schema, no explanations.",
      temperature: 0.2,
    });

    // Parse the schema
    const schema = parseJsonSafely(content);
    
    if (!schema) {
      throw new Error("Failed to parse schema from AI response");
    }
    
    return schema;
  } catch (error) {
    console.error("Error generating schema with AI:", error);

    // Fallback: Generate a simple schema based on data structure
    return generateFallbackSchema(data);
  }
}

/**
 * Generate a fallback schema when AI generation fails
 * @param {any[]} data - The data to generate a schema for
 * @returns {SchemaGenerationResult} The generated schema
 */
function generateFallbackSchema(data: any[]): SchemaGenerationResult {
  const sample = data[0];
  const properties: Record<string, any> = {};

  for (const key in sample) {
    const value = sample[key];
    let type = typeof value;

    if (type === "number") {
      properties[key] = { type: "number", title: key };
    } else if (value instanceof Date) {
      properties[key] = { type: "string", format: "date", title: key };
    } else if (Array.isArray(value)) {
      properties[key] = { type: "array", items: { type: "string" }, title: key };
    } else {
      properties[key] = { type: "string", title: key };
    }
  }

  return { type: "object", properties };
}

export default {
  generateSchemaFromData,
};
