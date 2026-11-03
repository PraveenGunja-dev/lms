import React, { useState } from "react";
import PropTypes from "prop-types"; 
import { Dialog, DialogActions, DialogContent, TextField } from "@mui/material";
import MDButton from "components/MDButton";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import { useReviseRequestMutation } from "api/auth/reviseApi"; // Import the API hook
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; // Import toast styles

const ReviseDialog = ({ open, onClose, documentId }) => {
  const [reason, setReason] = useState("");
  const [reviseRequest, { isLoading }] = useReviseRequestMutation();

  const handleConfirm = async () => {
    try {
      await reviseRequest({ document_id: documentId, revise_description: reason }).unwrap();
      
      toast.success("Revision request submitted successfully!");
      handleClose();
    } catch (err) {
      toast.error("Error submitting revision request!");
      console.error("Error submitting revision:", err);
    }
  };

  const handleClose = () => {
    setReason(""); // Clear the reason when closing
    onClose(); // Call the original onClose function
  };

  return (
    <>
     
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <MDBox sx={{ textAlign: "center" }}>
          <MDTypography variant="h4" fontWeight="medium" color="#344767" mt={1}>
            Reason For Revise
          </MDTypography>
        </MDBox>

        <form onSubmit={(e) => e.preventDefault()}>
          <DialogContent>
            <MDBox sx={{ marginTop: 2, textAlign: "center" }}>
              <TextField
                fullWidth
                label="Reason"
                variant="outlined"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                multiline
                rows={3}
                required
              />
            </MDBox>
          </DialogContent>

          <DialogActions>
            <MDButton onClick={handleClose} color="error" sx={{ marginRight: "10px" }}>
              Cancel
            </MDButton>
            <MDBox>
              <MDButton
                variant="gradient"
                color="submit"
                fullWidth
                onClick={handleConfirm}
                disabled={isLoading || !reason.trim()}
              >
                {isLoading ? "Submitting..." : "Submit"}
              </MDButton>
            </MDBox>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
};

ReviseDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  documentId: PropTypes.string.isRequired,
};

export default ReviseDialog;
