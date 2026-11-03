import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  TextField,
  Typography,
  Box,
} from "@mui/material";
import MDButton from "components/MDButton"; // Adjust path based on your project structure

const ResetPasswordDialog = ({ open, onClose, handleResetPassword, isLoading, isError }) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogContent>
        <Box sx={{ padding: 2, position: "relative", height: "100%" }}>
          <Typography variant="h6">Reset Password</Typography>
          <TextField
            label="Current Password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            fullWidth
            variant="outlined"
            margin="normal"
          />
          <TextField
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            fullWidth
            variant="outlined"
            margin="normal"
          />
          <TextField
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            fullWidth
            variant="outlined"
            margin="normal"
          />
          <MDButton
            variant="gradient"
            color="submit"
            onClick={() => handleResetPassword(currentPassword, newPassword, confirmPassword)}
            sx={{
              marginBottom: 2,
              backgroundColor: isLoading ? "gray" : "black",
              color: "white",
            }}
            disabled={isLoading}
          >
            {isLoading ? "Resetting..." : "Reset Password"}
          </MDButton>
          {isError && (
            <Typography color="error" variant="body2">
              Failed to reset password. Please try again.
            </Typography>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default ResetPasswordDialog;
