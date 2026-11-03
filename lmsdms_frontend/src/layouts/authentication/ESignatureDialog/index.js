import React, { useState } from "react";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogActions,
  DialogContent,
  IconButton,
  FormControl,
  OutlinedInput,
  InputLabel,
  InputAdornment,
  CircularProgress,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import MDButton from "components/MDButton";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import { useSubmitESignatureMutation } from "api/auth/esignatureApi"; 

const EsignatureDialog = ({ open, onClose, onConfirm }) => {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitESignature, { isLoading, error: apiError }] = useSubmitESignatureMutation(); 

  const handleTogglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleConfirm = async () => {
    if (!password) {
      setError("Password is required");
      return;
    }

    setError(""); // Clear any previous error

    try {
      // Log password and call API to verify signature
      console.log("Submitting password:", password);

      const response = await submitESignature(password).unwrap(); // Submit password to the API

      console.log("API Response:", response);

      // Update the condition to check if status is true
      if (response?.status === true) {
        onConfirm(password); // Pass password to handleSignatureComplete
        onClose(); // Close dialog after successful signature
      } else {
        setError("Invalid password or e-signature submission failed.");
      }
    } catch (err) {
      // Log error for better debugging
      console.error("API Error:", err);

      if (err?.data?.message) {
        setError(err.data.message); // Show specific API error message
      } else {
        setError("An error occurred while submitting the e-signature.");
      }
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <MDBox sx={{ textAlign: "center" }}>
        <MDTypography variant="h4" fontWeight="medium" color="#344767" mt={1}>
          E-Signature
        </MDTypography>
      </MDBox>

      <form onSubmit={(e) => e.preventDefault()}>
        <DialogContent>
          {/* Password Field */}
          <FormControl fullWidth margin="dense" variant="outlined">
            <InputLabel htmlFor="password">Enter Your Password</InputLabel>
            <OutlinedInput
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              label="Enter Your Password"
              endAdornment={
                <InputAdornment position="end">
                  <IconButton
                    onClick={handleTogglePasswordVisibility}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              }
              error={!!error}
            />
          </FormControl>
          {error && (
            <MDTypography variant="caption" color="error">
              {error}
            </MDTypography>
          )}

          {isLoading && (
            <MDBox display="flex" justifyContent="center" mt={2}>
              <CircularProgress />
            </MDBox>
          )}

          {apiError && (
            <MDTypography variant="caption" color="error">
              {apiError.message || "An error occurred while submitting the e-signature."}
            </MDTypography>
          )}
        </DialogContent>

        <DialogActions>
          <MDButton
            onClick={() => {
              setPassword(""); 
              setError(""); 
              onClose(); 
            }}
            color="error"
            sx={{ marginRight: "10px" }}
          >
            Cancel
          </MDButton>
          <MDBox>
            <MDButton
              variant="gradient"
              color="submit"
              fullWidth
              onClick={handleConfirm}
              disabled={isLoading} 
            >
              {isLoading ? "Submitting..." : "Confirm Signature"}
            </MDButton>
          </MDBox>
        </DialogActions>
      </form>
    </Dialog>
  );
};

EsignatureDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
};

export default EsignatureDialog;
