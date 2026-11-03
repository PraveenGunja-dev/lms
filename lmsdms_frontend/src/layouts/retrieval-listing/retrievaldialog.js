import React, { useState } from "react";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogActions,
  DialogContent,
  FormControl,
  MenuItem,
  Select,
  OutlinedInput,
} from "@mui/material";
import MDButton from "components/MDButton";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import { useGetPrintApprovalDetailsQuery, useAddRetrivalNumbersMutation } from "api/auth/retrievalApi"; 
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; // Import toast styles

function PrintRetrievalDialog({ open, handleClose, onRetrieve, selectedId }) {
  const [selectedRetrievals, setSelectedRetrievals] = useState([]);
  const { data, error, isLoading } = useGetPrintApprovalDetailsQuery(selectedId); 
  const [addRetrivalNumbers, { isLoading: isSubmitting, isSuccess, isError, error: submitError }] =
    useAddRetrivalNumbersMutation(); 

  const handleRetrievalChange = (event) => {
    setSelectedRetrievals(event.target.value);
  };

  const handleRetrieve = async () => {
    if (selectedRetrievals.length > 0) {
      try {
        await addRetrivalNumbers({
          print_request_approval_id: selectedId,
          retrival_numbers: selectedRetrievals,
        }).unwrap();
  
        toast.success("Retrieval numbers submitted successfully!");

        onRetrieve(selectedRetrievals);
        setSelectedRetrievals([]); // Clear the dropdown
        handleClose(); // Close the dialog
      } catch (err) {
        toast.error("Error submitting retrieval numbers!");
        console.error("Error while submitting retrieval numbers:", err);
      }
    }
  };

  // Extract approval numbers from the API response
  const retrievalOptions = data ? data.approval_numbers.map((item) => item.number) : [];

  // Reset selectedRetrievals when the dialog is closed
  const handleDialogClose = () => {
    setSelectedRetrievals([]); // Reset the selected retrievals
    handleClose(); // Call the original handleClose function passed in as a prop
  };

  return (
    <>
      <Dialog open={open} onClose={handleDialogClose} maxWidth="sm" fullWidth>
        <MDBox sx={{ textAlign: "center" }}>
          <MDTypography variant="h4" fontWeight="medium" color="#344767" mt={1}>
            Print Retrieval
          </MDTypography>
        </MDBox>

        <form onSubmit={(e) => e.preventDefault()}>
          <DialogContent>
            <FormControl fullWidth margin="normal">
              <Select
                multiple
                value={selectedRetrievals}
                onChange={handleRetrievalChange}
                displayEmpty
                input={<OutlinedInput />}
                renderValue={(selected) => {
                  if (selected.length === 0) {
                    return <em>Select Retrieval Numbers</em>;
                  }
                  return selected.join(", ");
                }}
                variant="outlined"
                sx={{
                  minWidth: 200,
                  height: "3rem",
                  ".MuiSelect-select": {
                    padding: "0.75rem",
                  },
                }}
              >
                <MenuItem disabled value="">
                  <em>Select Retrieval Numbers</em>
                </MenuItem>
                {isLoading ? (
                  <MenuItem disabled>Loading...</MenuItem>
                ) : error ? (
                  <MenuItem disabled>Error loading data</MenuItem>
                ) : (
                  retrievalOptions.map((option, index) => (
                    <MenuItem key={index} value={option}>
                      {option}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
            {isError && (
              <MDTypography color="error" variant="caption">
                {submitError?.data?.message || "Failed to submit retrieval numbers"}
              </MDTypography>
            )}
          </DialogContent>

          <DialogActions>
            <MDButton onClick={handleDialogClose} color="error" sx={{ marginRight: "10px" }}>
              Cancel
            </MDButton>
            <MDBox>
              <MDButton
                variant="gradient"
                color="submit"
                fullWidth
                onClick={handleRetrieve}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit"}
              </MDButton>
            </MDBox>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
}

PrintRetrievalDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
  onRetrieve: PropTypes.func.isRequired,
  selectedId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

export default PrintRetrievalDialog;
