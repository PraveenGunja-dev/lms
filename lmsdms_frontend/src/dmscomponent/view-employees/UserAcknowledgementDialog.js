import React, { useState } from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Button,
} from "@mui/material";
import PropTypes from "prop-types"; // Import PropTypes for prop validation
import { useCreateacnowledgementMutation } from "apilms/workflowapi"; // Import the mutation hook
import { toast, ToastContainer } from "react-toastify"; // Import toastify for toast notifications
import MDButton from "components/MDButton";

// Dialog component to handle HR Acknowledgement
const UserAcknowledgementDialog = ({ open, onClose, selectedUserData }) => {
  const [remark, setRemark] = useState(""); // State for storing the remark input
  const [createAcknowledge, { isLoading, error }] = useCreateacnowledgementMutation(); // Mutation hook

  // Handle submit button click
  const handleSubmit = async () => {
    if (remark.trim()) {
      try {
        // Call the mutation with the selected user's ID and the remark
        await createAcknowledge({ id: selectedUserData.id, remarks: remark }).unwrap();

        // Show success toast
        toast.success("Acknowledgement submitted successfully!", {});

        onClose(); // Close the dialog after submission
      } catch (err) {
        console.error("Error submitting acknowledgement", err);

        // Show error toast
        toast.error("Failed to submit acknowledgement. Please try again.", {});
      }
    }
  };

  return (
    <>
    

    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md"> 
        <DialogTitle>{`Acknowledgement - ${selectedUserData?.name}`}</DialogTitle>
        <DialogContent>
          <TextField
            label="Remark"
            fullWidth
            multiline
            rows={9}
            variant="outlined"
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            sx={{ mb: 5 }}
          />
        </DialogContent>
        <DialogActions>
          <MDButton onClick={onClose} color="error">
            Cancel
          </MDButton>
          <MDButton onClick={handleSubmit} variant="gradient" color="submit" disabled={isLoading}>
            {isLoading ? "Submitting..." : "Submit"}
          </MDButton>
        </DialogActions>
        {error && <div style={{ color: "red", padding: "10px" }}>Error: {error.message}</div>}
      </Dialog>
    </>
  );
};

// Prop types validation
UserAcknowledgementDialog.propTypes = {
  open: PropTypes.bool.isRequired, // open should be a boolean
  onClose: PropTypes.func.isRequired, // onClose should be a function
  selectedUserData: PropTypes.shape({
    // selectedUserData should be an object with specific fields
    name: PropTypes.string.isRequired,
    id: PropTypes.number.isRequired, // 'id' field should be a number
  }).isRequired,
};

export default UserAcknowledgementDialog;
