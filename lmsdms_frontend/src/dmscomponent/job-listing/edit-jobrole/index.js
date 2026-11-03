import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Card from "@mui/material/Card";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDInput from "components/MDInput";
import MDButton from "components/MDButton";
import BasicLayout from "layouts/authentication/components/BasicLayout";
import bgImage from "assets/images/bg-sign-in-basic.jpeg";
import ESignatureDialog from "layouts/authentication/ESignatureDialog";
import { useUpdateJobRoleMutation } from "apilms/jobRoleApi";
import { toast,ToastContainer } from "react-toastify";

function EditJobRole() {
  const [title, setTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [openSignatureDialog, setOpenSignatureDialog] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const location = useLocation();

  const [updateJobRole] = useUpdateJobRoleMutation();

  const { jobrole } = location.state || {}; // Getting the job role data passed from the previous screen
  console.log("-+-+-+-+-+-+-+-+-+-+-++--++-",jobrole);
  useEffect(() => {
    if (jobrole) {
      setTitle(jobrole.job_role_name);
      setJobDescription(jobrole.job_role_description);
    }
  }, [jobrole]);

  // Validation function
  const validateInputs = () => {
    const newErrors = {};
    if (!title.trim()) newErrors.title = "Title is required.";
    if (!jobDescription.trim()) newErrors.jobDescription = "Job Description is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateInputs()) return;
    setOpenSignatureDialog(true);
  };

  const handleSignatureComplete = async (password) => {
    setOpenSignatureDialog(false);

    if (!password) {
      toast.error("E-Signature is required to proceed.");
      return;
    }

    try {
      await updateJobRole({
        job_role_id: jobrole.id, // Passing job role ID to update
        job_role_name: title.trim(),
        job_role_description: jobDescription.trim(),
      }).unwrap();

      toast.success("Job Role updated successfully!");
      setTimeout(() => {
        navigate("/jobrole-listing"); // Redirect to the job role listing page
      }, 1500);
    } catch (error) {
      console.error("Error updating job role:", error);
      toast.error("Failed to update job role. Please try again.");
    }
  };

  const handleClear = () => {
    setTitle("");
    setJobDescription("");
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
            Edit Job Role
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
                label="Job Role Title"
                fullWidth
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                error={!!errors.title}
                helperText={errors.title}
              />
            </MDBox>
            <MDBox mb={3}>
              <MDInput
                label="Job Description"
                multiline
                rows={4}
                fullWidth
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                error={!!errors.jobDescription}
                helperText={errors.jobDescription}
              />
            </MDBox>
            <MDBox mt={2} mb={1}>
              <MDButton variant="gradient" color="submit" fullWidth type="submit">
                Submit
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
}

export default EditJobRole;
