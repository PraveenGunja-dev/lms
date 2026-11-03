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
import { useCreateDepartmentMutation } from "api/auth/departmentApi";

function AddDepartment() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState({});
  const [openSignatureDialog, setOpenSignatureDialog] = useState(false);

  const navigate = useNavigate();
  const [createDepartment, { isLoading }] = useCreateDepartmentMutation();

  const validateInputs = () => {
    const newErrors = {};
    if (!name.trim()) newErrors.name = "Department Name is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; // Valid if no errors
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateInputs()) return; // Stop submission if validation fails

    setOpenSignatureDialog(true); // Open signature dialog
  };

  const handleSignatureComplete = async (password) => {
    setOpenSignatureDialog(false);

    if (!password) {
      toast.error("E-Signature is required to proceed.");
      return;
    }

    try {
      await createDepartment({
        department_name: name.trim(),
        department_description: description.trim() || null, // Allow optional description
      }).unwrap();

      toast.success("Department added successfully!");
      setTimeout(() => {
        navigate("/department-listing");
      }, 1500);
    } catch (error) {
      console.error("Failed to create department:", error.message);
      toast.error("Failed to add department. Please try again.");
    }
  };

  const handleClear = () => {
    setName("");
    setDescription("");
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
            Add Department
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
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={!!errors.name}
                helperText={errors.name}
              />
            </MDBox>
            <MDBox mb={3}>
              <MDInput
                label="Description"
                multiline
                rows={4}
                fullWidth
                value={description}
                onChange={(e) => setDescription(e.target.value)}
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
        onClose={() => setOpenSignatureDialog(false)}
        onConfirm={handleSignatureComplete} // Call handleSignatureComplete when confirmed
      />

      {/* Toast Container */}
      {/* <ToastContainer position="top-right" autoClose={3000} /> */}
    </BasicLayout>
  );
}

export default AddDepartment;
