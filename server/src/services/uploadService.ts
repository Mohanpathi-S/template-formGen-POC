/**
 * Upload Service
 * 
 * This service handles file uploads and processing.
 * It provides methods for processing Excel files and extracting data.
 */
import * as xlsx from "xlsx";
import { generateSchemaFromData } from "./schemaGeneratorService";
import { CreateComponentDto, SubComponent } from "../types";
import { AppError } from "../middleware";

/**
 * Extract base name from sheet name for grouping
 * @param {string} sheetName - The sheet name
 * @returns {string} The base name for grouping
 */
function extractBaseName(sheetName: string): string {
  // Remove common separators and suffixes to find base name
  // Examples: "sheet 1 - one" -> "sheet 1", "Sheet1_Part1" -> "Sheet1", "Data (1)" -> "Data"
  const cleaned = sheetName
    .replace(/\s*[-_]\s*.+$/i, '') // Remove everything after - or _
    .replace(/\s*\(.+\)$/i, '') // Remove everything in parentheses
    .replace(/\s*part\s*\d+$/i, '') // Remove "part X" suffix
    .replace(/\s*\d+$/i, '') // Remove trailing numbers
    .trim();
  
  return cleaned || sheetName; // Fallback to original name if cleaning results in empty string
}

/**
 * Process an Excel file and extract components with subcomponents
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

    // Group sheets by base name
    const sheetGroups: Map<string, { name: string; data: any[] }[]> = new Map();

    // Process each sheet and group them
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

      // Extract base name for grouping
      const baseName = extractBaseName(sheetName);
      
      // Add to appropriate group
      if (!sheetGroups.has(baseName)) {
        sheetGroups.set(baseName, []);
      }
      
      sheetGroups.get(baseName)!.push({
        name: sheetName,
        data: processedData
      });
    }

    // Initialize components collection
    const components: CreateComponentDto[] = [];

    // Process each group
    for (const [baseName, sheets] of sheetGroups) {
      if (sheets.length === 1) {
        // Single sheet - create a regular component
        const sheet = sheets[0];
        const schema = await generateSchemaFromData(sheet.data);
        const componentKey = sheet.name.trim().replace(/\s+/g, '_').toLowerCase();

      components.push({
        key: componentKey,
          title: sheet.name,
          schema_json: schema
        });
      } else {
        // Multiple sheets with same base name - create component with subcomponents
        const subcomponents: SubComponent[] = [];
        
        for (const sheet of sheets) {
          const schema = await generateSchemaFromData(sheet.data);
          const subComponentKey = sheet.name.trim().replace(/\s+/g, '_').toLowerCase();
          
          subcomponents.push({
            key: subComponentKey,
            title: sheet.name,
        schema_json: schema
      });
        }

        // Create the main component with subcomponents
        const componentKey = baseName.trim().replace(/\s+/g, '_').toLowerCase();
        
        components.push({
          key: componentKey,
          title: baseName,
          schema_json: subcomponents[0].schema_json, // Use first subcomponent's schema as default
          subcomponents: subcomponents
        });
      }
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
