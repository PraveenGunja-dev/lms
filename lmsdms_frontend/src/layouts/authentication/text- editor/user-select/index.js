import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogActions,
  DialogContent,
  FormControl,
  InputLabel,
  OutlinedInput,
  Select,
  MenuItem,
} from "@mui/material";
import { toast } from "react-toastify"; // Import toast notification
import MDTypography from "components/MDTypography";
import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import { useReviewerUsersQuery, useApproverUsersQuery, useDocAdminUsersQuery } from "api/auth/userApi";

const SelectUserDialog = ({ open, onClose, onConfirm }) => {
  const [approver, setApprover] = useState("");
  const [reviewer, setReviewer] = useState([]); // Multiple selection
  const [docAdmin, setDocAdmin] = useState("");
  const [error, setError] = useState("");

  const { data: approverData, isLoading: isLoadingApprover } = useApproverUsersQuery();
  const { data: reviewerData, isLoading: isLoadingReviewer } = useReviewerUsersQuery();
  const { data: docAdminData, isLoading: isLoadingDocAdmin } = useDocAdminUsersQuery();

  useEffect(() => {
    if (open) {
      setApprover("");
      setReviewer([]);
      setDocAdmin("");
      setError("");
    }
  }, [open]);

  const handleConfirm = () => {
    if (!approver || reviewer.length < 2 || !docAdmin) {
      setError("All fields are required");
      if (reviewer.length < 2) {
        toast.error("Select at least 2 reviewers!");
      }
      return;
    }

    setError("");
    onConfirm({ approver, reviewer, docAdmin });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <MDBox sx={{ textAlign: "center" }}>
        <MDTypography variant="h4" fontWeight="medium" color="#344767" mt={1}>
          Select Users
        </MDTypography>
      </MDBox>

      <form onSubmit={(e) => e.preventDefault()}>
        <DialogContent>
          {/* Reviewer Dropdown (Multiple Selection) */}
          <MDBox mb={3}>
            <FormControl fullWidth margin="dense" variant="outlined">
              <InputLabel id="select-reviewer-label">Select Reviewer (Min: 2)</InputLabel>
              <Select
                labelId="select-reviewer-label  (Min: 2)"
                id="select-reviewer  (Min: 2)"
                multiple
                value={reviewer}
                onChange={(e) => setReviewer(e.target.value)}
                input={<OutlinedInput label="Select Reviewer  (Min: 2)" />}
                sx={{
                  minWidth: 200,
                  height: "3rem",
                  ".MuiSelect-select": { padding: "0.45rem" },
                }}
                renderValue={(selected) =>
                  selected
                    .map((userId) => {
                      const user = reviewerData?.data.find((u) => u.id === userId);
                      return user?.name || userId;
                    })
                    .join(", ")
                }
              >
                {isLoadingReviewer ? (
                  <MenuItem disabled>Loading...</MenuItem>
                ) : reviewerData?.data.length > 0 ? (
                  reviewerData.data.map((user) => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.name}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled>No reviewers available</MenuItem>
                )}
              </Select>
            </FormControl>
          </MDBox>

          {/* Approver Dropdown */}
          <MDBox mb={3}>
            <FormControl fullWidth margin="dense" variant="outlined">
              <InputLabel id="select-approver-label">Select Approver</InputLabel>
              <Select
                labelId="select-approver-label"
                id="select-approver"
                value={approver}
                onChange={(e) => setApprover(e.target.value)}
                input={<OutlinedInput label="Select Approver" />}
                sx={{
                  minWidth: 200,
                  height: "3rem",
                  ".MuiSelect-select": { padding: "0.45rem" },
                }}
              >
                {isLoadingApprover ? (
                  <MenuItem disabled>Loading...</MenuItem>
                ) : approverData?.data.length > 0 ? (
                  approverData.data.map((user) => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.name}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled>No approvers available</MenuItem>
                )}
              </Select>
            </FormControl>
          </MDBox>

          {/* Doc Admin Dropdown */}
          <MDBox mb={3}>
            <FormControl fullWidth margin="dense" variant="outlined">
              <InputLabel id="select-doc-admin-label">Select Doc Admin</InputLabel>
              <Select
                labelId="select-doc-admin-label"
                id="select-doc-admin"
                value={docAdmin}
                onChange={(e) => setDocAdmin(e.target.value)}
                input={<OutlinedInput label="Select Doc Admin" />}
                sx={{
                  minWidth: 200,
                  height: "3rem",
                  ".MuiSelect-select": { padding: "0.45rem" },
                }}
              >
                {isLoadingDocAdmin ? (
                  <MenuItem disabled>Loading...</MenuItem>
                ) : docAdminData?.data.length > 0 ? (
                  docAdminData.data.map((user) => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.name}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled>No document admins available</MenuItem>
                )}
              </Select>
            </FormControl>
          </MDBox>

          {/* Error Message */}
          {error && (
            <MDTypography variant="caption" color="error">
              {error}
            </MDTypography>
          )}
        </DialogContent>

        <DialogActions>
          <MDButton
            onClick={() => {
              setApprover("");
              setReviewer([]);
              setDocAdmin("");
              setError("");
              onClose();
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
              disabled={reviewer.length < 2} // Disable button if fewer than 2 reviewers are selected
            >
              Confirm Selection
            </MDButton>
          </MDBox>
        </DialogActions>
      </form>
    </Dialog>
  );
};

SelectUserDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
};

export default SelectUserDialog;
