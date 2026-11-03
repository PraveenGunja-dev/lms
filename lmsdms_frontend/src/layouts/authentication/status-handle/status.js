import React, { useState } from "react";
import PropTypes from "prop-types";
import { useCreateStatusMutation } from "api/auth/statusApi"; // Assuming the statusApi is placed in services folder
import { Dialog, DialogActions, DialogContent, DialogTitle, FormControl, TextField, Button } from "@mui/material";
import MDButton from "components/MDButton";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";


function AddStatusDialog({ open, handleClose }) {
  const [status, setStatus] = useState("");
  const [createStatus, { isLoading, isSuccess, isError, error }] = useCreateStatusMutation();

  const handleStatusChange = (event) => {
    const value = event.target.value;
    if (/^[A-Za-z\s]*$/.test(value)) {
      setStatus(value); 
    }
  };
  
  const handleSubmit = async () => {
    if (status) {
      try {
        await createStatus(status).unwrap();
        handleClose(); 
      } catch (err) {
        console.error("Failed to create status:", err);
      }
    }
  };

  const handleClear = () => {
    setStatus("");
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
    <MDBox sx={{ textAlign: "center" }}>
      <MDTypography variant="h4" fontWeight="medium" color="#344767" mt={1}>
        Add Status
      </MDTypography>
    </MDBox>

    <form onSubmit={(e) => e.preventDefault()}>
      <DialogContent>
        <MDBox display="flex" justifyContent="flex-end">
          <MDButton
            variant="outlined"
            color="error"
            size="small"
            onClick={handleClear}
            sx={{ marginRight: "20px" }}
          >
            Clear
          </MDButton>
        </MDBox>
        <FormControl fullWidth margin="normal">
          <TextField
            label="Status"
            variant="outlined"
            value={status}
            onChange={handleStatusChange}
            helperText="Enter the status name"
            fullWidth
          />
        </FormControl>
      </DialogContent>
      <DialogActions>
        <MDButton onClick={handleClose} color="error" sx={{ marginRight: "10px" }}>
          Cancel
        </MDButton>
        <MDBox>
          <MDButton variant="gradient" color="submit" fullWidth onClick={handleSubmit}>
            Submit
          </MDButton>
        </MDBox>
      </DialogActions>
    </form>
  </Dialog>
);
}

AddStatusDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
};

export default AddStatusDialog;
