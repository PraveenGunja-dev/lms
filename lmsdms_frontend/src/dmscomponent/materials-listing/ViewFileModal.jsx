import React, { useEffect, useState, useRef } from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  Typography,
} from "@mui/material";
import ReactPlayer from "react-player"; // For video rendering
import PropTypes from "prop-types";
import { useAuth } from "hooks/use-auth";
import axios from "axios";

const ViewFileModal = ({ open, handleClose, material }) => {
  const [pdfBlob, setPdfBlob] = useState(null);
  const pdfContainerRef = useRef(null);
  const { user } = useAuth();

  // Fetch PDF file
  const fetchPdf = async (url) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Error fetching PDF: ${response.status}`);
      const blob = await response.blob();
      setPdfBlob(blob);
    } catch (error) {
      console.error("Error fetching PDF:", error);
    }
  };

  // Fetch PDF when modal opens
  useEffect(() => {
    if (open && material.material_type === "pdf") {
      fetchPdf(material.material_file_url);
    }
  }, [material, open]);

  // Render PDF preview
  useEffect(() => {
    if (pdfBlob && pdfContainerRef.current) {
      const fileReader = new FileReader();
      fileReader.onloadend = () => {
        const embed = document.createElement("embed");
        embed.src = fileReader.result;
        embed.type = "application/pdf";
        embed.width = "100%";
        embed.height = "500px";
        pdfContainerRef.current.innerHTML = "";
        pdfContainerRef.current.appendChild(embed);
      };
      fileReader.readAsDataURL(pdfBlob);
    }
  }, [pdfBlob]);

  // Render content based on material type
  const renderContent = () => {
    if (material.material_type === "pdf") {
      return (
        <div ref={pdfContainerRef}>
          <Typography>Loading PDF...</Typography>
        </div>
      );
    } else if (material.material_type === "video") {
      return <ReactPlayer url={material.material_file_url} controls width="100%" height="500px" />;
    } else if (material.material_type === "audio") {
      return (
        <audio controls width="100%">
          <source src={material.material_file_url} type="audio/mp3" />
          Your browser does not support the audio element.
        </audio>
      );
    } else {
      return <Typography>Unsupported file type</Typography>;
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginLeft: "10px",
          marginRight: "30px",
        }}
      >
        <DialogTitle>File Name: {material?.material_title}</DialogTitle>
      </div>
      <DialogContent>{renderContent()}</DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

ViewFileModal.propTypes = {
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
  material: PropTypes.shape({
    material_type: PropTypes.string.isRequired,
    material_file_url: PropTypes.string.isRequired,
    material_title: PropTypes.string.isRequired,
    minimum_reading_time: PropTypes.number.isRequired,
    // material.id: PropTypes.number
  }).isRequired,
};

export default ViewFileModal;
