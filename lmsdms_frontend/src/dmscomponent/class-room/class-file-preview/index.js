import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Box, Typography, CircularProgress } from "@mui/material";
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { useUpdateClassroomPreviewMutation } from "apilms/classRoomApi";
// import { useUpdateClassroomPreviewMutation } from "path-to-your-api/classRoomApi"; // Adjust import path as needed
// useUpdateClassroomPreviewMutation
const ClassFileView = () => {
  const location = useLocation();
  const newRowData = location.state?.rowData || null;
  const classroomId = newRowData?.classroom_id;
  const BASE_URL = process.env.REACT_APP_APIKEY;
  
  const pdfUrl = newRowData?.files?.length > 0 
    ? `${newRowData.files[0].upload_doc}`  
    : null;

  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  const [updateClassroomPreview] = useUpdateClassroomPreviewMutation();

  useEffect(() => {
    if (classroomId) {
      updateClassroomPreview({ classroom_id: classroomId, is_preview: true })
        .unwrap()
        .then((response) => {
          console.log("Classroom preview status updated:", response);
        })
        .catch((error) => {
          console.error("Error updating classroom preview status:", error);
        });
    }
  }, [classroomId, updateClassroomPreview]);

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
    } else {
      setLoading(false);
    }
  }, [pdfUrl]);

  return (
    <Box sx={{ width: "100%", textAlign: "center", marginTop: 2 }}>
      {loading ? (
        <CircularProgress />
      ) : blobUrl ? (
        <iframe src={blobUrl} width="800px" height="1000px" title="PDF Preview"></iframe>
      ) : (
        <Box sx={{ 
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center", 
          justifyContent: "center", 
          height: "250px",
          width: "500px", 
          margin: "50px auto",
          color: "#444",
          backgroundColor: "#f9f9f9",
          borderRadius: "12px",
          padding: "20px",
          boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
          textAlign: "center"
        }}>
          <PictureAsPdfIcon sx={{ fontSize: 80, color: "#d32f2f" }} /> 
          <Typography variant="h6" sx={{ mt: 2, fontWeight: "bold" }}>
            No PDF Available
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            It looks like this document is missing or has not been uploaded.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default ClassFileView;
