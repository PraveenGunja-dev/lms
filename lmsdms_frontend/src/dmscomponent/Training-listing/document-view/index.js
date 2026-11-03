import React, { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { renderAsync } from "docx-preview";
import { Box, Typography } from "@mui/material";
import { useAuth } from "hooks/use-auth";
import { useCompleteViewDocumentMutation } from "apilms/trainingApi";
// import { useCompleteViewDocumentMutation } from "src/apis/TrainingApi";
const LMSDocument = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [docContent, setDocContent] = useState(null);
  const docxContainerRef = useRef(null);
  const [timeLeft, setTimeLeft] = useState(600);
  const timerRef = useRef(null);
  const { documentView, document_id } = location.state || {};

  // Hook for completing document view
  const [completeViewDocument] = useCompleteViewDocumentMutation();

  useEffect(() => {
    if (documentView) {
      fetch(documentView)
        .then((response) => response.blob())
        .then((blob) => setDocContent(blob))
        .catch((error) => console.error("Error fetching document:", error));
    }
  }, [documentView]);

  useEffect(() => {
    setTimeLeft(10);
    timerRef.current = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timerRef.current);
          handleDocumentCompletion(); // Call API when time reaches zero
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, []);

  // Function to call API when time is up
  const handleDocumentCompletion = async () => {
    if (document_id && user?.id) {
      try {
        await completeViewDocument({ document_id, user_id: user.id }).unwrap();
        console.log("Document completion recorded successfully.");
      } catch (error) {
        console.error("Error completing document view:", error);
      }
    } else {
      console.warn("Document ID or User ID missing.");
    }
  };

  useEffect(() => {
    if (docContent && docxContainerRef.current) {
      renderAsync(docContent, docxContainerRef.current).catch((error) =>
        console.error("Error rendering document:", error)
      );
    }
  }, [docContent]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Box sx={{ padding: 2 }}>
      <Box
        sx={{
          marginTop: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "#f5f5f5",
          padding: 2,
          borderRadius: 1,
          maxWidth: "794px",
          marginX: "auto",
        }}
      >
        <Typography variant="h5">Time Left: {formatTime(timeLeft)}</Typography>
      </Box>

      <Box sx={{ marginTop: 2 }}>
        <Box
          ref={docxContainerRef}
          sx={{
            width: "794px",
            height: "950px",
            margin: "0 auto",
            border: "1px solid #ccc",
            overflowY: "auto",
            padding: 2,
            backgroundColor: "#fff",
          }}
        ></Box>
      </Box>
    </Box>
  );
};

export default LMSDocument;
