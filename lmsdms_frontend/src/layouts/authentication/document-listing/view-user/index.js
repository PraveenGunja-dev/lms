import React, { useState, useEffect } from "react";
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
  IconButton,
  CircularProgress,
  Grid,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import MDTypography from "components/MDTypography";
import MDBox from "components/MDBox";
import MDButton from "components/MDButton";

import { useSelectedUserGetQuery } from "api/auth/documentApi";
import {
  useReviewerUsersQuery,
  useUpdateDocumentReviewersMutation,
} from "api/auth/userApi";

import { useAuth } from "hooks/use-auth";

const ViewSelectionDialog = ({ open, onClose, documentId }) => {
  const { user } = useAuth();
  const isAdmin = user?.user_permissions?.group?.id === 5;

  const { data, isLoading } = useSelectedUserGetQuery(
    { documentId },
    { skip: !documentId }
  );

  const {
    data: reviewerOptions,
    isLoading: isLoadingReviewer,
  } = useReviewerUsersQuery();

  const [updateDocumentReviewers, { isLoading: isUpdating }] =
    useUpdateDocumentReviewersMutation();

  const [editReviewer, setEditReviewer] = useState(false);
  const [selectedReviewerIds, setSelectedReviewerIds] = useState([]);
  const [initialReviewerNames, setInitialReviewerNames] = useState([]);

  // When data changes, extract reviewer names from API and map to IDs
  useEffect(() => {
    if (data?.data?.reviewer) {
      setInitialReviewerNames(data.data.reviewer);

      if (reviewerOptions?.data) {
        const matchedIds = reviewerOptions.data
          .filter((opt) => data.data.reviewer.includes(opt.name))
          .map((opt) => opt.id);
        setSelectedReviewerIds(matchedIds);
      }
    }
  }, [data, reviewerOptions]);

  const handleReviewerUpdate = async () => {
    try {
      await updateDocumentReviewers({
        document_id: documentId,
        reviewer_ids: selectedReviewerIds, 
      }).unwrap();
      setEditReviewer(false);
    } catch (err) {
      console.error("Error updating reviewers:", err);
    }
  };

  if (isLoading || !data?.data) return <div>Loading...</div>;

  const { approver, doc_admin: docAdmin } = data.data;

 const renderSelectedReviewers = () => {
  if (!editReviewer) {
    return (
      <FormControl fullWidth margin="dense" variant="outlined" disabled>
        <InputLabel id="view-reviewer-label">Reviewer</InputLabel>
        <Select
          labelId="view-reviewer-label"
          value={initialReviewerNames}
          multiple
          input={<OutlinedInput label="Reviewer" />}
          renderValue={() => initialReviewerNames.join(", ")}
          sx={{ height: "3rem", ".MuiSelect-select": { padding: "0.45rem" } }}
        >
          {initialReviewerNames.map((name, index) => (
            <MenuItem key={index} value={name}>
              {name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    );
  }

  // If edit mode is on, show editable multi-select
  return (
    <FormControl fullWidth margin="dense" variant="outlined">
      <InputLabel id="view-reviewer-label">Reviewer</InputLabel>
      <Select
        labelId="view-reviewer-label"
        multiple
        value={selectedReviewerIds}
        onChange={(e) => setSelectedReviewerIds(e.target.value)}
        input={<OutlinedInput label="Reviewer" />}
        renderValue={(selected) =>
          reviewerOptions?.data
            ?.filter((opt) => selected.includes(opt.id))
            .map((opt) => opt.name)
            .join(", ")
        }
        sx={{ height: "3rem", ".MuiSelect-select": { padding: "0.45rem" } }}
      >
        {isLoadingReviewer ? (
          <MenuItem disabled>
            <CircularProgress size={20} />
          </MenuItem>
        ) : (
          reviewerOptions?.data?.map((reviewer) => (
            <MenuItem key={reviewer.id} value={reviewer.id}>
              {reviewer.name}
            </MenuItem>
          ))
        )}
      </Select>
    </FormControl>
  );
};

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <MDBox sx={{ textAlign: "center", paddingTop: 2 }}>
        <MDTypography variant="h4" fontWeight="medium" color="#344767" mt={1}>
          Selected Users
        </MDTypography>
      </MDBox>

      <DialogContent>
        {/* Reviewer Section */}
        <MDBox mb={3}>
          <Grid container alignItems="center" spacing={1}>
            <Grid item xs={11}>{renderSelectedReviewers()}</Grid>

            {isAdmin && (
              <Grid item xs={1} sx={{ display: "flex", flexDirection: "column" }}>
                {!editReviewer ? (
                  <IconButton onClick={() => setEditReviewer(true)} title="Edit Reviewer">
                    <EditIcon fontSize="small" />
                  </IconButton>
                ) : (
                  <IconButton
                    onClick={handleReviewerUpdate}
                    title="Save Reviewer"
                    disabled={isUpdating}
                  >
                    <SaveIcon fontSize="small" />
                  </IconButton>
                )}
              </Grid>
            )}
          </Grid>
        </MDBox>

        {/* Approver */}
        <MDBox mb={3}>
          <FormControl fullWidth margin="dense" variant="outlined" disabled>
            <InputLabel id="view-approver-label">Approver</InputLabel>
            <Select
              labelId="view-approver-label"
              id="view-approver"
              value={approver || ""}
              input={<OutlinedInput label="Approver" />}
              sx={{ height: "3rem", ".MuiSelect-select": { padding: "0.45rem" } }}
            >
              <MenuItem value={approver}>{approver}</MenuItem>
            </Select>
          </FormControl>
        </MDBox>

        {/* Doc Admin */}
        <MDBox mb={3}>
          <FormControl fullWidth margin="dense" variant="outlined" disabled>
            <InputLabel id="view-doc-admin-label">Doc Admin</InputLabel>
            <Select
              labelId="view-doc-admin-label"
              id="view-doc-admin"
              value={docAdmin || ""}
              input={<OutlinedInput label="Doc Admin" />}
              sx={{ height: "3rem", ".MuiSelect-select": { padding: "0.45rem" } }}
            >
              <MenuItem value={docAdmin}>{docAdmin}</MenuItem>
            </Select>
          </FormControl>
        </MDBox>
      </DialogContent>

      <DialogActions>
        <MDButton onClick={onClose} color="error" sx={{ marginRight: "10px" }}>
          Close
        </MDButton>
      </DialogActions>
    </Dialog>
  );
};

ViewSelectionDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  documentId: PropTypes.number.isRequired,
};

export default ViewSelectionDialog;
  