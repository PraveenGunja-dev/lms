import React, { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import MDButton from "components/MDButton";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import PropTypes from "prop-types";
import FormControl from "@mui/material/FormControl";
import TextField from "@mui/material/TextField";
import { useUpdateStatusMutation } from 'api/auth/statusApi';

const UpdateStatusDialog = ({ open, handleClose, statusId, statusText }) => {
  const [status, setStatus] = useState(statusText);

  const [updateStatus] = useUpdateStatusMutation();

  useEffect(() => {
    setStatus(statusText);
  }, [statusText]);

  const handleStatusChange = (event) => {
    // Use a regular expression to allow only letters (A-Z, a-z)
    const value = event.target.value;
    if (/^[A-Za-z]*$/.test(value)) { // Allow only alphabetic characters
      setStatus(value);
    }
  };

  const handleUpdate = async () => {
    if (status.trim()) {
      try {
        const response = await updateStatus({ id: statusId, status }).unwrap();
        if (response.status) {
          handleClose();
        } else {
          console.error('Error updating status:', response.message || 'Unknown error');
        }
      } catch (error) {
        console.error('Error updating status:', error);
      }
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <MDBox sx={{ textAlign: "center" }}>
        <MDTypography variant="h4" fontWeight="medium" color="#344767" mt={1}>
          Update Status
        </MDTypography>
      </MDBox>

      <form onSubmit={(e) => e.preventDefault()}>
        <DialogContent>
          <MDBox display="flex" justifyContent="flex-end">
            <MDButton
              variant="outlined"
              color="error"
              size="small"
              onClick={() => setStatus("")}
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
              onChange={handleStatusChange}  // Use the new change handler
              helperText="Enter the updated status name (letters only)"
              fullWidth
            />
          </FormControl>
        </DialogContent>
        <DialogActions>
          <MDButton onClick={handleClose} color="error" sx={{ marginRight: "10px" }}>
            Cancel
          </MDButton>
          <MDBox>
            <MDButton variant="gradient" color="submit" fullWidth onClick={handleUpdate}>
              Update
            </MDButton>
          </MDBox>
        </DialogActions>
      </form>
    </Dialog>
  );
};

// Define PropTypes for the component
UpdateStatusDialog.propTypes = {
  open: PropTypes.bool.isRequired,           
  handleClose: PropTypes.func.isRequired,    
  statusId: PropTypes.string.isRequired,   
  statusText: PropTypes.string.isRequired   
};

export default UpdateStatusDialog;
