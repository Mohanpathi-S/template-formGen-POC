import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Typography, Paper, Tabs, Tab, Button, CircularProgress, Alert } from "@mui/material";
import Form from "@rjsf/mui";
import { RJSFSchema } from "@rjsf/utils";
import validator from "@rjsf/validator-ajv8";
import axios from "axios";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`template-tabpanel-${index}`}
      aria-labelledby={`template-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

interface Component {
  id: string;
  key: string;
  title: string;
  schema_json: RJSFSchema;
  order_index: number;
}

interface Template {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

const TemplateDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [template, setTemplate] = useState<Template | null>(null);
  const [components, setComponents] = useState<Component[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    if (id) {
      fetchTemplate(id);
    }
  }, [id]);

  const fetchTemplate = async (templateId: string) => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:3001/api/templates/${templateId}`);
      setTemplate(response.data.template);
      setComponents(response.data.components);
      setError(null);
    } catch (err) {
      console.error("Error fetching template:", err);
      setError("Error loading template. Template may not exist or server error.");
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleBackToList = () => {
    navigate("/templates");
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Button variant="contained" sx={{ mt: 2 }} onClick={handleBackToList}>
          Back to Templates
        </Button>
      </Box>
    );
  }

  if (!template) {
    return (
      <Box sx={{ mt: 4 }}>
        <Alert severity="warning">Template not found</Alert>
        <Button variant="contained" sx={{ mt: 2 }} onClick={handleBackToList}>
          Back to Templates
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4">{template.name}</Typography>
        <Button variant="outlined" onClick={handleBackToList}>
          Back to Templates
        </Button>
      </Box>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="body1" paragraph>
          {template.description}
        </Typography>
        <Typography variant="caption" display="block" gutterBottom>
          Created: {new Date(template.created_at).toLocaleString()}
        </Typography>
      </Paper>

      {components.length > 0 && (
        <Paper sx={{ p: 0, mb: 4 }}>
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="template components">
              {components.map((component, index) => (
                <Tab key={component.id} label={component.title} id={`template-tab-${index}`} />
              ))}
            </Tabs>
          </Box>

          {components.map((component, index) => (
            <TabPanel key={component.id} value={tabValue} index={index}>
              <Box sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Form Preview
                </Typography>
                <Form
                  schema={component.schema_json}
                  validator={validator}
                  formData={{}}
                  readonly
                  disabled
                  liveValidate
                />
              </Box>
            </TabPanel>
          ))}
        </Paper>
      )}
    </Box>
  );
};

export default TemplateDetail;
