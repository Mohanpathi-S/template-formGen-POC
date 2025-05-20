import React, { useState, useEffect } from "react";
import { Box, Typography, Paper, List, ListItem, ListItemText, Button, Divider, CircularProgress } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { templateApi } from "../services/api";
import { Template } from "../types";

const TemplateList = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const templates = await templateApi.getAllTemplates();
      setTemplates(templates);
      setError(null);
    } catch (err: any) {
      console.error("Error fetching templates:", err);
      setError(err.message ?? "Error loading templates. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewTemplate = (id: string) => {
    navigate(`/templates/${id}`);
  };

  const handleCreateNew = () => {
    navigate("/");
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
        <Typography color="error" paragraph>
          {error}
        </Typography>
        <Button variant="contained" onClick={() => fetchTemplates()}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4">Template Library</Typography>
        <Button variant="contained" color="primary" onClick={handleCreateNew}>
          Create New Template
        </Button>
      </Box>

      {templates.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h6" gutterBottom>
            No Templates Found
          </Typography>
          <Typography variant="body1" paragraph>
            Get started by creating your first template
          </Typography>
          <Button variant="contained" color="primary" onClick={handleCreateNew}>
            Create Template
          </Button>
        </Paper>
      ) : (
        <Paper sx={{ p: 0 }}>
          <List>
            {templates.map((template, index) => (
              <React.Fragment key={template.id}>
                <ListItem
                  onClick={() => handleViewTemplate(template.id)}
                  sx={{ py: 2, px: 3, "&:hover": { bgcolor: "#f5f5f5" }, cursor: "pointer" }}
                >
                  <ListItemText
                    primary={template.name}
                    secondary={
                      <>
                        <Typography variant="body2" component="span" color="text.primary">
                          {template.description}
                        </Typography>
                        <br />
                        <Typography variant="caption" component="span">
                          Created: {new Date(template.created_at).toLocaleDateString()}
                        </Typography>
                      </>
                    }
                  />
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewTemplate(template.id);
                    }}
                  >
                    View
                  </Button>
                </ListItem>
                {index < templates.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
};

export default TemplateList;
