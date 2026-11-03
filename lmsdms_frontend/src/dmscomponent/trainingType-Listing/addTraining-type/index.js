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
import { useCreateTrainingTypeMutation } from "apilms/trainingtypeApi";

function AddTrainingType() {
  const [trainingTypeName, setTrainingTypeName] = useState("");
  const [errors, setErrors] = useState({});
  const [openSignatureDialog, setOpenSignatureDialog] = useState(false);
  const [createTrainingType, { isLoading }] = useCreateTrainingTypeMutation();
  const navigate = useNavigate();

  const validateInputs = () => {
    const newErrors = {};
    if (!trainingTypeName.trim()) {
      newErrors.trainingTypeName = "Training Type Name is required.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateInputs()) return;
    setOpenSignatureDialog(true); // Open the signature dialog
  };

  const handleClear = () => {
    setTrainingTypeName("");
    setErrors({});
  };

  const handleSignatureComplete = async (password) => {
    setOpenSignatureDialog(false);
    if (!password) {
      toast.error("E-Signature is required to proceed.");
      return;
    }

    try {
      const response = await createTrainingType({
        training_type_name: trainingTypeName.trim(),
      }).unwrap();

      console.log("API Response:", response);
      toast.success("Training Type added successfully!");
      setTimeout(() => {
        navigate("/trainingType-Listing"); // Navigate after success
      }, 1500);
    } catch (error) {
      console.error("Error creating training type:", error);
      toast.error("Failed to add training type. Please try again.");
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
            Add Training Type
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
                    <span style={{ color: "red" }}>*</span>Training Type Name
                  </>
                }
                fullWidth
                value={trainingTypeName}
                onChange={(e) => setTrainingTypeName(e.target.value)}
                error={!!errors.trainingTypeName}
                helperText={errors.trainingTypeName}
              />
            </MDBox>
            <MDBox mt={2} mb={1}>
              <MDButton variant="gradient" color="submit" fullWidth type="submit" disabled={isLoading}>
                {isLoading ? "Submitting..." : "Submit"}
              </MDButton>
            </MDBox>
          </MDBox>
        </MDBox>
      </Card>

      {/* E-Signature Dialog */}
      <ESignatureDialog
        open={openSignatureDialog}
        onClose={() => setOpenSignatureDialog(false)} // Close the dialog
        onConfirm={handleSignatureComplete} // Handle signature completion
      />

      {/* Toast Container */}
      {/* <ToastContainer position="top-right" autoClose={3000} /> */}
    </BasicLayout>
  );
}

export default AddTrainingType;
