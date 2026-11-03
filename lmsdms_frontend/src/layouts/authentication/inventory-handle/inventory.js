import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useCreateInventoryMutation } from "api/auth/inventoryApi"; 
import { Dialog, DialogActions, DialogContent, FormControl, TextField } from "@mui/material";
import MDButton from "components/MDButton";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";  

function AddinventoryDialog({ open, handleClose }) {
  const [inventory_name, setInventoryName] = useState("");
  const [hasNotified, setHasNotified] = useState(false); 
  const [createinventory, { isLoading, isSuccess, isError, error }] = useCreateInventoryMutation();
  useEffect(() => {
    if (isSuccess && !hasNotified) {
      toast.success("Inventory added successfully!"); 
      setHasNotified(true); 
      handleClose();
      setInventoryName(""); 
    }
  }, [isSuccess, hasNotified, handleClose]);

  useEffect(() => {
    if (isError && !hasNotified) {
      toast.error(error?.data?.message || "Failed to create inventory. Please try again."); 
      setHasNotified(true); 
    }
  }, [isError, error, hasNotified]);

  const handleInventoryChange = (event) => {
    setInventoryName(event.target.value);
  };

  const handleSubmit = async () => {
    if (inventory_name) {
      try {
        // Send the inventory name with the expected key
        await createinventory({ inventory_name }).unwrap(); 
        setHasNotified(false); // Reset the notification flag when a new request is initiated
      } catch (err) {
        console.error("Failed to create inventory:", err);
      }
    }
  };

  const handleClear = () => {
    setInventoryName("");
  };

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <MDBox sx={{ textAlign: "center" }}>
          <MDTypography variant="h4" fontWeight="medium" color="#344767" mt={1}>
            Add Inventory
          </MDTypography>
        </MDBox>

        <form onSubmit={(e) => e.preventDefault()}>
          <DialogContent>
            {isError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error?.data?.message || "Failed to create inventory. Please try again."}
              </Alert>
            )}

            <MDBox display="flex" justifyContent="flex-end">
              <MDButton
                variant="outlined"
                color="error"
                size="small"
                onClick={handleClear}
                sx={{ marginRight: "20px" }}
              >
                Clear
              </MDButton>
            </MDBox>

            <FormControl fullWidth margin="normal">
              <TextField
                label="Inventory"
                variant="outlined"
                value={inventory_name}
                onChange={handleInventoryChange}
                // helperText="Enter the inventory name"
                fullWidth
              />
            </FormControl>
          </DialogContent>

          <DialogActions>
            <MDButton onClick={handleClose} color="error" sx={{ marginRight: "10px" }}>
              Cancel
            </MDButton>
            <MDBox>
              <MDButton variant="gradient" color="submit" fullWidth onClick={handleSubmit} disabled={isLoading}>
                {isLoading ? <CircularProgress size={24} /> : "Submit"}
              </MDButton>
            </MDBox>
          </DialogActions>
        </form>
      </Dialog>

      {/* <ToastContainer position="top-right" autoClose={3000} /> */}
    </>
  );
}

AddinventoryDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
};

export default AddinventoryDialog;
