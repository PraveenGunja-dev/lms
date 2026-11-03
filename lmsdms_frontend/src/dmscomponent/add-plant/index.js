import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { useCreateGetPlantMutation } from "apilms/plantApi"; // Adjust the path to where your API slice is located

const AddPlant = () => {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [openSignatureDialog, setOpenSignatureDialog] = useState(false);
  const [errors, setErrors] = useState({});
  const [createPlant, { isLoading }] = useCreateGetPlantMutation();
  const navigate = useNavigate();

  // Validation function
  const validateInputs = () => {
    const newErrors = {};
    if (!name.trim()) newErrors.name = "Plant Name is required.";
    if (!location.trim()) newErrors.location = "Plant Location is required.";
    if (!description.trim()) newErrors.description = "Plant Description is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateInputs()) return; // If validation fails, do not open signature dialog

    setOpenSignatureDialog(true); // Open signature dialog
  };

  const handleClear = () => {
    setName("");
    setLocation("");
    setDescription("");
    setErrors({});
  };

  const handleSignatureComplete = async (password) => {
    setOpenSignatureDialog(false); // Close signature dialog

    if (!password) {
      toast.error("E-Signature is required to proceed.");
      return;
    }

    try {
      const response = await createPlant({
        plant_name: name.trim(),
        plant_location: location.trim(),
        plant_description: description.trim(),
      }).unwrap();

      if (response.status) {
        toast.success("Plant added successfully!");
        setTimeout(() => {
          navigate("/plant-listing "); // Navigate after successful submission
        }, 1500);
      } else {
        toast.error(response.message || "Failed to add plant. Please try again.");
      }
    } catch (error) {
      console.error("Error adding plant:", error);
      toast.error("An error occurred while adding the plant.");
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
            Add Plant
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
                label={
                  <>
                    <span style={{ color: "red" }}>*</span> Plant Name
                  </>
                }
                fullWidth
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={!!errors.name}
                helperText={errors.name}
              />
            </MDBox>
            <MDBox mb={3}>
              <MDInput
                type="text"
                label={
                  <>
                    <span style={{ color: "red" }}>*</span> Plant Location
                  </>
                }
                fullWidth
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                error={!!errors.location}
                helperText={errors.location}
              />
            </MDBox>
            <MDBox mb={3}>
              <MDInput
                label={
                  <>
                    <span style={{ color: "red" }}>*</span> Plant Description
                  </>
                }
                multiline
                rows={4}
                fullWidth
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                error={!!errors.description}
                helperText={errors.description}
              />
            </MDBox>
            <MDBox mt={2} mb={1}>
              <MDButton
                variant="gradient"
                color="submit"
                fullWidth
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? "Submitting..." : "Submit"}
              </MDButton>
            </MDBox>
          </MDBox>
        </MDBox>
      </Card>

      {/* E-Signature Dialog */}
      <ESignatureDialog
        open={openSignatureDialog}
        onClose={() => setOpenSignatureDialog(false)}
        onConfirm={handleSignatureComplete}
      />

     
    </BasicLayout>
  );
};

export default AddPlant;
