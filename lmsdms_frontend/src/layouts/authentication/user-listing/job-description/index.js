import React, { useEffect } from "react";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  IconButton,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import MDButton from "components/MDButton";
import { useJobDescriptionListQuery } from "api/auth/userApi";

const JobDescriptionListDialog = ({ open, onClose, userId }) => {
  const { data, isLoading, isError, refetch } = useJobDescriptionListQuery(userId, {
    skip: !userId,
  });

  useEffect(() => {
    if (userId && open) refetch();
  }, [userId, open, refetch]);

  const jobDescriptions = data?.data ?? []; // Safe default

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>
        Job Descriptions
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: "absolute", right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {isLoading ? (
          <CircularProgress />
        ) : isError ? (
          <Typography color="error">Failed to load job descriptions.</Typography>
        ) : jobDescriptions.length === 0 ? (
          <Typography>No job descriptions found.</Typography>
        ) : (
          jobDescriptions.map((jd, index) => (
            <div key={index} style={{ marginBottom: "1rem" }}>
              <Typography variant="subtitle1" fontWeight="bold">
                • {jd.job_role || "Untitled"}
              </Typography>
              <Typography variant="body2">{jd.employee_job_description}</Typography>
              <Typography variant="caption" color="textSecondary">
                Status: {jd.status}
              </Typography>
              <hr />
            </div>
          ))
        )}
      </DialogContent>
      <DialogActions>
        <MDButton onClick={onClose} variant="contained" color="secondary">
          Close
        </MDButton>
      </DialogActions>
    </Dialog>
  );
};

JobDescriptionListDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  userId: PropTypes.number,
};

export default JobDescriptionListDialog;
