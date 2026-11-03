
import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Box, Typography, CircularProgress, AppBar, Toolbar, Button } from "@mui/material";
import { useAuth } from "hooks/use-auth";
import { useCompleteViewDocumentMutation } from "apilms/trainingApi";
import MDBox from "components/MDBox";
import MDButton from "components/MDButton";

const TrainingDocumentView = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { docId:document_id,templateId  } = location.state || {};
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editorConfig, setEditorConfig] = useState(null);
  const docEditorRef = useRef(null);
  const [timeLeft, setTimeLeft] = useState(6);
  const timerRef = useRef(null);
  const [completeViewDocument] = useCompleteViewDocumentMutation();
    // console.log(document_id,templateId);
  useEffect(() => {
    if (document_id && templateId) {
      fetchEditorConfig();
    } else {
      setError("Document ID is missing");
      setLoading(false);
    }
  }, [document_id,templateId]);

  const fetchEditorConfig = async () => {
    const apiUrl = process.env.REACT_APP_APIKEY;
    try {
    //   const response = await fetch(`http://127.0.0.1:8000/dms_module/get_editor_config?document_id=${document_id}&template_id=${templateId}`);
    const response = await fetch(`${apiUrl}dms_module/get_editor_config?document_id=${document_id}&template_id=${templateId}&is_view=${true}`, {
      headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` },
    });
      if (!response.ok) throw new Error("Failed to fetch ONLYOFFICE configuration");
      const config = await response.json();
      setEditorConfig(config);
    } catch (fetchError) {
      setError("Failed to fetch ONLYOFFICE configuration");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (editorConfig) {
      const script = document.createElement("script");
    //   script.src = "http://127.0.0.1/web-apps/apps/api/documents/api.js";
      script.src = process.env.REACT_APP_ONLYOFFICE_SCRIPT;
      script.onload = () => {
        try {
          docEditorRef.current = new window.DocsAPI.DocEditor("onlyoffice-editor-container", {
            width: "100%",
            height: "100%",
            type: "desktop",
            document: editorConfig.document,
            editorConfig: {
              mode: "view",
              callbackUrl: editorConfig.callbackUrl,
              user: { id: user?.id, name: user?.first_name },
            },
            token: editorConfig.token,
          });
        } catch (error) {
          setError("Failed to initialize ONLYOFFICE editor");
        }
      };
      script.onerror = () => setError("Failed to load ONLYOFFICE script");
      document.body.appendChild(script);
      return () => {
        document.body.removeChild(script);
        docEditorRef.current = null;
    }
    }
  }, [editorConfig, user]);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleDocumentCompletion();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const handleDocumentCompletion = async () => {
    if (document_id && user?.id) {
      try {
        await completeViewDocument({ document_id, user_id: user.id }).unwrap();
      } catch (error) {
        console.error("Error completing document view:", error);
      }
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

//   if (loading) return <CircularProgress />;
//   if (error) return <Typography color="error">{error}</Typography>;
if (loading || error) {
    return (
      <Box sx={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {loading ? <CircularProgress /> : <Typography color="error">{error}</Typography>}
      </Box>
    );
  }
  return (
    // <Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
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
    <Typography variant="h6">Document View</Typography>
    <Typography 
  variant="h5" 
  sx={{ 
    marginLeft: "auto", 
    marginRight: "20px", 
    fontWeight: "bold", 
    color: timeLeft > 0 ? "inherit" : "red",
    animation: timeLeft === 0 ? "blink 1s infinite alternate" : "none",
    "@keyframes blink": {
      "0%": { opacity: 1 },
      "100%": { opacity: 0.5 },
    },
  }}
>
  {timeLeft > 0 ? `Time Left: ${formatTime(timeLeft)}` : "⏳ SOP Completed"}
</Typography>
    <MDButton variant="contained" color="primary" onClick={() => navigate("/trainingListing")}>
      Go Back
    </MDButton>
  </Toolbar>
</AppBar>
      <Box id="onlyoffice-editor-container" sx={{ flex: 1, backgroundColor: "#fff" }} />
    </MDBox>
  );
};

export default TrainingDocumentView;
