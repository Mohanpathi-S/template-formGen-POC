import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Typography, Paper, Tabs, Tab, Button, CircularProgress, Alert, Radio, RadioGroup, FormControlLabel, FormLabel } from "@mui/material";
import Form from "@rjsf/mui";
import { RJSFSchema } from "@rjsf/utils";
import validator from "@rjsf/validator-ajv8";
import { templateApi } from "../services/api";
import { Template, Component } from "../types";

interface TabPanelProps {
  readonly children?: React.ReactNode;
  readonly index: number;
  readonly value: number;
}

function TabPanel(props: Readonly<TabPanelProps>) {
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

const TemplateDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [template, setTemplate] = useState<Template | null>(null);
  const [components, setComponents] = useState<Component[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [activeSubComponent, setActiveSubComponent] = useState(0);

  useEffect(() => {
    if (id) {
      fetchTemplate(id);
    }
  }, [id]);

  const fetchTemplate = async (templateId: string) => {
    try {
      setLoading(true);

      // Validate the ID (basic validation for UUID format)
      if (!templateId || templateId.trim() === '') {
        throw new Error('Template ID is required');
      }

      const data = await templateApi.getTemplateById(templateId);
      setTemplate(data.template);
      setComponents(data.components);
      setError(null);
    } catch (err: any) {
      console.error("Error fetching template:", err);
      setError(err.message ?? "Error loading template. Template may not exist or server error.");
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setActiveSubComponent(0); // Reset subcomponent selection when switching tabs
  };

  // Helper function to get the current active schema
  const getCurrentSchema = (): RJSFSchema | null => {
    const component = components[tabValue];
    if (!component) return null;

    if (component.subcomponents && component.subcomponents.length > 0) {
      return component.subcomponents[activeSubComponent]?.schema_json || null;
    }
    
    return component.schema_json;
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
                  {component.subcomponents && component.subcomponents.length > 0 && (
                    <Typography variant="body2" color="text.secondary" component="span" sx={{ ml: 1 }}>
                      - {component.subcomponents[activeSubComponent]?.title}
                    </Typography>
                  )}
                </Typography>

                {/* Subcomponent radio buttons */}
                {component.subcomponents && component.subcomponents.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <FormLabel component="legend" sx={{ mb: 2 }}>
                      Select Subcomponent:
                    </FormLabel>
                    <RadioGroup
                      row
                      value={activeSubComponent}
                      onChange={(e) => setActiveSubComponent(parseInt(e.target.value))}
                    >
                      {component.subcomponents.map((subComponent, subIndex) => (
                        <FormControlLabel
                          key={subComponent.key}
                          value={subIndex}
                          control={<Radio />}
                          label={subComponent.title}
                        />
                      ))}
                    </RadioGroup>
                  </Box>
                )}

                {(() => {
                  const currentSchema = getCurrentSchema();
                  if (!currentSchema) {
                    return (
                      <Typography variant="body2" color="text.secondary">
                        No schema found for this component.
                      </Typography>
                    );
                  }

                  return (
                    <Form
                      schema={currentSchema}
                      validator={validator}
                      formData={{}}
                      readonly
                      disabled
                      liveValidate
                    />
                  );
                })()}
              </Box>
            </TabPanel>
          ))}
        </Paper>
      )}
    </Box>
  );
};

export default TemplateDetail;
