import React, { useState } from "react";
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
import { useUpdateDeleteDepartmentMutation } from "api/auth/departmentApi";
import ESignatureDialog from "layouts/authentication/ESignatureDialog";

const UpdateDepartment = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [departmentName, setDepartmentName] = useState(state?.department.department_name || "");
  const [departmentDescription, setDepartmentDescription] = useState(state?.department.department_description || "");
  const [errors, setErrors] = useState({});
  const [openSignatureDialog, setOpenSignatureDialog] = useState(false);

  const [updateDeleteDepartment, { isLoading }] = useUpdateDeleteDepartmentMutation();

  const validateInputs = () => {
    const newErrors = {};
    if (!departmentName.trim()) newErrors.departmentName = "Department Name is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; // Valid if no errors
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateInputs()) return;

    setOpenSignatureDialog(true); // Open e-signature dialog
  };

  const handleSignatureComplete = async (password) => {
    setOpenSignatureDialog(false);

    if (!password) {
      toast.error("E-Signature is required to proceed.");
      return;
    }

    try {
      await updateDeleteDepartment({
        department_id: state.department.id, // Use dynamic department ID
        department_name: departmentName.trim(),
        department_description: departmentDescription.trim() || "N/A", // Optional description
      }).unwrap();

      toast.success("Department updated successfully!");
      setTimeout(() => {
        navigate("/department-listing");
      }, 1500);
    } catch (error) {
      console.error("Error updating department:", error.message || error);
      toast.error("Failed to update department. Please try again.");
    }
  };

  const handleClear = () => {
    setDepartmentName("");
    setDepartmentDescription("");
    setErrors({});
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
            Update Department
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
                label={<><span style={{ color: "red" }}>*</span>Department name</>}
                fullWidth
                value={departmentName}
                onChange={(e) => setDepartmentName(e.target.value)}
                error={!!errors.departmentName}
                helperText={errors.departmentName}
              />
            </MDBox>
            <MDBox mb={3}>
              <MDInput
                label="Department Description"
                multiline
                rows={4}
                fullWidth
                value={departmentDescription}
                onChange={(e) => setDepartmentDescription(e.target.value)}
              />
            </MDBox>
            <MDBox mt={2} mb={1}>
              <MDButton variant="gradient" color="submit" fullWidth type="submit" disabled={isLoading}>
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
};

export default UpdateDepartment;
