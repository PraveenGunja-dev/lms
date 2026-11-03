import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Card from "@mui/material/Card";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDInput from "components/MDInput";
import MDButton from "components/MDButton";
import BasicLayout from "layouts/authentication/components/BasicLayout";
import bgImage from "assets/images/bg-sign-in-basic.jpeg";
import { useUpdateMethodologyMutation } from "apilms/MethodologyApi"; // Import the mutation hook
import ESignatureDialog from "layouts/authentication/ESignatureDialog"; // Import the E-Signature Dialog

function EditMethodology() {
  const location = useLocation();
  const navigate = useNavigate();
  const { item } = location.state || {}; // Destructure item from state

  const [methodologyName, setMethodologyName] = useState(item?.methodology_name || "");
  const [errors, setErrors] = useState({});
  const [openSignatureDialog, setOpenSignatureDialog] = useState(false); // State for signature dialog

  // Use the mutation hook to update methodology
  const [updateMethodology, { isLoading, error, data }] = useUpdateMethodologyMutation();

  const validateInputs = () => {
    const newErrors = {};
    if (!methodologyName.trim()) newErrors.methodologyName = "Methodology Name is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateInputs()) return;

    // Open signature dialog when form is valid
    setOpenSignatureDialog(true);
  };

  const handleClear = () => {
    setMethodologyName(""); // Reset to the original value
    setErrors({});
  };

  const handleSignatureComplete = async (password) => {
    setOpenSignatureDialog(false);
    if (!password) {
      toast.error("E-Signature is required to proceed.");
      return;
    }

    try {
      const response = await updateMethodology({
        id: item?.id,
        methodology_name: methodologyName,
      }).unwrap();

      toast.success(response.message || "Methodology updated successfully!");

      // Delay navigation slightly so the toast is visible
      setTimeout(() => {
        navigate("/methodology-listing");
      }, 1500);
    } catch (error) {
      const errorMessage =
        error?.data?.message || "Failed to update methodology. Please try again.";
      toast.error(errorMessage);
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
            Edit Methodology
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
            clear
          </MDButton>
        </MDBox>
        <MDBox pb={3} px={3}>
          <MDBox component="form" role="form" onSubmit={handleSubmit} sx={{ padding: 3 }}>
            <MDBox mb={3}>
              <MDInput
                type="text"
                label={
                  <>
                    <span style={{ color: "red" }}>*</span>Methodology name
                  </>
                }
                fullWidth
                value={methodologyName}
                onChange={(e) => setMethodologyName(e.target.value)}
                error={!!errors.methodologyName}
                helperText={errors.methodologyName}
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
                {isLoading ? "Updating..." : "Update"}
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

      {/* Toast Container */}
      {/* <ToastContainer position="top-right" autoClose={3000} /> */}
    </BasicLayout>
  );
}

export default EditMethodology;
