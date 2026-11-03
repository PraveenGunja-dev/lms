import React, { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom"; // Import useLocation
import { renderAsync } from "docx-preview";
import { Box, AppBar, Toolbar, Typography, Button } from "@mui/material";

const DocView = () => {
  const location = useLocation(); // Access the state passed via navigate
  const [docContent, setDocContent] = useState(null); // Blob for docx-preview
  const docxContainerRef = useRef(null);
  // const [timeLeft, setTimeLeft] = useState(600); // Fixed 10-minute timer (600 seconds)
  // const timerRef = useRef(null); // Timer reference
  
  // Retrieve the document URL from the location state
  const { templateDoc,new_url, templateData } = location.state || {}; // Access minimumReadingTime
  // console.log(templateData)
  // console.log("NewNewNewNew",new_url)
  // console.log(location.state)
  // console.log("Template Data",templateData)
  // console.log()
  // Load the .docx file dynamically based on the URL
  useEffect(() => {
    const docUrl = new_url || templateDoc;
    if (docUrl) {
      fetch(docUrl)
        .then((response) => response.blob())
        .then((blob) => setDocContent(blob))
        .catch((error) => console.error("Error fetching document:", error));
    }
  }, [templateDoc, new_url]);

  // Start timer when the component loads
  // useEffect(() => {
  //   // Set a fixed 10-minute timer (600 seconds)
  //   setTimeLeft(600);

  //   timerRef.current = setInterval(() => {
  //     setTimeLeft((prevTime) => {
  //       if (prevTime <= 1) {
  //         clearInterval(timerRef.current);
  //         sendTimeExceededMessage(); // Call the function to send message when time exceeds
  //         return 0;
  //       }
  //       return prevTime - 1;
  //     });
  //   }, 1000);

  //   return () => clearInterval(timerRef.current); // Cleanup the timer on unmount
  // }, []);

  // Backend request when timer ends
  const sendTimeExceededMessage = async () => {
    // Placeholder function for sending a time exceeded message (adjust as needed)
    console.log("Time exceeded. Implement backend request here.");
    // You can integrate API calls like axios here to notify the server

  };

  // Render the .docx file using docx-preview
  useEffect(() => {
    if (docContent && docxContainerRef.current) {
      renderAsync(docContent, docxContainerRef.current).catch((error) =>
        console.error("Error rendering document:", error)
      );
    }
  }, [docContent]);

  // Format time in MM:SS format
  // const formatTime = (seconds) => {
  //   const minutes = Math.floor(seconds / 60);
  //   const secs = seconds % 60;
  //   return `${minutes}:${secs.toString().padStart(2, "0")}`;
  // };

  return (
    <Box sx={{ padding: 2 }}>
      <AppBar position="static">
        <Toolbar>
          {/* <Typography variant="h6">Document Viewer</Typography> */}
        </Toolbar>
      </AppBar>

      {/* <Box
        sx={{
          marginTop: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "#f5f5f5", // Background color behind the title and ID
          padding: 2,
          borderRadius: 1,
          maxWidth:'794px',
          marginX:"auto"
        }}
      >
        <Typography variant="h5">Document Title: {templateData?.document_title || "Untitled"}</Typography>
        <Typography variant="h5">Time Left: {timeLeft !== null ? formatTime(timeLeft) : "Loading..."}</Typography>
      </Box> */}

      <Box sx={{ marginTop: 0 }}>
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

export default DocView;
