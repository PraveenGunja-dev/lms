import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Card from "@mui/material/Card";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDInput from "components/MDInput";
import MDButton from "components/MDButton";
import BasicLayout from "layouts/authentication/components/BasicLayout";
import bgImage from "assets/images/bg-sign-in-basic.jpeg";
import ESignatureDialog from "layouts/authentication/ESignatureDialog";
import { useUpdateDeletePlantMutation } from "apilms/plantApi"; // Adjust import for the mutation

const EditPlant = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [plantName, setPlantName] = useState(state?.plant?.plant_name || "");
  const [plantLocation, setPlantLocation] = useState(state?.plant?.plant_location || "");
  const [plantDescription, setPlantDescription] = useState(state?.plant?.plant_description || "");
  const [openSignatureDialog, setOpenSignatureDialog] = useState(false);
  const [errors, setErrors] = useState({});
  
  const [updateDeletePlant, { isLoading }] = useUpdateDeletePlantMutation();

  const validateInputs = () => {
    const newErrors = {};
    if (!plantName.trim()) newErrors.plantName = "Plant Name is required.";
    if (!plantLocation.trim()) newErrors.plantLocation = "Plant Location is required.";
    if (!plantDescription.trim()) newErrors.plantDescription = "Plant Description is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateInputs()) return; // If validation fails, do not open signature dialog
    setOpenSignatureDialog(true); // Open signature dialog
  };

  const handleClear = () => {
    setPlantName("");
    setPlantLocation("");
    setPlantDescription("");
    setErrors({});
  };

  const handleSignatureComplete = async (password) => {
    setOpenSignatureDialog(false); // Close the signature dialog
    
    if (!password) {
      toast.error("E-Signature is required to proceed.");
      return;
    }

    try {
      const response = await updateDeletePlant({
        plant_id: state?.plant?.id, // Get plant ID from location state
        plant_name: plantName.trim(),
        plant_location: plantLocation.trim(),
        plant_description: plantDescription.trim(),
      }).unwrap();

      if (response.status) {
        toast.success("Plant updated successfully!");
        setTimeout(() => {
          navigate("/plant-listing"); // Navigate to plant listing page
        }, 1500);
      } else {
        toast.error(response.message || "Failed to update plant. Please try again.");
      }
    } catch (error) {
      console.error("Error updating plant:", error);
      toast.error("An error occurred while updating the plant.");
    }
  };

  return (
    <BasicLayout image={bgImage} showNavbarFooter={false}>
      <Card sx={{ width: 600, mx: "auto" }}>
        <MDBox
          borderRadius="lg"
          sx={{
            background: "linear-gradient(212deg, #d5b282, #f5e0c3)",
            borderRadius: "lg",
            mx: 2,
            mt: -3,
            p: 2,
            mb: 1,
            textAlign: "center",
          }}
        >
          <MDTypography variant="h3" fontWeight="medium" color="#344767" mt={1}>
            Edit Plant
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

        <MDBox pb={3} px={3}>
          <MDBox component="form" role="form" onSubmit={handleSubmit} sx={{ padding: 3 }}>
            <MDBox mb={3}>
              <MDInput
                type="text"
                label={<><span style={{ color: "red" }}>*</span> Plant Name</>}
                fullWidth
                value={plantName}
                onChange={(e) => setPlantName(e.target.value)}
                error={!!errors.plantName}
                helperText={errors.plantName}
              />
            </MDBox>
            <MDBox mb={3}>
              <MDInput
                type="text"
                label={<><span style={{ color: "red" }}>*</span> Plant Location</>}
                fullWidth
                value={plantLocation}
                onChange={(e) => setPlantLocation(e.target.value)}
                error={!!errors.plantLocation}
                helperText={errors.plantLocation}
              />
            </MDBox>
            <MDBox mb={3}>
              <MDInput
                label={<><span style={{ color: "red" }}>*</span> Plant Description</>}
                multiline
                rows={4}
                fullWidth
                value={plantDescription}
                onChange={(e) => setPlantDescription(e.target.value)}
                error={!!errors.plantDescription}
                helperText={errors.plantDescription}
              />
            </MDBox>
            <MDBox mt={2} mb={1}>
              <MDButton variant="gradient" color="submit" fullWidth type="submit" disabled={isLoading}>
                {isLoading ? "Updating..." : "Save Changes"}
              </MDButton>
            </MDBox>
          </MDBox>
        </MDBox>
      </Card>

      <ESignatureDialog
        open={openSignatureDialog}
        onClose={() => setOpenSignatureDialog(false)}
        onConfirm={handleSignatureComplete}
      />

      {/* <ToastContainer position="top-right" autoClose={3000} /> */}
    </BasicLayout>
  );
};

export default EditPlant;
