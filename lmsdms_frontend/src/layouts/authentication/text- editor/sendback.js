import React, { useEffect } from "react";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogActions,
  DialogContent,
  FormControl,
  TextField,
} from "@mui/material";
import MDButton from "components/MDButton";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import { useGetApprovedStatusUsersQuery } from "api/auth/texteditorApi";

const handleClear = (setAssignedTo, setRemarks) => {
  setAssignedTo("");
  setRemarks(""); // Clear remarks as well
};

const SendBackDialog = ({
  open,
  onClose,
  onConfirm,
  assignedTo,
  setAssignedTo,
  remarks,
  setRemarks,
  documentId,
}) => {
  // Fetch approved status users using RTK Query
  const { data: users, isLoading, error } = useGetApprovedStatusUsersQuery(documentId);
  console.log(users);

  // Automatically set assignedTo to the first user's id when data is loaded
  useEffect(() => {
    if (!isLoading && !error && Array.isArray(users) && users.length > 0) {
      // Only update if assignedTo isn't already set or doesn't match the current user's id
      if (assignedTo !== users[0].id) {
        setAssignedTo(users[0].id);
      }
    }
  }, [users, isLoading, error, assignedTo, setAssignedTo]);

  // Determine the display value for the disabled text field:
  let assignedUserName = "";
  if (isLoading) {
    assignedUserName = "Loading user...";
  } else if (error) {
    assignedUserName = "Error loading user";
  } else if (Array.isArray(users) && users.length > 0) {
    assignedUserName = users[0].first_name;
  }
 
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <MDBox sx={{ textAlign: "center" }}>
        <MDTypography variant="h4" fontWeight="medium" color="#344767" mt={1}>
          Send Back
        </MDTypography>
      </MDBox>

      <form onSubmit={(e) => e.preventDefault()}>
        <DialogContent>
          {/* Display the assigned user's name in a disabled text field */}
          <FormControl fullWidth margin="dense">
            <TextField
              label="Assigned To"
              variant="outlined"
              disabled
              value={assignedUserName}
            />
          </FormControl>

          {/* Remarks Field */}
          <TextField
            fullWidth
            margin="dense"
            label="Remarks"
            variant="outlined"
            multiline
            rows={3}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />
        </DialogContent>

        <DialogActions>
          <MDButton onClick={onClose} color="error" sx={{ marginRight: "10px" }}>
            Cancel
          </MDButton>
          <MDBox>
            <MDButton variant="gradient" color="submit" fullWidth onClick={onConfirm}>
              Confirm
            </MDButton>
          </MDBox>
        </DialogActions>
      </form>
    </Dialog>
  );
};

SendBackDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  assignedTo: PropTypes.any,
  setAssignedTo: PropTypes.func.isRequired,
  remarks: PropTypes.string,
  setRemarks: PropTypes.func.isRequired,
  documentId: PropTypes.string.isRequired,
};

export default SendBackDialog;
