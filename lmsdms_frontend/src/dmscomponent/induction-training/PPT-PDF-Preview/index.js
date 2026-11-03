import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Box, Typography, CircularProgress } from "@mui/material";

const PDFPreview = () => {
  const location = useLocation();
  const pdfUrl = location.state?.row?.document || null; // Retrieve PDF URL from state
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (pdfUrl) {
      fetch(pdfUrl)
        .then((response) => response.blob())
        .then((blob) => {
          const url = URL.createObjectURL(blob);
          setBlobUrl(url);
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching PDF:", error);
          setLoading(false);
        });
    }
  }, [pdfUrl]);

  return (
    <Box sx={{ width: "100%", textAlign: "center", marginTop: 2 }}>
      {loading ? (
        <CircularProgress />
      ) : blobUrl ? (
        <iframe src={blobUrl} width="800px" height="1000px" title="PDF Preview"></iframe>
      ) : (
        <Typography>No PDF available</Typography>
      )}
    </Box>
  );
};

export default PDFPreview;
