import React, { useState } from "react";
import { useResetPasswordMutation, useOtpResetPasswordMutation } from "api/auth/userProfileApi";
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

function UpdatePassword() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState(Array(6).fill(""));
  const [errorMessage, setErrorMessage] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState(1);

  const [resetPassword] = useResetPasswordMutation();
  const [otpResetPassword] = useOtpResetPasswordMutation();

  const handleOldPasswordSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await resetPassword({ oldPassword }); // Check for expected API payload format
      // console.log("API response:", response); // Debugging line to check the response
  
      if (response.data?.status) {
        setStep(2); // Move to OTP verification step
      } else {
        setErrorMessage(response.data?.message || "Old password is incorrect!"); // Show specific message
      }
    } catch (error) {
      // console.error("Error:", error); // Log any error details
      setErrorMessage("Failed to verify old password.");
    }
  };
  

  const handleOtpChange = (index, value) => {
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
  };

  const handleClear = () => {
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setOtp(Array(6).fill(""));
    setErrorMessage("");
  };

  const toggleVisibility = (field) => {
    if (field === "old") setShowOldPassword((prev) => !prev);
    else if (field === "new") setShowNewPassword((prev) => !prev);
    else setShowConfirmPassword((prev) => !prev);
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setErrorMessage("New Password and Confirm Password do not match!");
      return;
    }
    try {
      const otpCode = otp.join(""); // Combine OTP digits into a single string
      const response = await otpResetPassword({ otp: otpCode, password: newPassword, confirmPassword });
      if (response.data.status) {
        setErrorMessage("Password updated successfully!");
        handleClear();
      } else {
        setErrorMessage("OTP or password is incorrect.");
      }
    } catch (error) {
      setErrorMessage("Failed to update password.");
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
           Change Password
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
          {step === 1 && (
            <MDBox component="form" role="form" onSubmit={handleOldPasswordSubmit} sx={{ padding: 3 }}>
              {errorMessage && (
                <MDTypography color="error" align="center" mb={2}>
                  {errorMessage}
                </MDTypography>
              )}
              <MDBox mb={3}>
                <MDInput
                  type={showOldPassword ? "text" : "password"}
                  label="Old Password"
                  fullWidth
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => toggleVisibility("old")}>
                          {showOldPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </MDBox>
              <MDBox mt={2} mb={1}>
                <MDButton variant="gradient" color="submit" fullWidth type="submit">
                  Verify Password
                </MDButton>
              </MDBox>
            </MDBox>
          )}

          {step === 2 && (
            <MDBox component="form" role="form" onSubmit={handleUpdatePassword} sx={{ padding: 3 }}>
              {errorMessage && (
                <MDTypography color="error" align="center" mb={2}>
                  {errorMessage}
                </MDTypography>
              )}
              <MDBox mb={3} display="flex" justifyContent="space-between">
                {[...Array(6)].map((_, index) => (
                  <MDInput
                    key={index}
                    type="text"
                    value={otp[index]}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    sx={{ width: "48px", mx: 0.5 }}
                    inputProps={{ maxLength: 1 }}
                  />
                ))}
              </MDBox>
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
                 Change password
                </MDButton>
              </MDBox>
            </MDBox>
          )}
        </MDBox>
      </Card>
    </BasicLayout>
  );
}

export default UpdatePassword;
