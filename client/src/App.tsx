import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { Container, AppBar, Toolbar, Typography, Box, Paper, Button } from "@mui/material";
import FileUpload from "./components/FileUpload";
import SchemaEditor from "./components/SchemaEditor";
import FormRenderer from "./components/FormRenderer";
import TemplateList from "./components/TemplateList";
import TemplateDetail from "./components/TemplateDetail";

function App() {
  return (
    <Router>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Template Generator
          </Typography>
          <Box sx={{ display: "flex", gap: 2 }}>
            <Link to="/" style={{ color: "white", textDecoration: "none" }}>
              Home
            </Link>
            <Link to="/templates" style={{ color: "white", textDecoration: "none" }}>
              Templates
            </Link>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/schema-editor" element={<SchemaEditor />} />
          <Route path="/form-renderer" element={<FormRenderer />} />
          <Route path="/templates" element={<TemplateList />} />
          <Route path="/templates/:id" element={<TemplateDetail />} />
        </Routes>
      </Container>
    </Router>
  );
}

function Home() {
  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h4" gutterBottom>
        Excel Template Generator
      </Typography>
      <Typography variant="body1" paragraph>
        Upload an Excel file to generate a schema and create dynamic forms.
      </Typography>

      <Paper sx={{ p: 3, mt: 3 }}>
        <FileUpload />
      </Paper>

      <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
        <Button variant="contained" color="primary" component={Link} to="/templates">
          View Saved Templates
        </Button>
      </Box>
    </Box>
  );
}

export default App;
