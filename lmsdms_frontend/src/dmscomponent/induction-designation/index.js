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
import { useCreateInductionDesignationMutation } from "apilms/InductionApi"; // Adjust the path to your API slice

const AddInductionDesignation = () => {
  const [name, setName] = useState("");
  const [code, setCode] = useState(""); 
  const [induction, setInduction] = useState("");
  const [errors, setErrors] = useState({});
  const [createInductionDesignation, { isLoading }] = useCreateInductionDesignationMutation();
  const navigate = useNavigate();

  const validateInputs = () => {
    const newErrors = {};
    if (!name.trim()) newErrors.name = "Designation Name is required.";
    if (!code.trim()) newErrors.code = "Designation Code is required.";
    if (!induction.trim()) newErrors.induction = "Induction is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateInputs()) return;

    try {
      const response = await createInductionDesignation({
        induction_designation_name: name.trim(),
        designation_code: code.trim(),
        induction: induction.trim(),
      }).unwrap();

      if (response.status) {
        toast.success("Induction Designation added successfully!");
        setTimeout(() => {
          navigate("/induction-designation-listing");
        }, 1500);
      } else {
        toast.error(response.message || "Failed to add designation. Please try again.");
      }
    } catch (error) {
      console.error("Error adding designation:", error);
      toast.error("An error occurred while adding the designation.");
    }
  };

  const handleClear = () => {
    setName("");
    setCode("");
    setInduction("");
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
            Add Induction Designation
          </MDTypography>
        </MDBox>

        <MDBox pb={3} px={3}>
          <MDBox component="form" role="form" onSubmit={handleSubmit} sx={{ padding: 3 }}>
            <MDBox mb={3}>
              <MDInput
                type="text"
                label={<><span style={{ color: "red" }}>*</span> Designation Name</>}
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
                label={<><span style={{ color: "red" }}>*</span> Designation Code</>}
                fullWidth
                value={code}
                onChange={(e) => setCode(e.target.value)}
                error={!!errors.code}
                helperText={errors.code}
              />
            </MDBox>
            <MDBox mb={3}>
              <MDInput
                type="text"
                label={<><span style={{ color: "red" }}>*</span> Induction</>}
                fullWidth
                value={induction}
                onChange={(e) => setInduction(e.target.value)}
                error={!!errors.induction}
                helperText={errors.induction}
              />
            </MDBox>
            <MDBox mt={2} mb={1}>
              <MDButton variant="gradient" color="submit" fullWidth type="submit" disabled={isLoading}>
                {isLoading ? "Submitting..." : "Submit"}
              </MDButton>
            </MDBox>
            <MDBox mt={2}>
              <MDButton
                variant="outlined"
                color="error"
                size="small"
                onClick={handleClear}
                fullWidth
              >
                Clear
              </MDButton>
            </MDBox>
          </MDBox>
        </MDBox>
      </Card>

      {/* <ToastContainer position="top-right" autoClose={3000} /> */}
    </BasicLayout>
  );
};

export default AddInductionDesignation;
