import React, { useState, useEffect } from "react";
import { Box, Paper, Typography, Button, Alert, Snackbar } from "@mui/material";
import { useNavigate } from "react-router-dom";
import Form from "@rjsf/mui";
import { RJSFSchema } from "@rjsf/utils";
import validator from "@rjsf/validator-ajv8";
import axios from "axios";

interface Component {
  key: string;
  title: string;
  schema_json: RJSFSchema;
}

const FormRenderer = () => {
  const [components, setComponents] = useState<Component[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [templateName, setTemplateName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Load components from session storage
    const savedComponents = sessionStorage.getItem("editedComponents");
    const savedTemplateName = sessionStorage.getItem("templateName");

    if (savedComponents && savedTemplateName) {
      try {
        const parsedComponents = JSON.parse(savedComponents) as Component[];

        // Process components to ensure they have the right format for the form renderer
        const processedComponents = parsedComponents.map(component => {
          let schema = component.schema_json;

          // Handle array schemas by converting them to object schemas
          if (schema.type === "array" && schema.items && typeof schema.items === 'object' && 'properties' in schema.items) {
            // Convert array schema to object schema for form renderer
            schema = {
              type: "object",
              properties: schema.items.properties
            };
          }

          // Ensure schema has properties
          schema.properties ??= {};

          return {
            ...component,
            schema_json: schema
          };
        });

        setComponents(processedComponents);
        setTemplateName(savedTemplateName);

        // Initialize form data for each component
        const initialFormData: Record<string, any> = {};
        processedComponents.forEach((component: Component) => {
          initialFormData[component.key] = {};
        });
        setFormData(initialFormData);
      } catch (err) {
        console.error("Error parsing components:", err);
        setError("Error loading components. Please try editing your schema again.");
      }
    } else {
      setError("No components found. Please upload an Excel file and edit the schema first.");
    }
  }, []);

  const handleFormChange = (componentIndex: number, data: any) => {
    const updatedFormData = { ...formData };
    const componentKey = components[componentIndex].key;
    updatedFormData[componentKey] = data.formData;
    setFormData(updatedFormData);
  };

  const handleSubmit = async () => {
    try {
      // Mock user ID - in a real app, you'd get this from authentication
      const userId = "00000000-0000-0000-0000-000000000000";

      // Prepare the template data
      const templateData = {
        name: templateName,
        description: `Generated template for ${templateName}`,
        created_by: userId,
        components: components,
      };

      // Save template to the backend
      const response = await axios.post("http://localhost:3001/api/templates", templateData);

      console.log("Template saved:", response.data);
      setSnackbarOpen(true);

      // In a real app, you might direct to the template list or detail view
      setTimeout(() => {
        navigate("/templates");
      }, 2000);
    } catch (err: any) {
      console.error("Error saving form data:", err);

      // Check if it's a duplicate template name error
      if (err.response && err.response.status === 409) {
        setError(err.response.data.message ?? "A template with this name already exists. Please choose a different name.");
        // Navigate back to schema editor to change the name
        setTimeout(() => {
          navigate("/schema-editor");
        }, 3000);
      } else {
        setError("Error saving form data. Please try again.");
      }
    }
  };

  const handleClose = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === "clickaway") {
      return;
    }

    setSnackbarOpen(false);
  };

  if (error) {
    return (
      <Box sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Button variant="contained" sx={{ mt: 2 }} onClick={() => navigate("/schema-editor")}>
          Return to Schema Editor
        </Button>
      </Box>
    );
  }

  if (components.length === 0) {
    return (
      <Box sx={{ mt: 4 }}>
        <Typography>Loading form...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h4" gutterBottom>
        {templateName} Form Preview
      </Typography>

      <Typography variant="body1" gutterBottom>
        This form was generated from your Excel data. You can test the form and then save the template.
      </Typography>

      {/* Component tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Box sx={{ display: 'flex', overflowX: 'auto' }}>
          {components.map((component, index) => (
            <Button
              key={component.key}
              variant={activeTab === index ? "contained" : "outlined"}
              onClick={() => setActiveTab(index)}
              sx={{ mr: 1, mb: 1, textTransform: 'none' }}
            >
              {component.title}
            </Button>
          ))}
        </Box>
      </Box>

      {/* Current component form */}
      <Paper sx={{ p: 3, mt: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          {components[activeTab].title}
        </Typography>

        <Form
          schema={components[activeTab].schema_json}
          validator={validator}
          formData={formData[components[activeTab].key]}
          onChange={(data) => handleFormChange(activeTab, data)}
          liveValidate
        >
          {/* Empty children to hide the submit button */}
          <div></div>
        </Form>
      </Paper>

      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
        <Button variant="outlined" onClick={() => navigate("/schema-editor")}>
          Back to Schema Editor
        </Button>
        <Button variant="contained" color="primary" onClick={handleSubmit}>
          Save Template
        </Button>
      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleClose}
        message="Template saved successfully!"
      />
    </Box>
  );
};

export default FormRenderer;
