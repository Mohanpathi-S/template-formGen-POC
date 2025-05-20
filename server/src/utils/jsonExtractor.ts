/**
 * JSON Extractor Utility
 * 
 * This module provides utility functions for extracting JSON from text.
 * It's used to parse AI responses that may contain JSON in various formats.
 */

/**
 * Extract JSON from text that may contain code blocks or raw JSON
 * @param {string} text - The text to extract JSON from
 * @returns {string} The extracted JSON string
 */
export function extractJsonFromText(text: string): string {
  // Try to extract JSON from code block
  const codeBlockRegex = /```(?:json)?\s*({[\s\S]*?})\s*```/;
  const codeBlockMatch = codeBlockRegex.exec(text);
  if (codeBlockMatch?.[1]) {
    return codeBlockMatch[1];
  }

  // If no code block, try to find JSON object directly
  const jsonRegex = /({[\s\S]*})/;
  const jsonMatch = jsonRegex.exec(text);
  if (jsonMatch?.[1]) {
    return jsonMatch[1];
  }

  // Return original text if no JSON found
  return text;
}

/**
 * Parse JSON from text, handling potential errors
 * @param {string} text - The text containing JSON
 * @returns {any} The parsed JSON object or null if parsing fails
 */
export function parseJsonSafely(text: string): any {
  try {
    const jsonText = extractJsonFromText(text);
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Error parsing JSON:", error);
    return null;
  }
}

export default {
  extractJsonFromText,
  parseJsonSafely,
};
