import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useSwitchUserRoleMutation } from "api/auth/userRoleApi";
import { Dialog, DialogActions, DialogContent, DialogTitle, FormControl, InputLabel, Select, MenuItem, TextField, Button } from "@mui/material";

function RoleSwitchPopup({ open, handleClose, token, groupOptions }) {
  const [groupName, setGroupName] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [switchUserRole, { isLoading }] = useSwitchUserRoleMutation();

  const handleRoleSwitch = async () => {
    setMessage("");
    setError("");

    try {
      const response = await switchUserRole({ group_name: groupName, password });

      if (response?.data?.status) {
        setMessage("Role switched successfully!");
      } else {
        setError(response?.data?.message || "Failed to switch role");
      }
    } catch (err) {
      setError("An error occurred while switching role");
      console.error("Error switching role:", err);
    }
  };

  useEffect(() => {
    if (!open) {
      setGroupName("");
      setPassword("");
      setMessage("");
      setError("");
    }
  }, [open]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>Switch User Role</DialogTitle>
      <DialogContent>
        <FormControl fullWidth margin="dense">
          <InputLabel>Group Name</InputLabel>
          <Select
            label="Group Name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            fullWidth
          >
            {groupOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth margin="dense">
          <TextField
            label="Password"
            variant="outlined"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
          />
        </FormControl>
        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-message">{error}</div>}
      </DialogContent>
      <DialogActions> 
        <Button onClick={handleClose} color="secondary">
          Cancel
        </Button>
        <Button onClick={handleRoleSwitch} color="primary" disabled={isLoading}>
          {isLoading ? "Switching..." : "Switch Role"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

RoleSwitchPopup.propTypes = {
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
  token: PropTypes.string.isRequired,
  groupOptions: PropTypes.array.isRequired, 
};

export default RoleSwitchPopup;
