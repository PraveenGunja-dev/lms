import React, { forwardRef, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  TextField,
  Typography,
  MenuItem,
  Button,
  Snackbar,
  Alert,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";


const AddSectionModal = forwardRef((props, ref) => {
  const { open, handleClose, sectionNameRef, descriptionRef, status, setStatus, handleSubmit } = props;

  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate=useNavigate();
  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  const handleFormSubmit = (event) => {
    event.preventDefault();
    let hasError = false;
    let errorMessage = "";

    if (!sectionNameRef.current.value) {
      hasError = true;
      errorMessage = "Section Name is required";
    }

    if (!descriptionRef.current.value) {
      hasError = true;
      errorMessage = "Description is required";
    }

    if (!status) {
      hasError = true;
      errorMessage = "Status is required";
    }

    if (hasError) {
      setOpenSnackbar(true);
      setErrorMessage(errorMessage);
      return;
    }

    handleSubmit();
    // window.location.reload()
    navigate(0)
  };

  return (
    <div>
      <Dialog
        onClose={handleClose}
        open={open}
        aria-labelledby="add-section-dialog-title"
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle id="add-section-dialog-title" sx={{ m: 0, p: 2 }}>
          Add Section
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
            {/* Section Name */}
            <TextField
              inputRef={sectionNameRef}
              type="text"
              label="Section Name"
              fullWidth
              margin="normal"
              sx={{ mt: "2px" }}
            />

            {/* Description */}
            <TextField
              inputRef={descriptionRef}
              type="text"
              label="Description"
              fullWidth
              margin="normal"
              multiline
              rows={3}
              sx={{ mt: "2px" }}
            />

            {/* Status */}
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
              variant="custom"
              sx={{
                color: "white !important",
                background: "#31AC47",
                padding: "12px",
                "&:hover": {
                  backgroundColor: "#1ebf39",
                },
              }}
              type="submit"
              fullWidth
            >
              Submit
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
});

AddSectionModal.propTypes = {
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
  sectionNameRef: PropTypes.object.isRequired,
  descriptionRef: PropTypes.object.isRequired,
  status: PropTypes.string.isRequired,
  setStatus: PropTypes.func.isRequired,
  handleSubmit: PropTypes.func.isRequired,
};

export default AddSectionModal;
