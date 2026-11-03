import React, { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import MDButton from "components/MDButton";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import PropTypes from "prop-types";
import FormControl from "@mui/material/FormControl";
import TextField from "@mui/material/TextField";
import { useUpdateInventoryMutation } from 'api/auth/inventoryApi';

const UpdateinventoryDialog = ({ open, handleClose, inventoryId, inventoryName }) => {
  const [inventory_name, setinventory] = useState("");
  const [updateInventory] = useUpdateInventoryMutation(); // Use the updateInventory hook

  // Set initial value when dialog opens
  useEffect(() => {
    if (open) {
      setinventory(inventoryName);
    }
  }, [open, inventoryName]);

  const handleUpdate = async () => {
    if (inventory_name.trim()) {
      try {
        console.log("Updating inventory:", inventory_name);
        const response = await updateInventory({ id: inventoryId, inventory_name }).unwrap();
        console.log("Update Response:", response); // Debugging response
        if (response.inventory_name) {
          handleClose();
        } else {
          console.error('Error updating inventory:', response.message || 'Unknown error');
        }
      } catch (error) {
        console.error('Error updating inventory:', error);
      }
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <MDBox sx={{ textAlign: "center" }}>
        <MDTypography variant="h4" fontWeight="medium" color="#344767" mt={1}>
          Update Inventory
        </MDTypography>
      </MDBox>

      <form onSubmit={(e) => e.preventDefault()}>
        <DialogContent>
          <MDBox display="flex" justifyContent="flex-end">
            <MDButton
              variant="outlined"
              color="error"
              size="small"
              onClick={() => setinventory("")}
              sx={{ marginRight: "20px" }}
            >
              Clear
            </MDButton>
          </MDBox>
          <FormControl fullWidth margin="normal">
            <TextField
              label="Inventory Name"
              variant="outlined"
              value={inventory_name}
              onChange={(e) => setinventory(e.target.value)}
              helperText="Enter the updated inventory name"
              fullWidth
            />
          </FormControl>
        </DialogContent>
        <DialogActions>
          <MDButton onClick={handleClose} color="error" sx={{ marginRight: "10px" }}>
            Cancel
          </MDButton>
          <MDBox>
            <MDButton variant="gradient" color="submit" fullWidth onClick={handleUpdate}>
              Update
            </MDButton>
          </MDBox>
        </DialogActions>
      </form>
    </Dialog>
  );
};

// Define PropTypes for the component
UpdateinventoryDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
  inventoryId: PropTypes.string.isRequired,
  inventoryName: PropTypes.string.isRequired,
};

export default UpdateinventoryDialog;
