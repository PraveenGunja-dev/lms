import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOtpResetPasswordMutation } from "api/auth/userProfileApi";
import Card from "@mui/material/Card";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDInput from "components/MDInput";
import MDButton from "components/MDButton";
import BasicLayout from "layouts/authentication/components/BasicLayout";
import bgImage from "assets/images/bg-sign-in-basic.jpeg";
import { toast } from "react-toastify"; // ✅ make sure react-toastify is installed and imported

function ResettPassword() {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [resetPassword] = useOtpResetPasswordMutation();

  const handleClear = () => {
    setNewPassword("");
    setConfirmPassword("");
    setErrorMessage("");
    setSuccessMessage("");
  };

  const toggleVisibility = (field) => {
    if (field === "new") setShowNewPassword((prev) => !prev);
    else setShowConfirmPassword((prev) => !prev);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      setErrorMessage("Both fields are required.");
      setSuccessMessage("");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("New Password and Confirm Password do not match!");
      setSuccessMessage("");
      return;
    }

    try {
      const response = await resetPassword({
        password: newPassword,
        confirmPassword,
      });

      if (response.data?.status === true) {
        toast.success("Password changed successfully!", { autoClose: 2000 });
        setSuccessMessage("Password updated successfully!");
        setErrorMessage("");
        handleClear();

        // ✅ redirect to login page after short delay
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setErrorMessage(response.data?.message || "Failed to update password.");
        setSuccessMessage("");
        toast.error(response.data?.message || "Failed to update password.");
      }
    } catch (error) {
      console.error("Error:", error);
      setErrorMessage("An error occurred while updating password.");
      setSuccessMessage("");
      toast.error("An error occurred while updating password.");
    }
  };

  return (
    <BasicLayout image={bgImage} showNavbarFooter={false}>
      <Card sx={{ width: 500, mx: "auto" }}>
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
            Reset Password
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
            {errorMessage && (
              <MDTypography color="error" align="center" mb={2}>
                {errorMessage}
              </MDTypography>
            )}
            {successMessage && (
              <MDTypography color="success" align="center" mb={2}>
                {successMessage}
              </MDTypography>
            )}

            <MDBox mb={3}>
              <MDInput
                type={showNewPassword ? "text" : "password"}
                label="New Password"
                fullWidth
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => toggleVisibility("new")}>
                        {showNewPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </MDBox>

            <MDBox mb={3}>
              <MDInput
                type={showConfirmPassword ? "text" : "password"}
                label="Confirm Password"
                fullWidth
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => toggleVisibility("confirm")}>
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </MDBox>

            <MDBox mt={2} mb={1}>
              <MDButton variant="gradient" color="submit" fullWidth type="submit">
                Change Password
              </MDButton>
            </MDBox>
          </MDBox>
        </MDBox>
      </Card>
    </BasicLayout>
  );
}

export default ResettPassword;
