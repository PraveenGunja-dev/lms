import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Box, Typography, CircularProgress, AppBar, Toolbar } from "@mui/material";
import { useAuth } from "hooks/use-auth";
import { useCompleteViewDocumentMutation } from "apilms/trainingApi";
import MDBox from "components/MDBox";
import MDButton from "components/MDButton";

const TrainingDocumentObsoleteView = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { docId: document_id, templateId, front_file_url } = location.state || {};
  console.log("File URL:", front_file_url);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editorConfig, setEditorConfig] = useState(null);
  const [docEditorLoaded, setDocEditorLoaded] = useState(false);
  const docEditorRef = useRef(null);
  const [completeViewDocument] = useCompleteViewDocumentMutation();

  const fetchEditorConfig = async () => {
    const apiUrl = process.env.REACT_APP_APIKEY;
    try {
      console.log("Fetching editor config for URL:", front_file_url);
      const cleanFrontFileUrl = front_file_url.startsWith('/') ? front_file_url.substring(1) : front_file_url;
      const fullUrl = `${apiUrl}dms_module/get_editor_config_for_obsolete_doc?front_file_url=${apiUrl}${cleanFrontFileUrl}`;
      
      console.log("Making request to:", fullUrl);
      const response = await fetch(fullUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${sessionStorage.getItem("token")}` },
        credentials: "include",
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Response not OK:", response.status, errorText);
        throw new Error(`Failed to fetch ONLYOFFICE configuration: ${response.status}`);
      }
      
      const config = await response.json();
      console.log("Editor config received:", config);
      setEditorConfig(config);
      setDocEditorLoaded(true);
    } catch (fetchError) {
      console.error("Fetch error:", fetchError);
      setError(`Failed to fetch ONLYOFFICE configuration: ${fetchError.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (front_file_url) {
      fetchEditorConfig();
    } else {
      console.error("Missing front_file_url");
      setError("File URL is missing");
      setLoading(false);
    }

    return () => {
      setEditorConfig(null);
      setDocEditorLoaded(false);
      console.log("Cleanup: Resetting editor config");
    };
  }, [front_file_url]);

  useEffect(() => {
    if (docEditorLoaded && editorConfig) {
      console.log("Initializing ONLYOFFICE editor");
      const script = document.createElement("script");
      script.src = process.env.REACT_APP_ONLYOFFICE_SCRIPT;
      
      script.onload = () => {
        try {
          console.log("ONLYOFFICE script loaded, creating editor");
          docEditorRef.current = new window.DocsAPI.DocEditor("onlyoffice-editor-container", {
            width: "100%",
            height: "100%",
            type: "desktop",
            document: editorConfig.document,
            editorConfig: {
              mode: "view",
              callbackUrl: editorConfig.callbackUrl,
              user: { 
                id: user?.id || "1", 
                name: user?.first_name || "User" 
              }
            },
            events: {
              onAppReady: () => {
                window.docEditor = docEditorRef.current;
                console.log("ONLYOFFICE Editor is Ready in View Mode");
              },
              onError: (event) => {
                console.error("Editor error:", event);
                return true;
              },
              onDocumentReady: () => {
                console.log("Document is loaded and ready");
              }
            },
            token: editorConfig.token,
          });
          console.log("ONLYOFFICE editor initialized in view mode");
        } catch (initError) {
          console.error("Editor initialization error:", initError);
          setError(`Failed to initialize ONLYOFFICE editor: ${initError.message}`);
        }
      };
      
      script.onerror = (e) => {
        console.error("Script load error:", e);
        setError("Failed to load ONLYOFFICE script");
      };
      
      document.body.appendChild(script);
      
      return () => {
        if (docEditorRef.current) {
          try {
            docEditorRef.current.destroyEditor();
            console.log("Cleanup: ONLYOFFICE editor destroyed");
          } catch (err) {
            console.error("Error destroying editor:", err);
          }
          docEditorRef.current = null;
        }
        document.body.removeChild(script);
        console.log("Cleanup: ONLYOFFICE script removed");
      };
    }
  }, [docEditorLoaded, editorConfig, user]);

  if (loading) {
    return (
      <Box sx={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress />
        <Typography sx={{ marginLeft: 2 }}>Loading editor...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 2 }}>
        <Typography variant="h6" color="error">{`Error: ${error}`}</Typography>
        <MDButton variant="contained" color="primary" onClick={() => navigate("/archived-listing")}>
          Go Back
        </MDButton>
      </Box>
    );
  }

  return (
    <MDBox
      sx={{
        fontFamily: "Arial, sans-serif",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        backgroundColor: "#f4f4f4",
        minHeight: "100vh",
        position: "relative",
      }}
    >
      <AppBar position="static">
        <Toolbar sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography variant="h6">Obsolete Document View</Typography>
          <MDButton 
            variant="contained" 
            color="primary" 
            onClick={() => navigate("/archived-listing")}
          >
            Go Back
          </MDButton>
        </Toolbar>
      </AppBar>
      <Box 
        id="onlyoffice-editor-container" 
        sx={{ 
          flex: 1, 
          backgroundColor: "#fff",
          boxShadow: 2,
          margin: "20px", 
        }} 
      />
    </MDBox>
  );
};

export default TrainingDocumentObsoleteView;