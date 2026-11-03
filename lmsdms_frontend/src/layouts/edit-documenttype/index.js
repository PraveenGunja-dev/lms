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
import ESignatureDialog from "layouts/authentication/ESignatureDialog";
import { useUpdateDocumentTypeMutation } from "api/auth/documentApi";

function EditDocumentType() {
  const navigate = useNavigate();
  const location = useLocation();
  const { item } = location.state || {}; // Get the passed item from state

  const [documentTypeName, setDocumentTypeName] = useState(item?.document_name || "");
  const [openSignatureDialog, setOpenSignatureDialog] = useState(false);
  const [updateDocumentType, { isLoading: isUpdating }] = useUpdateDocumentTypeMutation();

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!documentTypeName.trim()) {
      toast.error("Document Type Name is required.");
      return;
    }

    setOpenSignatureDialog(true); // Open the signature dialog for confirmation
  };

  const handleClear = () => {
    setDocumentTypeName(""); // Clear the input field
  };

  const handleSignatureComplete = async (password) => {
    setOpenSignatureDialog(false);

    if (!password) {
      toast.error("E-Signature is required to proceed.");
      return;
    }

    try {
      await updateDocumentType({
        document_type_id: item?.id, // Use the id from the passed item
        document_name: documentTypeName.trim(),
      }).unwrap();

      toast.success("Document Type updated successfully!");
      setTimeout(() => {
        navigate("/document-typelisting"); // Navigate after success
      }, 1500);
    } catch (error) {
      // console.error("Error updating document type:", error);
      toast.error("Failed to update document type. Please try again.");
    }
  };

  if (!item) {
    return <p>Invalid document type data. Please try again.</p>;
  }

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
            Edit Document Type
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
                label={<><span style={{ color: "red" }}>*</span>Document type name</>}
                fullWidth
                value={documentTypeName}
                onChange={(e) => setDocumentTypeName(e.target.value)}
              />
            </MDBox>
            <MDBox mt={2} mb={1}>
              <MDButton
                variant="gradient"
                color="submit"
                fullWidth
                type="submit"
                disabled={isUpdating}
              >
                {isUpdating ? "Saving..." : "Update"}
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

export default EditDocumentType;
