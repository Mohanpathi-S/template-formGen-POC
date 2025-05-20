/**
 * Upload Service
 * 
 * This service handles file uploads and processing.
 * It provides methods for processing Excel files and extracting data.
 */
import * as xlsx from "xlsx";
import { generateSchemaFromData } from "./schemaGeneratorService";
import { CreateComponentDto } from "../types";
import { AppError } from "../middleware";

/**
 * Process an Excel file and extract components
 * @param {string} filePath - Path to the uploaded file
 * @param {string} originalFileName - Original name of the file
 * @returns {Promise<{fileName: string, components: CreateComponentDto[]}>} Extracted components
 */
export async function processExcelFile(
  filePath: string,
  originalFileName: string
): Promise<{ fileName: string, components: CreateComponentDto[] }> {
  try {
    // Remove extension from filename
    const fileName = originalFileName.replace(/\.[^/.]+$/, "");
    
    // Read Excel file
    const workbook = xlsx.readFile(filePath);
    const sheetNames = workbook.SheetNames;

    // Initialize components collection
    const components: CreateComponentDto[] = [];

    // Process each sheet
    for (let i = 0; i < sheetNames.length; i++) {
      const sheetName = sheetNames[i];
      const worksheet = workbook.Sheets[sheetName];

      // Try to get data with normal method first
      const data = xlsx.utils.sheet_to_json(worksheet);

      // If no data rows, extract headers and create a dummy row
      let processedData = data;
      if (data.length === 0) {
        console.log(`No data found in sheet "${sheetName}", extracting headers only`);

        // Get worksheet reference to determine range
        const ref = worksheet["!ref"] || "A1";
        const range = xlsx.utils.decode_range(ref);

        // Extract header row (first row)
        const headers: string[] = [];
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cellRef = xlsx.utils.encode_cell({ r: range.s.r, c: C });
          const cell = worksheet[cellRef];
          if (cell && cell.v) {
            headers.push(cell.v.toString());
          }
        }

        console.log("Extracted headers:", headers);

        // Create a dummy row with the headers as keys
        if (headers.length > 0) {
          const dummyRow: Record<string, null> = {};
          headers.forEach((header) => {
            dummyRow[header] = null;
          });
          processedData = [dummyRow];
        }
      }

      // Generate schema using AI
      const schema = await generateSchemaFromData(processedData);

      // Create component key (sanitized sheet name)
      const componentKey = sheetName.trim().replace(/\s+/g, '_').toLowerCase();

      // Add to components collection
      components.push({
        key: componentKey,
        title: sheetName,
        schema_json: schema
      });
    }

    // Check if we have any components
    if (components.length === 0) {
      throw new AppError("No valid sheets found in the Excel file", 400);
    }

    return {
      fileName,
      components
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error("Error processing file:", error);
    throw new AppError("Failed to process Excel file", 500);
  }
}

export default {
  processExcelFile,
};
