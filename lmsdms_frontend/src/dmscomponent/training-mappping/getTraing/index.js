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
import MDTypography from "components/MDTypography";
import MDBox from "components/MDBox";
import MDButton from "components/MDButton";

const SelectTrainingDialog = ({ open, onClose, onConfirm }) => {
  const [plant, setPlant] = useState(""); // State for Plant selection
  const [type, setType] = useState(""); // State for Type selection
  const [trainingNumber, setTrainingNumber] = useState(""); // State for Training Number text field
  const [error, setError] = useState(""); // State to handle any validation errors

  // Static data for the dropdowns
  const plants = [
    { id: "plant1", name: "Plant A" },
    { id: "plant2", name: "Plant B" },
    { id: "plant3", name: "Plant C" },
  ];

  const types = [
    { id: "type1", name: "Type X" },
    { id: "type2", name: "Type Y" },
    { id: "type3", name: "Type Z" },
  ];
  const handleClear = () => {
    setPlant("");
    setType("");
    setTrainingNumber("");
    setError("");
  };

  useEffect(() => {
    // Reset selections when the dialog is reopened
    if (open) {
      setPlant("");
      setType("");
      setTrainingNumber("");
      setError("");
    }
  }, [open]);

  const handleConfirm = () => {
    if (!plant || !type || !trainingNumber) {
      setError("All fields are required"); // Validation if any selection is missing
      return;
    }

    setError(""); // Clear any previous error
    onConfirm({ plant, type, trainingNumber }); // Pass the selected values to the parent component
    onClose(); // Close the dialog after confirmation
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        
      <MDBox sx={{ textAlign: "center" }}>
        <MDTypography variant="h4" fontWeight="medium" color="#344767" mt={1}>
         search Training Information
        </MDTypography>
      </MDBox>
       <MDBox mt={2} mb={1} display="flex" justifyContent="flex-end">
                <MDButton
                  variant="outlined"
                  color="error"
                  size="small"
                  onClick={handleClear}
                  sx={{ marginLeft: "10px", marginRight: "10px" }}
                >
                  Clear
                </MDButton>
              </MDBox>

      <form onSubmit={(e) => e.preventDefault()}>
        <DialogContent>
          {/* Plant Dropdown */}
          <MDBox mb={3}>
            <FormControl fullWidth margin="dense" variant="outlined">
              <InputLabel id="select-plant-label">Select Plant</InputLabel>
              <Select
                labelId="select-plant-label"
                id="select-plant"
                value={plant}
                onChange={(e) => setPlant(e.target.value)}
                input={<OutlinedInput label="Select Plant" />}
                sx={{
                  minWidth: 200,
                  height: "3rem",
                  ".MuiSelect-select": { padding: "0.45rem" },
                }}
              >
                {plants.map((plant) => (
                  <MenuItem key={plant.id} value={plant.id}>
                    {plant.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </MDBox>

          {/* Type Dropdown */}
          <MDBox mb={3}>
            <FormControl fullWidth margin="dense" variant="outlined">
              <InputLabel id="select-type-label">Select Type</InputLabel>
              <Select
                labelId="select-type-label"
                id="select-type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                input={<OutlinedInput label="Select Type" />}
                sx={{
                  minWidth: 200,
                  height: "3rem",
                  ".MuiSelect-select": { padding: "0.45rem" },
                }}
              >
                {types.map((type) => (
                  <MenuItem key={type.id} value={type.id}>
                    {type.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </MDBox>

          {/* Training Number Text Field */}
          <MDBox mb={3}>
            <FormControl fullWidth margin="dense" variant="outlined">
              <InputLabel htmlFor="training-number">Training Number</InputLabel>
              <OutlinedInput
                id="training-number"
                value={trainingNumber}
                onChange={(e) => setTrainingNumber(e.target.value)}
                label="Training Number"
                sx={{
                  minWidth: 200,
                  height: "3rem",
                  ".MuiOutlinedInput-input": { padding: "0.45rem" },
                }}
              />
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
              setPlant(""); // Clear plant field
              setType(""); // Clear type field
              setTrainingNumber(""); // Clear training number field
              setError(""); // Clear error messages
              onClose(); // Close the dialog
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
            >
              Get training
            </MDButton>
          </MDBox>
        </DialogActions>
      </form>
    </Dialog>
  );
};

SelectTrainingDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
};

export default SelectTrainingDialog;
