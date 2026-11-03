import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Box, Typography, CircularProgress, AppBar, Toolbar, Stepper, Step, StepLabel } from "@mui/material";
import { useAuth } from "hooks/use-auth";
import { useCompleteViewDocumentMutation } from "apilms/trainingApi";
import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import { useFetchParentDocumentsQuery } from "api/auth/documentApi";

const ParentTrainingDocumentView = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { docId: parentDocId, templateId: parentTemplateId } = location.state || {};
  
  // State for managing documents
  const [currentDocIndex, setCurrentDocIndex] = useState(0);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editorConfig, setEditorConfig] = useState(null);
  const docEditorRef = useRef(null);
  
  // Timer state
  const [timeLeft, setTimeLeft] = useState(600); // Default to parent document time
  const [timerActive, setTimerActive] = useState(false);
  const [timerComplete, setTimerComplete] = useState(false);
  const timerRef = useRef(null);
  
  // Track locally completed documents (without API calls)
  const [completedDocs, setCompletedDocs] = useState([]);
  
  // Track whether all documents have been completed and reported to backend
  const [allCompletedReported, setAllCompletedReported] = useState(false);
  
  // RTK hooks
  const [completeViewDocument] = useCompleteViewDocumentMutation();
  const { data: childDocuments, isLoading: isLoadingChildDocs, error: childDocsError } = 
    useFetchParentDocumentsQuery(parentDocId, { skip: !parentDocId });

  // Add parent document and child documents to the list
  useEffect(() => {
    if (parentDocId && parentTemplateId) {
      // Add parent document first
      const allDocuments = [{ id: parentDocId, select_template: parentTemplateId, isParent: true }];
      
      // Add child documents if available
      if (childDocuments && childDocuments.length > 0) {
        childDocuments.forEach(doc => {
          allDocuments.push({
            id: doc.id,
            select_template: doc.select_template,
            title: doc.document_title,
            isParent: false
          });
        });
      }
      
      setDocuments(allDocuments);
    } else {
      setError("Document ID is missing");
      setLoading(false);
    }
  }, [parentDocId, parentTemplateId, childDocuments]);

  // Fetch editor config for current document
  useEffect(() => {
    if (documents.length > 0 && currentDocIndex < documents.length) {
      const currentDoc = documents[currentDocIndex];
      const timerDuration = currentDoc.isParent ? 8 : 4; // 600s (10min) or 180s (3min)
      setTimeLeft(timerDuration);
      setTimerComplete(false);
      fetchEditorConfig(currentDoc.id, currentDoc.select_template);
    }
  }, [documents, currentDocIndex]);

  // Check if all documents are completed and trigger ONE API call
  useEffect(() => {
    const allDocumentsCompleted = documents.length > 0 && completedDocs.length === documents.length;
    
    if (allDocumentsCompleted && !allCompletedReported) {
      // All documents have been viewed locally - now make the ONE API call
      handleAllDocumentsCompleted();
    }
  }, [completedDocs, documents]);

  const fetchEditorConfig = async (docId, tempId) => {
    const apiUrl = process.env.REACT_APP_APIKEY;
    setLoading(true);
    setEditorConfig(null);
    setTimerActive(false); // Pause timer while loading
    
    try {
      const response = await fetch(`${apiUrl}dms_module/get_editor_config?document_id=${docId}&template_id=${tempId}&is_view=${true}`, {
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

  // Initialize OnlyOffice editor
  useEffect(() => {
    if (editorConfig) {
      const script = document.createElement("script");
      script.src = process.env.REACT_APP_ONLYOFFICE_SCRIPT;
      script.onload = () => {
        try {
          // Clean up previous editor instance if exists
          if (docEditorRef.current) {
            docEditorRef.current.destroyEditor();
          }
          
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
          
          // Start timer once editor is loaded
          setTimerActive(true);
        } catch (error) {
          setError("Failed to initialize ONLYOFFICE editor");
        }
      };
      script.onerror = () => setError("Failed to load ONLYOFFICE script");
      document.body.appendChild(script);
      return () => {
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
        if (docEditorRef.current) {
          docEditorRef.current.destroyEditor();
          docEditorRef.current = null;
        }
      };
    }
  }, [editorConfig, user]);

  // Timer management - only runs when timerActive is true
  useEffect(() => {
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Only start timer if it should be active
    if (timerActive) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleLocalDocumentCompletion();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timerActive, currentDocIndex]);

  // Just mark document as completed locally WITHOUT making API call
  const handleLocalDocumentCompletion = () => {
    const currentDoc = documents[currentDocIndex];
    
    if (currentDoc && !completedDocs.includes(currentDoc.id)) {
      // Only mark as complete locally - no API call here
      setCompletedDocs(prev => [...prev, currentDoc.id]);
      setTimerComplete(true);
    }
  };

  // Make ONE API call after ALL documents have been completed locally
  const handleAllDocumentsCompleted = async () => {
    if (parentDocId && parentTemplateId && user?.id && !allCompletedReported) {
      try {
        // Make ONLY ONE API call when everything is complete
        await completeViewDocument({ 
          document_id: parentDocId,
          template_id: parentTemplateId,
          user_id: user.id
        }).unwrap();
        
        setAllCompletedReported(true);
        console.log("All documents completed - sent ONE completion notification to backend");
      } catch (error) {
        console.error("Error reporting completion to backend:", error);
      }
    }
  };

  const goToNextDocument = () => {
    setTimerActive(false); // Stop timer before moving to next document
    setCurrentDocIndex(prevIndex => prevIndex + 1);
  };

  const goToPrevDocument = () => {
    setTimerActive(false); // Stop timer before moving to previous document
    setCurrentDocIndex(prevIndex => prevIndex - 1); // Fixed the previous bug
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  // Calculate overall progress
  const progress = documents.length > 0 
    ? Math.round((completedDocs.length / documents.length) * 100) 
    : 0;

  // Determine if all documents have been viewed locally
  const allDocumentsCompleted = documents.length > 0 && completedDocs.length >= documents.length;

  // Get current document title for display
  const currentDocTitle = documents[currentDocIndex]?.title || 
    (documents[currentDocIndex]?.isParent ? "Parent Document" : `Child Document ${currentDocIndex}`);

  if (isLoadingChildDocs || loading) {
    return (
      <Box sx={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || childDocsError) {
    return (
      <Box sx={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Typography color="error">{error || childDocsError}</Typography>
      </Box>
    );
  }

  const isCurrentDocCompleted = completedDocs.includes(documents[currentDocIndex]?.id);

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
          <Typography variant="h6">
            {documents[currentDocIndex]?.isParent 
              ? "Parent Document (10 min required)" 
              : `Child Document (3 min required) - ${currentDocIndex}/${documents.length - 1}`}
          </Typography>
          
          <Typography 
            variant="h5" 
            sx={{ 
              marginLeft: "auto", 
              marginRight: "20px", 
              fontWeight: "bold", 
              color: isCurrentDocCompleted ? "green" : (timerActive ? "#1976d2" : "#f57c00"),
              animation: timerComplete ? "blink 1s infinite alternate" : "none",
              "@keyframes blink": {
                "0%": { opacity: 1 },
                "100%": { opacity: 0.5 },
              },
            }}
          >
            {isCurrentDocCompleted 
              ? "✅ Document Completed" 
              : !timerActive && timeLeft > 0 
                ? "⏸️ Timer Paused" 
                : `⏱️ ${formatTime(timeLeft)}`}
          </Typography>
          
          <MDButton variant="contained" color="primary" onClick={() => navigate("/trainingListing")}>
            Go Back
          </MDButton>
        </Toolbar>
      </AppBar>
      
      {/* Progress stepper */}
      <Box sx={{ 
        backgroundColor: "#fff", 
        padding: 2, 
        borderBottom: "1px solid #e0e0e0",
        display: "flex",
        alignItems: "center"
      }}>
        {/* <Stepper activeStep={currentDocIndex} orientation="horizontal" sx={{ width: "100%" }}>
          {documents.map((doc, index) => (
            <Step key={index} completed={completedDocs.includes(doc.id)}>
              <StepLabel>
                {doc.isParent ? "Parent Document" : `Child ${index}`}
              </StepLabel>
            </Step>
          ))}
        </Stepper> */}
      </Box>
      
      {/* Document viewer */}
      <Box id="onlyoffice-editor-container" sx={{ flex: 1, backgroundColor: "#fff" }} />
      
      {/* Navigation controls */}
      <Box sx={{ 
        backgroundColor: "#fff", 
        padding: 2, 
        borderTop: "1px solid #e0e0e0",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <MDButton 
          variant="outlined" 
          color="primary" 
          disabled={currentDocIndex === 0}
          onClick={goToPrevDocument}
        >
          Previous Document
        </MDButton>
        
        <Box sx={{ textAlign: "center" }}>
          <Typography sx={{ fontWeight: "bold" }}>
            Overall Progress: {progress}%
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {completedDocs.length} of {documents.length} documents viewed
          </Typography>
          {allCompletedReported && (
            <Typography color="success.main" sx={{ fontWeight: "bold", mt: 1 }}>
              ✅ All documents completed!
            </Typography>
          )}
        </Box>
        
        <MDButton 
          variant="contained" 
          color="primary" 
          disabled={currentDocIndex >= documents.length - 1 || !isCurrentDocCompleted}
          onClick={goToNextDocument}
        >
          Next Document
        </MDButton>
      </Box>
    </MDBox>
  );
};

export default ParentTrainingDocumentView;