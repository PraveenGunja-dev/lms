import React from "react";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogActions,
  DialogContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
} from "@mui/material";
import MDTypography from "components/MDTypography";
import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import { useSelectedUserGetQuery } from "api/auth/documentApi"; // Update with the correct path

const ViewUserDialog = ({ open, onClose, documentId, onConfirm }) => {
  const { data, isLoading } = useSelectedUserGetQuery({ documentId });
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  const { approver, reviewer, doc_admin: docAdmin } = data?.data || {};

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <MDBox sx={{ textAlign: "center" }}>
        <MDTypography variant="h4" fontWeight="medium" color="#344767" mt={1}>
          Selected Users
        </MDTypography>
      </MDBox>

      <DialogContent>
        {/* Reviewer Display */}
        <MDBox mb={3}> 
          <FormControl fullWidth margin="dense" variant="outlined" disabled>
            <InputLabel id="view-reviewer-label">Reviewer</InputLabel>
            <Select
              labelId="view-reviewer-label"
              id="view-reviewer"
              multiple
              value={reviewer || []}
              input={<OutlinedInput label="Reviewer" />}
              sx={{
                minWidth: 200,
                height: "3rem",
                ".MuiSelect-select": { padding: "0.45rem" },
              }}
              renderValue={(selected) => selected.join(", ")}
              disabled
            >
              {reviewer?.length > 0 ? (
                reviewer.map((reviewerName, index) => (
                  <MenuItem key={index} value={reviewerName}>
                    {reviewerName}
                  </MenuItem>
                ))
              ) : (
                <MenuItem disabled>No reviewers selected</MenuItem>
              )}
            </Select>
          </FormControl>
        </MDBox>
       
        {/* Approver Display */}
        <MDBox mb={3}>
          <FormControl fullWidth margin="dense" variant="outlined" disabled>
            <InputLabel id="view-approver-label">Approver</InputLabel>
            <Select
              labelId="view-approver-label"
              id="view-approver"
              value={approver || ""}
              input={<OutlinedInput label="Approver" />}
              sx={{
                minWidth: 200,
                height: "3rem",
                ".MuiSelect-select": { padding: "0.45rem" },
              }}
              disabled
            >
              {approver ? (
                <MenuItem key={approver} value={approver}>
                  {approver}
                </MenuItem>
              ) : (
                <MenuItem disabled>No approver selected</MenuItem>
              )}
            </Select>
          </FormControl>
        </MDBox>

       

        {/* Doc Admin Display */}
        <MDBox mb={3}>
          <FormControl fullWidth margin="dense" variant="outlined" disabled>
            <InputLabel id="view-doc-admin-label">Doc Admin</InputLabel>
            <Select
              labelId="view-doc-admin-label"
              id="view-doc-admin"
              value={docAdmin || ""}
              input={<OutlinedInput label="Doc Admin" />}
              sx={{
                minWidth: 200,
                height: "3rem",
                ".MuiSelect-select": { padding: "0.45rem" },
              }}
              disabled
            >
              {docAdmin ? (
                <MenuItem key={docAdmin} value={docAdmin}>
                  {docAdmin}
                </MenuItem>
              ) : (
                <MenuItem disabled>No doc admin selected</MenuItem>
              )}
            </Select>
          </FormControl>
        </MDBox>
      </DialogContent>

      <DialogActions>
        <MDButton onClick={onClose} variant="gradient" color="error" sx={{ marginRight: "10px" }}>
          Close
        </MDButton>
        <MDButton onClick={onConfirm} variant="gradient" color="submit">
          Confirm
        </MDButton>
      </DialogActions>
    </Dialog>
  );
};

ViewUserDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  documentId: PropTypes.number.isRequired,
  onConfirm: PropTypes.func.isRequired,
};

export default ViewUserDialog;
