import React, { useState } from "react";
import { Box, Button, Typography, CircularProgress, Alert, Paper } from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const FileUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;
    setFile(selectedFile);
    setError(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!file) {
      setError("Please select a file to upload");
      return;
    }

    // Check if file is an Excel file
    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      setError("Please upload an Excel file (.xlsx or .xls)");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await axios.post("http://localhost:3001/api/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Store the extracted components and file name in session storage
      sessionStorage.setItem("uploadedFileName", response.data.fileName);
      sessionStorage.setItem("extractedComponents", JSON.stringify(response.data.components));

      // Navigate to schema editor for review and confirmation
      navigate("/schema-editor");
    } catch (err) {
      console.error("Error uploading file:", err);
      setError("Error uploading file. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="body1" paragraph>
        The Excel template generator allows you to:
      </Typography>
      <Box component="ul" sx={{ mb: 3 }}>
        <Typography component="li">Upload an Excel file to extract column headers</Typography>
        <Typography component="li">Edit and customize the generated schema</Typography>
        <Typography component="li">Save the template directly or preview with a form</Typography>
      </Box>

      <Paper elevation={0} sx={{ bgcolor: "#f5f5f5", p: 2, mb: 3, borderRadius: 1 }}>
        <Typography variant="subtitle2" gutterBottom color="primary">
          New! Improved Workflow
        </Typography>
        <Typography variant="body2">
          You can now save your template directly from the schema editor without needing to create a preview form.
        </Typography>
      </Paper>

      <form onSubmit={handleSubmit}>
        <Box
          sx={{
            border: "2px dashed #ccc",
            borderRadius: 2,
            p: 3,
            mb: 3,
            textAlign: "center",
            "&:hover": {
              backgroundColor: "#f8f8f8",
            },
          }}
        >
          <input
            type="file"
            id="file-upload"
            style={{ display: "none" }}
            onChange={handleFileChange}
            accept=".xlsx,.xls"
          />
          <label htmlFor="file-upload">
            <Button component="span" variant="contained" startIcon={<CloudUploadIcon />} sx={{ mb: 2 }}>
              Select Excel File
            </Button>
          </label>
          <Typography variant="body1" sx={{ mt: 1 }}>
            {file ? `Selected file: ${file.name}` : "No file selected"}
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Button type="submit" variant="contained" color="primary" fullWidth disabled={!file || loading}>
          {loading ? <CircularProgress size={24} /> : "Upload and Generate Schema"}
        </Button>
      </form>
    </Box>
  );
};

export default FileUpload;
