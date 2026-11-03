import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Box, Typography, CircularProgress, AppBar, Toolbar, Button } from "@mui/material";
import { useAuth } from "hooks/use-auth";
import MDBox from "components/MDBox";
import MDButton from "components/MDButton";

const DocumentPreviewComponent = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { docId, templateId,document_current_status } = location.state || {};
  const [loading, setLoading] = useState(true); 
  console.log("document iddddddddddddd",document_current_status)
  const docEditorRef = useRef(null);
  const [error, setError] = useState(null);
  const [docEditorLoaded, setDocEditorLoaded] = useState(false);
  const [editorConfig, setEditorConfig] = useState(null);
  const handlePrint = () => {
    console.log("Id passed:", docId);
    console.log("document sttatusssssssssssssssssss",document_current_status)
    navigate(`/print-document/${docId}?status=${document_current_status}`);
  };
  useEffect(() => {
    const fetchEditorConfig = async () => {
      try {
        const response = await fetch(
          // `http://127.0.0.1:8000/dms_module/get_editor_config?document_id=${docId}&template_id=${templateId}`,
        `${process.env.REACT_APP_APIKEY}dms_module/get_editor_config?document_id=${docId}&template_id=${templateId}&is_view=${true}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${sessionStorage.getItem("token")}` },
            body: JSON.stringify({
              user_name: user?.first_name,
            }),
          }
        );
        if (!response.ok) {
          throw new Error("Failed to fetch editor configuration");
        }

        const config = await response.json();
        setEditorConfig(config);
        setDocEditorLoaded(true);
      } catch (fetchError) {
        setError("Failed to fetch ONLYOFFICE configuration");
        console.error(fetchError);
      } finally {
        setLoading(false);
      }
    };

    if (docId && templateId) {
      fetchEditorConfig();
    } else {
      setError("Document or template information is missing");
    }

    return () => {
      setEditorConfig(null);
      setDocEditorLoaded(false);
      console.log("Cleanup: Resetting editor config");
    };
  }, [docId, templateId, user]);

  useEffect(() => {
    if (docEditorLoaded && editorConfig) {
      const script = document.createElement("script");
      // script.src = "http://127.0.0.1/web-apps/apps/api/documents/api.js";
      script.src = process.env.REACT_APP_ONLYOFFICE_SCRIPT;
      script.onload = () => {
        try {
          docEditorRef.current = new window.DocsAPI.DocEditor("onlyoffice-editor-container", {
            width: "100%",
            height: "100%",
            type: "desktop",
            document: editorConfig.document,
            // document: {
            //   // Copy existing document settings
            //   ...editorConfig.document,
            //   // Override permissions
            //   permissions: {
            //     // ...editorConfig.document.permissions,
            //     print: false
            //   }
            // },
            editorConfig: {
              mode: "view",
              showHeader: false,
              showMenu: false,
              downloadButton: false,
              printButton: false,
              callbackUrl: editorConfig.callbackUrl,
              user: {
                id: "1",
                name: `${user?.first_name}`,
              },
              watermark: {
                text: "Confidential",
                color: "rgba(255, 0, 0, 0.5)",
                fontSize: 50,
                diagonal: true,
                visibleForAllUsers: true,
              },
              customization: {
                autosave: false,
                forcesave: false,
                review: {
                  trackChanges: true,        // Enable track changes
                  showReviewChanges: true,   // Show review changes panel
                },
                features: {
                  trackChanges: true         // Make sure track changes feature is enabled
                },
                saveButton: false,
                showReviewChanges: true,
                layout: {
                  toolbar: {
                    file: {
                      print: false,
                      download: false
                    }
                  }
                },
                trackChanges: true,
                chat: false,
                comments: true,
                zoom: 100,
                compactHeader: false,
                leftMenu: true,
                rightMenu: false,
                toolbar: true,
                statusBar: false,
                autosaveMessage: false,
                forcesaveMessage: false,
                downloadButton: false,
                printButton: false,
              },
            },
            events: {
              onAppReady: async () => {
                window.docEditor = docEditorRef.current;
                console.log("ONLYOFFICE Editor is Ready in View Mode");
              },
              onError: (event) => {
                console.error("Editor error:", event);
                return true;
              },
              onRequestPrint: (event) => {
                console.log("Print requested but blocked");
                alert("Printing is disabled for this document.");
                return false;
              },
            },
            token: editorConfig.token,
          });
          console.log("ONLYOFFICE editor initialized in view mode");
        } catch (initError) {
          setError("Failed to initialize ONLYOFFICE editor");
          console.error(initError);
        }
      };
      script.onerror = () => {
        setError("Failed to load ONLYOFFICE script");
        console.error("Script load error");
      };
      document.body.appendChild(script);
      return () => {
        if (docEditorRef.current) {
          docEditorRef.current.destroyEditor();
          docEditorRef.current = null;
          console.log("Cleanup: ONLYOFFICE editor destroyed");
        }
        document.body.removeChild(script);
        console.log("Cleanup: ONLYOFFICE script removed");
      };
    }
  }, [docEditorLoaded, editorConfig, user]);

  if (loading) {
    return (
      <Box padding={2} display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
        <Typography sx={{ marginLeft: 2 }}>Loading editor...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box padding={2} display="flex" justifyContent="center" alignItems="center" height="100vh">
        <Typography variant="h6" color="error">{`Error: ${error}`}</Typography>
      </Box>
    );
  }
  window.print = () => {
    alert("Printing is disabled on this page.");
  };
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
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Document View
          </Typography>
          <div>
          <MDButton
            variant="contained"
            color="secondary"
            onClick={handlePrint}
            sx={{ ml: 2 }}
          >
            Print
          </MDButton>
          <MDButton
            variant="contained"
            color="primary"
            onClick={() => navigate(-1)}
            sx={{ ml: 2 }}
          >
            Go Back
          </MDButton>
          </div>

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

export default DocumentPreviewComponent;