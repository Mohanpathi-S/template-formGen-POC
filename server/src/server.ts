import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Pool } from "pg";
import multer from "multer";
import path from "path";
import fs from "fs";
import * as xlsx from "xlsx";
import { EuriClient } from "euri";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Configure middleware
app.use(cors());
app.use(express.json());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// Database connection
const pool = new Pool({
  user: process.env.DB_USER ?? "postgres",
  host: process.env.DB_HOST ?? "localhost",
  database: process.env.DB_NAME ?? "template_generator",
  password: process.env.DB_PASSWORD ?? "postgres",
  port: parseInt(process.env.DB_PORT ?? "5434"),
});

// Initialize OpenAI
const client = new EuriClient({
  apiKey:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlM2NjYjY1OC03NjA2LTRmYTQtYTk3Zi05MmIxZjQ1M2Y4N2MiLCJwaG9uZSI6Iis5MTc5MDQ4ODE3MjMiLCJpYXQiOjE3NDY3NjIwOTcsImV4cCI6MTc3ODI5ODA5N30.v3n6NJAyjjX4VnQkM85vT8vmu8Qys2mHvgJY-R7QtaA",
});
// Example route to test server
app.get("/api/health", (req: express.Request, res: express.Response): void => {
  res.json({ status: "OK", message: "Server is running" });
});

// Upload Excel file route
app.post("/api/upload", upload.single("file"), async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    const filePath = req.file.path;

    // Read Excel file
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Try to get data with normal method first
    const data = xlsx.utils.sheet_to_json(worksheet);

    // If no data rows, extract headers and create a dummy row
    let processedData = data;
    if (data.length === 0) {
      console.log("No data found in Excel file, extracting headers only");

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

    // Return the schema
    res.json({ success: true, schema });
  } catch (error) {
    console.error("Error processing file:", error);
    res.status(500).json({ error: "Error processing file" });
  }
});

// Get all templates
app.get("/api/templates", async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const result = await pool.query("SELECT * FROM templates WHERE is_deleted = FALSE ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching templates:", error);
    res.status(500).json({ error: "Error fetching templates" });
  }
});

// Get template by ID with its components
app.get("/api/templates/:id", async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Get template
    const templateResult = await pool.query("SELECT * FROM templates WHERE id = $1 AND is_deleted = FALSE", [id]);

    if (templateResult.rows.length === 0) {
      res.status(404).json({ error: "Template not found" });
      return;
    }

    // Get components
    const componentsResult = await pool.query(
      "SELECT * FROM component_schemas WHERE template_id = $1 AND is_deleted = FALSE ORDER BY order_index",
      [id]
    );

    res.json({
      template: templateResult.rows[0],
      components: componentsResult.rows,
    });
  } catch (error) {
    console.error("Error fetching template:", error);
    res.status(500).json({ error: "Error fetching template" });
  }
});

// Create a new template
app.post("/api/templates", async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { name, description, created_by, components } = req.body;

    // Start a transaction
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Create template
      const templateResult = await client.query(
        "INSERT INTO templates (name, description, created_by) VALUES ($1, $2, $3) RETURNING *",
        [name, description, created_by]
      );

      const template = templateResult.rows[0];

      // Create components
      const componentPromises = components.map(async (component: any, index: number) => {
        const result = await client.query(
          "INSERT INTO component_schemas (template_id, key, title, schema_json, order_index) VALUES ($1, $2, $3, $4, $5) RETURNING *",
          [template.id, component.key, component.title, component.schema_json, index]
        );
        return result.rows[0];
      });

      const createdComponents = await Promise.all(componentPromises);

      // Create audit log
      await client.query(
        "INSERT INTO template_audit_logs (template_id, change_type, performed_by, diff_json) VALUES ($1, $2, $3, $4)",
        [
          template.id,
          "CREATE",
          created_by,
          JSON.stringify({ snapshot: { template: { name, components: components.map((c: any) => c.key) } } }),
        ]
      );

      await client.query("COMMIT");

      res.status(201).json({
        template,
        components: createdComponents,
      });
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error creating template:", error);
    res.status(500).json({ error: "Error creating template" });
  }
});

// Function to generate schema from data using AI
async function generateSchemaFromData(data: any[]) {
  if (!data || data.length === 0) {
    return { type: "object", properties: {} };
  }

  try {
    // For normal data, use sample rows and AI
    const sampleData = data.slice(0, Math.min(5, data.length));

    // Create a prompt for OpenAI
    const prompt = `
      Generate a JSON Schema for the following data:
      ${JSON.stringify(sampleData, null, 2)}
      
      The schema should follow this format:
       {
        type: "object",
        required: [],
        properties: {
        "field1": { "type": "string", "title": "Field 1" },
        "field2": { "type": "number", "title": "Field 2" }
      }
      
      Detect appropriate data types, including strings, numbers, dates, and nested objects or arrays.
      Only output valid JSON.

      The schema should strictly follow below format.
      {
        type: "object",
        required: [],
        properties: {
        "field1": { "type": "string", "title": "Field 1" },
        "field2": { "type": "number", "title": "Field 2" }
      }
    `;

    // Call OpenAI API
    const completion = await client.createChatCompletion({
      model: "gemini-2.5-pro-exp-03-25",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful AI assistant that generates JSON Schema from data. Only respond with valid JSON Schema, no explanations.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
    });

    // Parse response to get the schema
    const content = completion.choices[0].message.content;
    let schemaText = "";

    // Handle content as array or string
    if (Array.isArray(content)) {
      // Array of content parts
      schemaText = content.map((part) => (typeof part === "string" ? part : part.text || "")).join("");
    } else {
      // Direct string
      schemaText = String(content || "");
    }

    // Extract JSON from code block
    const jsonMatch = schemaText.match(/```(?:json)?\s*({[\s\S]*?})\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      schemaText = jsonMatch[1];
    } else {
      // If no code block, try to find JSON object directly
      const potentialJson = schemaText.match(/({[\s\S]*})/);
      if (potentialJson && potentialJson[1]) {
        schemaText = potentialJson[1];
      }
    }

    console.log("extracted json:", schemaText);

    // Parse the schema
    const schema = JSON.parse(schemaText);
    return schema;
  } catch (error) {
    console.error("Error generating schema with AI:", error);

    // Fallback: Generate a simple schema based on data structure
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
}

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
