import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Dialog, DialogTitle, DialogContent, IconButton, TextField, Button, Snackbar, Alert, Typography, MenuItem } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import apiService from "services/apiService";
import { useNavigate } from "react-router-dom";
import MDButton from "components/MDButton";

const EditMaterialModal = ({ open, handleClose, materialData, handleSubmit }) => {
  const [material, setMaterial] = useState({
    material_title: "",
    material_type: "",
    minimum_reading_time: "",
    material_file: null,
  });

  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();
  useEffect(() => {
    if (materialData) {
      setMaterial({
        material_title: materialData.material_title || "",
        material_type: materialData.material_type || "",
        minimum_reading_time: materialData.minimum_reading_time || "",
        material_file: null, // Reset file input
      });
    }
  }, [materialData]);
  console.log("Material data:",materialData)
  const handleChange = (e) => {
    const { name, value } = e.target;
    setMaterial((prevMaterial) => ({
      ...prevMaterial,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setMaterial((prevMaterial) => ({
      ...prevMaterial,
      material_file: file,
    }));
  };

  // const handleFormSubmit = async(e) => {
  //   e.preventDefault();
  //   let hasError = false;
  //   let errorMessage = "";

  //   if (!material.material_title) {
  //     hasError = true;
  //     errorMessage = "Material Title is required";
  //   }
  //   if (!material.material_type) {
  //     hasError = true;
  //     errorMessage = "Material Type is required";
  //   }
  //   if (!material.minimum_reading_time) {
  //     hasError = true;
  //     errorMessage = "Reading time is required";
  //   }
  //   if (!material.material_file) {
  //     hasError = true;
  //     errorMessage = "File upload is required";
  //   }

  //   if (hasError) {
  //     setOpenSnackbar(true);
  //     setErrorMessage(errorMessage);
  //     return;
  //   }

  //   // Handle form submission with the file
  //   const formData = new FormData();
  //   formData.append("material_title", material.material_title);
  //   formData.append("material_type", material.material_type);
  //   formData.append("minimum_reading_time", material.minimum_reading_time);
  //   formData.append("material_file", material.material_file);
  //   // console.log(formData.material_title);
  //   // for (const [key, value] of formData.entries()) {
  //   //   console.log(`${key}:`, value);
  //   // }
  //   try{
  //       const response = await apiService.put(`/lms_module/update_training_material/${12}`,formData,{
  //         headers: {
  //           'Content-Type': 'multipart/form-data', // Set proper content type
  //         },
  //       });
  //       if (response?.data?.status) {
  //           console.log("Matrial updated successfully!")
  //       }
  //       setMaterial({
  //         material_title: "",
  //         material_type: "",
  //         minimum_reading_time: "",
  //         material_file: null,
  //       });
  //       handleClose();
  //       // console.log()
  //   }catch(error){
  //       console.error("Failed to update material:", response?.data?.message);
  //       setOpenSnackbar(true);
  //       setErrorMessage(response?.data?.message || "Failed to update material.");
  //   }
  // };

  const handleFormSubmit = async (e) => {
  e.preventDefault();

  // Validate inputs
  let hasError = false;
  let errorMessage = "";

  if (!material.material_title) {
    hasError = true;
    errorMessage = "Material Title is required";
  }
  if (!material.material_type) {
    hasError = true;
    errorMessage = "Material Type is required";
  }
  if (!material.minimum_reading_time) {
    hasError = true;
    errorMessage = "Reading time is required";
  }
  if (!material.material_file) {
    hasError = true;
    errorMessage = "File upload is required";
  }

  if (hasError) {
    setOpenSnackbar(true);
    setErrorMessage(errorMessage);
    return;
  }

  // Prepare FormData for submission
  const formData = new FormData();
  formData.append("material_title", material.material_title);
  formData.append("material_type", material.material_type);
  formData.append("minimum_reading_time", material.minimum_reading_time);
  formData.append("material_file", material.material_file);

  try {
    const response = await apiService.put(
      `/lms_module/update_training_material/${materialData.id}`, // Replace 12 with a dynamic material ID if available
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data", // Proper header for file upload
        },
      }
    );

    if (response?.data?.status) {
      setMaterial({
        material_title: "",
        material_type: "",
        minimum_reading_time: "",
        material_file: null,
      });
      handleClose();
      navigate(0)
    } else {
      console.error("Failed to update material:", response?.data?.message);
      setOpenSnackbar(true);
      setErrorMessage(response?.data?.message || "Failed to update material.");
    }
  } catch (error) {
    // Handle submission errors
    console.error("Error updating material:", error);
    setOpenSnackbar(true);
    setErrorMessage("An error occurred while updating the material. Please try again.");
  }
};

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  return (
    <div>
      <Dialog
        onClose={handleClose}
        open={open}
        aria-labelledby="edit-material-dialog-title"
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle id="edit-material-dialog-title" sx={{ m: 0, p: 2 }}>
          Edit Material
          <IconButton
            aria-label="close"
            onClick={handleClose}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <form onSubmit={handleFormSubmit}>
            {/* Material Title */}
            <TextField
              label="Material Title"
              name="material_title"
              value={material.material_title}
              onChange={handleChange}
              fullWidth
              margin="normal"
              required
            />
            {/* Material Type */}
            <TextField
              select
              label="Material Type"
              name="material_type"
              value={material.material_type}
              onChange={handleChange}
              fullWidth
              margin="normal"
              InputProps={{
                sx: {
                  height: 50,
                  fontSize: "1rem",
                  padding:'20px'
                },
              }}
              SelectProps={{
                sx: {
                  padding: "10px",
                },
              }}
              required
            >
              <MenuItem value="pdf">PDF</MenuItem>
              <MenuItem value="video">Video</MenuItem>
            </TextField>
            {/* Minimum Reading Time */}
            <TextField
              label="Minimum Reading Time"
              name="minimum_reading_time"
              value={material.minimum_reading_time}
              onChange={handleChange}
              type="number"
              fullWidth
              margin="normal"
              required
              InputProps={{ inputProps: { min: 1 } }}
              sx={{
                height:50
              }}
            />

            {/* File Upload */}
            <input
              type="file"
              accept=".pdf,.mp4"
              onChange={handleFileChange}
              style={{ display: "block", marginTop: "16px", marginBottom: "16px" }}
              required
            />

            <MDButton
              type="submit"
              fullWidth
              variant="gradient"
              color="submit"
              sx={{
                marginTop: 2,
                backgroundColor: "#31AC47",
                "&:hover": {
                  backgroundColor: "#1ebf39",
                },
              }}
            >
              Save Changes
            </MDButton>
          </form>
        </DialogContent>
      </Dialog>

      <Snackbar open={openSnackbar} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert severity="error" onClose={handleCloseSnackbar}>
          {errorMessage}
        </Alert>
      </Snackbar>
    </div>
  );
};

EditMaterialModal.propTypes = {
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
  materialData: PropTypes.object.isRequired,
  handleSubmit: PropTypes.func.isRequired,
};

export default EditMaterialModal;
