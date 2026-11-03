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
import { useUpdateTemplateMutation } from "api/auth/documentApi"; 

function UpdateTemplate() {
  const navigate = useNavigate();
  const location = useLocation();
  const templateData = location.state?.item;

  const [templateName, setTemplateName] = useState(templateData?.template_name || "");
  const [templateFile, setTemplateFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [openSignatureDialog, setOpenSignatureDialog] = useState(false);

  // Use the updateTemplate mutation hook
  const [updateTemplate] = useUpdateTemplateMutation();

  useEffect(() => {
    if (!templateData) {
      console.error("No template data found. Redirecting...");
      navigate("/template-listing");
    }
  }, [templateData, navigate]);

  const validateInputs = () => {
    const newErrors = {};
    if (!templateName.trim()) newErrors.templateName = "Template Name is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
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
      // Prepare the data for submission
      const formData = new FormData();
      formData.append("template_name", templateName.trim());
      if (templateFile) {
        formData.append("template_doc", templateFile);
      }

      // Call the updateTemplate mutation
      const response = await updateTemplate({
        temp_id: templateData.id, // Assuming the template has an id field
        template_name: templateName.trim(),
        template_doc: templateFile,
      }).unwrap();

      // Handle success
      toast.success("Template updated successfully!");
      setTimeout(() => {
        navigate("/template-listing");
      }, 1500);
    } catch (error) {
      // Handle error
      console.error("Error updating template:", error);
      toast.error("Failed to update template. Please try again.");
    }
  };

  const handleClear = () => {
    setTemplateName("");
    setTemplateFile(null);
    setErrors({});
  };

  const handleFileChange = (e) => {
    setTemplateFile(e.target.files[0]);
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
            Update Template
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
                label={<><span style={{ color: "red" }}>*</span>Template name</>}
                fullWidth
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                error={!!errors.templateName}
                helperText={errors.templateName}
              />
            </MDBox>
            <MDBox mb={3}>
              <MDInput
                type="file"
                label={<><span style={{ color: "red" }}>*</span>Upload template file</>}
                fullWidth
                onChange={handleFileChange}
                InputLabelProps={{ shrink: true }}
                inputProps={{ accept: ".pdf,.docx,.txt" }}
              />
            </MDBox>
            <MDBox mt={2} mb={1}>
              <MDButton variant="gradient" color="submit" fullWidth type="submit">
                Submit
              </MDButton>
            </MDBox>
          </MDBox>
        </MDBox>
        <ESignatureDialog
          open={openSignatureDialog}
          onClose={() => setOpenSignatureDialog(false)}
          onConfirm={handleSignatureComplete} 
        />
      </Card>
      {/* <ToastContainer position="top-right" autoClose={3000} /> */}
    </BasicLayout>
  );
}

export default UpdateTemplate;
