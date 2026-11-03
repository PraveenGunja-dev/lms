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
import { useCreatePrinterMutation } from "api/auth/PrinterApi"; // Import the mutation hook

function AddPrinter() {
  const [printerName, setPrinterName] = useState("");
  const [printerPath, setPrinterPath] = useState("");
  const [errors, setErrors] = useState({});
  const [openSignatureDialog, setOpenSignatureDialog] = useState(false);
  const [pendingData, setPendingData] = useState(null); // Store data temporarily for E-Signature

  const navigate = useNavigate();
  const [createPrinter] = useCreatePrinterMutation(); // Initialize the mutation

  // Validate input fields
  const validateInputs = () => {
    const newErrors = {};
    if (!printerName.trim()) newErrors.printerName = "Printer Name is required.";
    if (!printerPath.trim()) newErrors.printerPath = "Printer Path is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; // Valid if no errors
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateInputs()) return; // Stop submission if validation fails

    // Temporarily store the data and open the E-Signature dialog
    setPendingData({ printer_name: printerName, printer_location: printerPath });
    setOpenSignatureDialog(true);
  };

  // Handle E-Signature confirmation
  const handleSignatureComplete = async (password) => {
    setOpenSignatureDialog(false);
    if (!password) {
      toast.error("E-Signature is required to proceed.");
      return;
    }
  
    try {
      // Call the mutation to create the printer
      await createPrinter(pendingData).unwrap();
      toast.success("Printer added successfully!");
  
      // Delay navigation to give time for the toast to be visible
      setTimeout(() => {
        navigate("/printer-listing"); // Redirect after success
      }, 1500); // 3 seconds delay to match the toast auto-close duration
    } catch (error) {
      console.error("Error adding printer:", error);
      toast.error("Error adding printer. Please try again.");
    }
  };
  

  // Clear form inputs
  const handleClear = () => {
    setPrinterName("");
    setPrinterPath("");
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
            Add Printer
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
                label="Printer Name"
                fullWidth
                value={printerName}
                onChange={(e) => setPrinterName(e.target.value)}
                error={!!errors.printerName}
                helperText={errors.printerName}
              />
            </MDBox>
            <MDBox mb={3}>
              <MDInput
                label="Printer location"
                fullWidth
                value={printerPath}
                onChange={(e) => setPrinterPath(e.target.value)}
                error={!!errors.printerPath}
                helperText={errors.printerPath}
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

export default AddPrinter;
