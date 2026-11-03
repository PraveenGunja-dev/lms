import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  TextField,
  Button,
  Snackbar,
  Alert,
  MenuItem,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PropTypes from "prop-types";
// import { updateTrainingSection } from "./apiService";
import apiService from "services/apiService";
import { useNavigate } from "react-router-dom";

const EditSectionModal = ({ open, handleClose, sectionData, handleSubmit }) => {
  const [sectionName, setSectionName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState(true);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  // console.log(sectionData.id);
  const navigate=useNavigate();
  useEffect(() => {
    if (sectionData) {
      setSectionName(sectionData.section_name || "");
      setDescription(sectionData.section_description || "");
      setStatus(sectionData.status || "Active");
    }
  }, [sectionData]);

  const handleCloseSnackbar = () => setOpenSnackbar(false);

  const handleFormSubmit = async(event) => {
    event.preventDefault();

    if (!sectionName || !description || !status) {
      setErrorMessage("All fields are required");
      setOpenSnackbar(true);
      return;
    }
    // console.log("Update Section",sectionName,description,status)
    const updateData = {
      section_name: sectionName,
      section_description: description,
      training_section_active_status: status === "true",  // Convert to boolean
    };
    try{
      // const response = await updateTrainingSection(sectionData.id, updateData);
      const url = `/lms_module/update_training_section/${sectionData?.id}`;
        // const response = await apiService.post('/lms_module/update_training_section/${trainingSectionId}/', formData)
      const response = await apiService.put(url, updateData);
        // console.log(response)
      if (response?.data?.status === true) {
        console.log(response?.data)
        handleClose();
          // window.location.reload();
          navigate(0)
              } else {
        // If the update fails, show the error message  
        setErrorMessage(response.message || "Something went wrong");
        setOpenSnackbar(true);
      }
    }catch(error){
      setErrorMessage("An error occurred while updating the section");
      setOpenSnackbar(true);
    }
    // handleSubmit({ ...sectionData, section_name: sectionName, section_description: description, status });
  };

  return (
    <div>
      <Dialog
        onClose={handleClose}
        open={open}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          Edit Section
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
        <DialogContent>
          <form onSubmit={handleFormSubmit}>
            <TextField
              value={sectionName}
              onChange={(e) => setSectionName(e.target.value)}
              label="Section Name"
              fullWidth
              margin="normal"
            />
            <TextField
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              label="Description"
              fullWidth
              margin="normal"
              multiline
              rows={3}
            />
            {/* <TextField
              select
              label="Status"
              fullWidth
              margin="normal"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </TextField> */}
            <TextField
              select
              label="Status"
              fullWidth
              margin="normal"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              InputProps={{
                sx: {
                  height: 50, // Adjust height
                  fontSize: "1rem", // Adjust font size for better readability
                },
              }}
              SelectProps={{
                sx: {
                  padding: "10px", // Adjust padding inside the select
                },
              }}
            >
              <MenuItem value="true">Active</MenuItem>
              <MenuItem value="false">Inactive</MenuItem>
            </TextField>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              sx={{ marginTop: 2 }}
            >
              Save Changes
            </Button>
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

EditSectionModal.propTypes = {
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
  sectionData: PropTypes.object,
  handleSubmit: PropTypes.func.isRequired,
};

export default EditSectionModal;
