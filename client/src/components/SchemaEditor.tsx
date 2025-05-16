import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Divider,
  IconButton,
  Alert,
  Snackbar,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import axios from "axios";

// Define types for schema and properties
interface SchemaProperty {
  type: string | string[];
  title: string;
  format?: string;
  enum?: string[];
  items?: {
    type: string | string[];
    enum?: string[];
  };
}

interface Schema {
  type: string;
  properties?: {
    [key: string]: SchemaProperty;
  };
  items?: {
    type: string;
    properties: {
      [key: string]: SchemaProperty;
    };
  };
}

interface Component {
  key: string;
  title: string;
  schema_json: Schema;
}

const SchemaEditor = () => {
  const [components, setComponents] = useState<Component[]>([]);
  const [activeComponent, setActiveComponent] = useState<number>(0);
  const [templateName, setTemplateName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Load components from session storage
    const extractedComponents = sessionStorage.getItem("extractedComponents");
    const fileName = sessionStorage.getItem("uploadedFileName");

    if (extractedComponents) {
      try {
        const parsedComponents = JSON.parse(extractedComponents) as Component[];

        // Process each component's schema
        const processedComponents = parsedComponents.map(component => {
          let schema = component.schema_json;

          // Handle array schemas by converting them to object schemas
          if (schema.type === "array" && schema.items?.properties) {
            // Convert array schema to object schema for editor
            schema = {
              type: "object",
              properties: schema.items.properties
            };
          }

          // Ensure schema has properties object
          schema.properties ??= {};

          // Ensure all properties have proper types
          Object.keys(schema.properties).forEach((key) => {
            // TypeScript needs this non-null assertion to understand that properties is defined
            const properties = schema.properties!;
            const prop = properties[key];

            // Handle array types like ["string", "null"]
            if (Array.isArray(prop.type)) {
              // Use the non-null type
              const nonNullType = prop.type.find((t) => t !== "null") ?? "string";
              prop.type = nonNullType;
            }

            // Set format if type is string and has format
            if (prop.type === "string" && prop.format) {
              // Format is already set, keep it
            } else if (prop.type === "string" && key.toLowerCase().includes("date")) {
              prop.format = "date";
            } else if (prop.type === "string" && key.toLowerCase().includes("email")) {
              prop.format = "email";
            }

            // For integer/number types, ensure they're "number" for the editor
            if (prop.type === "integer") {
              prop.type = "number";
            }

            // Ensure title exists
            if (!prop.title) {
              prop.title = key;
            }
          });

          return {
            ...component,
            schema_json: schema
          };
        });

        setComponents(processedComponents);

        // Set template name from file name
        if (fileName) {
          setTemplateName(fileName);
        }
      } catch (err) {
        console.error("Error parsing components:", err);
        setError("Error loading components. Please try uploading your file again.");
      }
    } else {
      setError("No components found. Please upload an Excel file first.");
    }
  }, []);

  const handlePropertyTypeChange = (componentIndex: number, propertyKey: string, newType: string) => {
    if (components.length === 0 || !components[componentIndex]) return;

    const updatedComponents = [...components];
    const component = { ...updatedComponents[componentIndex] };
    const schema = { ...component.schema_json };

    // Ensure schema has properties
    schema.properties ??= {};

    const property = { ...schema.properties[propertyKey] };

    // Update property type and remove format if changing from string
    property.type = newType;

    // Remove format if not a string
    if (newType !== "string") {
      delete property.format;
    }

    // Add items property if array
    if (newType === "array") {
      property.items = { type: "string" };
    } else {
      delete property.items;
    }

    // Remove enum if not string or array
    if (newType !== "string" && newType !== "array") {
      delete property.enum;
    }

    schema.properties[propertyKey] = property;
    component.schema_json = schema;
    updatedComponents[componentIndex] = component;
    setComponents(updatedComponents);
  };

  const handlePropertyTitleChange = (componentIndex: number, propertyKey: string, newTitle: string) => {
    if (components.length === 0 || !components[componentIndex]) return;

    const updatedComponents = [...components];
    const component = { ...updatedComponents[componentIndex] };
    const schema = { ...component.schema_json };

    // Ensure schema has properties
    schema.properties ??= {};

    schema.properties[propertyKey] = {
      ...schema.properties[propertyKey],
      title: newTitle,
    };

    component.schema_json = schema;
    updatedComponents[componentIndex] = component;
    setComponents(updatedComponents);
  };

  const handlePropertyFormatChange = (componentIndex: number, propertyKey: string, newFormat: string) => {
    if (components.length === 0 || !components[componentIndex]) return;

    const updatedComponents = [...components];
    const component = { ...updatedComponents[componentIndex] };
    const schema = { ...component.schema_json };

    // Ensure schema has properties
    schema.properties ??= {};

    schema.properties[propertyKey] = {
      ...schema.properties[propertyKey],
      format: newFormat || undefined,
    };

    component.schema_json = schema;
    updatedComponents[componentIndex] = component;
    setComponents(updatedComponents);
  };

  const handleRemoveProperty = (componentIndex: number, propertyKey: string) => {
    if (components.length === 0 || !components[componentIndex]) return;

    const updatedComponents = [...components];
    const component = { ...updatedComponents[componentIndex] };
    const schema = { ...component.schema_json };

    // Ensure schema has properties
    schema.properties ??= {};

    delete schema.properties[propertyKey];

    component.schema_json = schema;
    updatedComponents[componentIndex] = component;
    setComponents(updatedComponents);
  };

  const handleAddProperty = (componentIndex: number) => {
    if (components.length === 0 || !components[componentIndex]) return;

    const updatedComponents = [...components];
    const component = { ...updatedComponents[componentIndex] };
    const schema = { ...component.schema_json };

    // Ensure schema has properties
    schema.properties ??= {};

    const newPropertyKey = `newProperty${Object.keys(schema.properties).length}`;
    schema.properties[newPropertyKey] = {
      type: "string",
      title: "New Property",
    };

    component.schema_json = schema;
    updatedComponents[componentIndex] = component;
    setComponents(updatedComponents);
  };

  const handlePreviewForm = () => {
    if (components.length === 0) return;
    if (!templateName.trim()) {
      setError("Please enter a template name");
      return;
    }

    // Store in session storage for the form renderer
    sessionStorage.setItem("editedComponents", JSON.stringify(components));
    sessionStorage.setItem("templateName", templateName);

    // Navigate to form renderer
    navigate("/form-renderer");
  };

  const handleSaveTemplate = async () => {
    if (components.length === 0) return;
    if (!templateName.trim()) {
      setError("Please enter a template name");
      return;
    }

    try {
      setIsSaving(true);
      // Mock user ID - in a real app, you'd get this from authentication
      const userId = "00000000-0000-0000-0000-000000000000";

      // Prepare the template data
      const templateData = {
        name: templateName,
        description: `Generated template for ${templateName}`,
        created_by: userId,
        components: components
      };

      // Save template to the backend
      const response = await axios.post("http://localhost:3001/api/templates", templateData);
      console.log("Template saved:", response.data);

      setSnackbarOpen(true);

      // Navigate to template list after a short delay
      setTimeout(() => {
        navigate("/templates");
      }, 2000);
    } catch (err: any) {
      console.error("Error saving template:", err);

      // Check if it's a duplicate template name error
      if (err.response && err.response.status === 409) {
        setError(err.response.data.message ?? "A template with this name already exists. Please choose a different name.");
      } else {
        setError("Error saving template. Please try again.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseSnackbar = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbarOpen(false);
  };

  if (error) {
    return (
      <Box sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Button variant="contained" sx={{ mt: 2 }} onClick={() => navigate("/")}>
          Return to Upload
        </Button>
      </Box>
    );
  }

  if (components.length === 0) {
    return (
      <Box sx={{ mt: 4 }}>
        <Typography>Loading components...</Typography>
      </Box>
    );
  }

  // Get the current component being edited
  const currentComponent = components[activeComponent];

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h4" gutterBottom>
        Review and Edit Template
      </Typography>

      <Paper sx={{ p: 3, mb: 4 }}>
        <TextField
          label="Template Name"
          fullWidth
          margin="normal"
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
          required
        />

        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 3 }}>
          Review and edit the extracted components before saving the template.
        </Typography>

        <Divider sx={{ my: 3 }} />

        {/* Component tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Box sx={{ display: 'flex', overflowX: 'auto' }}>
            {components.map((component, index) => (
              <Button
                key={component.key}
                variant={activeComponent === index ? "contained" : "outlined"}
                onClick={() => setActiveComponent(index)}
                sx={{ mr: 1, mb: 1, textTransform: 'none' }}
              >
                {component.title}
              </Button>
            ))}
          </Box>
        </Box>

        {/* Component title */}
        <Box sx={{ mb: 3 }}>
          <TextField
            label="Component Title"
            fullWidth
            value={currentComponent.title}
            onChange={(e) => {
              const updatedComponents = [...components];
              updatedComponents[activeComponent] = {
                ...updatedComponents[activeComponent],
                title: e.target.value
              };
              setComponents(updatedComponents);
            }}
          />
        </Box>

        <Typography variant="h6" gutterBottom>
          Properties
        </Typography>

        {currentComponent.schema_json.properties && Object.entries(currentComponent.schema_json.properties).map(([key, property]) => (
          <Paper key={key} sx={{ p: 2, mb: 2, bgcolor: "#f9f9f9" }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={3}>
                <TextField label="Field Name" fullWidth value={key} disabled />
              </Grid>

              <Grid item xs={12} sm={3}>
                <TextField
                  label="Title"
                  fullWidth
                  value={property.title}
                  onChange={(e) => handlePropertyTitleChange(activeComponent, key, e.target.value)}
                />
              </Grid>

              <Grid item xs={12} sm={2}>
                <FormControl fullWidth>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={typeof property.type === "string" ? property.type : property.type[0] ?? "string"}
                    label="Type"
                    onChange={(e) => handlePropertyTypeChange(activeComponent, key, e.target.value)}
                  >
                    <MenuItem value="string">String</MenuItem>
                    <MenuItem value="number">Number</MenuItem>
                    <MenuItem value="boolean">Boolean</MenuItem>
                    <MenuItem value="array">Array</MenuItem>
                    <MenuItem value="object">Object</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {property.type === "string" && (
                <Grid item xs={12} sm={3}>
                  <FormControl fullWidth>
                    <InputLabel>Format</InputLabel>
                    <Select
                      value={property.format ?? ""}
                      label="Format"
                      onChange={(e) => handlePropertyFormatChange(activeComponent, key, e.target.value)}
                    >
                      <MenuItem value="">None</MenuItem>
                      <MenuItem value="date">Date</MenuItem>
                      <MenuItem value="time">Time</MenuItem>
                      <MenuItem value="date-time">Date-Time</MenuItem>
                      <MenuItem value="email">Email</MenuItem>
                      <MenuItem value="uri">URI</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              )}

              <Grid item xs={12} sm={1}>
                <IconButton
                  color="error"
                  onClick={() => handleRemoveProperty(activeComponent, key)}
                  aria-label="delete property"
                >
                  <DeleteIcon />
                </IconButton>
              </Grid>
            </Grid>
          </Paper>
        ))}

        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => handleAddProperty(activeComponent)}
          sx={{ mt: 2 }}
        >
          Add Property
        </Button>
      </Paper>

      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}>
        <Button variant="outlined" onClick={() => navigate("/")}>
          Back
        </Button>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSaveTemplate}
            disabled={!templateName.trim() || isSaving}
          >
            {isSaving ? "Saving..." : "Save Template"}
          </Button>
          <Button
            variant="outlined"
            color="primary"
            onClick={handlePreviewForm}
            disabled={!templateName.trim()}
          >
            Preview Form
          </Button>
        </Box>
      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message="Template saved successfully!"
      />
    </Box>
  );
};

export default SchemaEditor;
