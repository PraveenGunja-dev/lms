import React, { useState } from "react";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogActions,
  DialogContent,
  FormControl,
  OutlinedInput,
  InputLabel,
  IconButton,
  CircularProgress,
} from "@mui/material";
import MDButton from "components/MDButton";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

const RemarkDialog = ({ open, onClose, onConfirm }) => {
  const [remark, setRemark] = useState(""); // State to store the entered remark
  const [error, setError] = useState(""); // State to handle any validation errors

  const handleConfirm = () => {
    if (!remark) {
      setError("Remark is required"); // Validation if remark is empty
      return;
    }

    setError(""); // Clear any previous error
    onConfirm(remark); // Pass the entered remark to the parent component
    onClose(); // Close the dialog after confirmation
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <MDBox sx={{ textAlign: "center" }}>
        <MDTypography variant="h4" fontWeight="medium" color="#344767" mt={1}>
          Add Remark
        </MDTypography>
      </MDBox>

      <form onSubmit={(e) => e.preventDefault()}>
        <DialogContent>
          {/* Remark Field */}
          <FormControl fullWidth margin="dense" variant="outlined">
            <InputLabel htmlFor="remark">Enter Your Remark</InputLabel>
            <OutlinedInput
              id="remark"
              type="text"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              label="Enter Your Remark"
              error={!!error}
            />
          </FormControl>

          {error && (
            <MDTypography variant="caption" color="error">
              {error}
            </MDTypography>
          )}
        </DialogContent>

        <DialogActions>
          <MDButton
            onClick={() => {
              setRemark(""); // Clear remark field
              setError(""); // Clear error messages
              onClose(); // Close the dialog
            }}
            color="error"
            sx={{ marginRight: "10px" }}
          >
            Cancel
          </MDButton>
          <MDBox>
            <MDButton
              variant="gradient"
              color="submit"
              fullWidth
              onClick={handleConfirm}
            >
              Confirm Remark
            </MDButton>
          </MDBox>
        </DialogActions>
      </form>
    </Dialog>
  );
};

RemarkDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
};

export default RemarkDialog;
