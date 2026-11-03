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
import { useTrainerUpdateMutation } from "api/auth/trainerApi";

const EditTrainer = () => {
  const [trainerName, setTrainerName] = useState("");
  const [description, setDescription] = useState("");
  const [openSignatureDialog, setOpenSignatureDialog] = useState(false);
  const [errors, setErrors] = useState({});
  const [updateTrainer, { isLoading }] = useTrainerUpdateMutation();
  const navigate = useNavigate();
  const location = useLocation();

  // Fetching trainer data from the location state
  const trainer = location.state?.trainer || {};

  useEffect(() => {
    if (trainer) {
      setTrainerName(trainer.trainer_name);
      setDescription(trainer.description);
    }
  }, [trainer]);

  // Validation function
  const validateInputs = () => {
    const newErrors = {};
    if (!trainerName.trim()) newErrors.trainerName = "Trainer Name is required.";
    if (!description.trim()) newErrors.description = "Trainer Description is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateInputs()) return; // If validation fails, do not open signature dialog

    setOpenSignatureDialog(true); // Open signature dialog
  };

  const handleClear = () => {
    setTrainerName("");
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
      const response = await updateTrainer({
        trainer_id: trainer.id, // Passing the trainer ID from the state
        trainer_name: trainerName.trim(),
        description: description.trim(),
      }).unwrap();

      if (response.status) {
        toast.success("Trainer updated successfully!");
        setTimeout(() => {
          navigate("/trainer-listing"); // Navigate after successful submission
        }, 1500);
      } else {
        toast.error(response.message || "Failed to update trainer. Please try again.");
      }
    } catch (error) {
      console.error("Error updating trainer:", error);
      toast.error("An error occurred while updating the trainer.");
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
            Edit Trainer
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
                label={<><span style={{ color: "red" }}>*</span> Trainer Name</>}
                fullWidth
                value={trainerName}
                onChange={(e) => setTrainerName(e.target.value)}
                error={!!errors.trainerName}
                helperText={errors.trainerName}
              />
            </MDBox>
            <MDBox mb={3}>
              <MDInput
                label={<><span style={{ color: "red" }}>*</span> Trainer Description</>}
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
        onConfirm={handleSignatureComplete}
      />

      {/* <ToastContainer position="top-right" autoClose={3000} /> */}
    </BasicLayout>
  );
};

export default EditTrainer;
