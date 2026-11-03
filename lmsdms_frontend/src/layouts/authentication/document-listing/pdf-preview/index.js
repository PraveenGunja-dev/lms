import React, { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom"; 
import { Box, AppBar, Toolbar, Typography, Button } from "@mui/material";
import { useGenerateCertificatePdfQuery } from "api/auth/documentApi";

const PDFPreview = () => {
  const location = useLocation();
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfBlob, setPdfBlob] = useState(null);
  const { documentId } = location.state || {}; // Retrieve documentId from state
  const { data, isLoading, error } = useGenerateCertificatePdfQuery(documentId); 
  const pdfContainerRef = useRef(null); // Reference to the container where PDF will be rendered

  // Fetch the PDF and display it as a preview
  useEffect(() => {
    if (data) {
      if (typeof data === "string" && (data.startsWith("http") || data.startsWith("data:application/pdf"))) {
        setPdfUrl(data); 
        // If the PDF is a URL or data URI, convert it to a blob for preview
        fetch(data)
          .then((response) => response.blob())
          .then((blob) => setPdfBlob(blob))
          .catch((error) => console.error("Error fetching PDF:", error));
      } else {
        console.error("Invalid PDF data received");
      }
    }
  }, [data]);

  const handleDownload = () => {
    if (pdfUrl) {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `document_certificate_${documentId}.pdf`; // Provide a filename for download
      link.click();
    }
  };

  // Render the PDF Blob for preview
  const renderPDFPreview = () => {
    if (pdfBlob && pdfContainerRef.current) {
      const fileReader = new FileReader();
      fileReader.onloadend = () => {
        const pdfDataUrl = fileReader.result;
        const embed = document.createElement("embed");
        embed.src = pdfDataUrl;
        embed.width = "100%";
        embed.height = "100%"; // Set the desired height for the preview
        pdfContainerRef.current.innerHTML = ""; // Clear previous content
        pdfContainerRef.current.appendChild(embed);
      };
      fileReader.readAsDataURL(pdfBlob);
    }
  };

  useEffect(() => {
    renderPDFPreview(); // Render PDF preview when blob is set
  }, [pdfBlob]);

  return (
    <Box sx={{ width: "100%",height:"100%",mx: "auto", marginLeft: "auto",marginRight: 4, marginTop: 2 }}>
    <Box sx={{ marginTop: 2 }}>
      {isLoading && <Typography>Loading PDF...</Typography>}
      {error && <Typography>Error loading PDF: {error.message}</Typography>}
  
      {/* Check if pdfUrl or pdfBlob is available */}
      {pdfUrl || pdfBlob ? (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
         
          <Box
            ref={pdfContainerRef}
            sx={{
              width: "800px",  
              height: "1000px", 
              marginBottom: 2,
              border: "1px solid #ccc",
              overflow: "hidden",
            }}
          ></Box>
        </Box>
      ) : (
        <Typography>No PDF available</Typography>
      )}
    </Box>
  </Box>
  
  );
};

export default PDFPreview;
