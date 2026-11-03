import React, { useState } from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Checkbox,
  Button,
  TextField,
} from "@mui/material";
import PropTypes from 'prop-types';

function RolesPermissionsPopup({ open, handleCloseRolesPopup, handleSubmitRolesPopup }) {
  const [esignOpen, setEsignOpen] = useState(false);
  const [password, setPassword] = useState("");

  const roles = ["Author", "Reviewer", "Approver", "Doc. Admin", "Admin"];
  const permissions = [
    "Revise",
    "Release",
    "Effective",
    "Resolve Comments",
    "Workflow",
    "Archive",
    "Obsolete",
  ];

  const [checkedState, setCheckedState] = useState(
    roles.reduce((acc, role) => {
      acc[role] = permissions.reduce((roleAcc, permission) => {
        roleAcc[permission] = false;
        return roleAcc;
      }, {});
      return acc;
    }, {})
  );

  const handleCheckboxChange = (role, permission) => {
    setCheckedState((prevState) => ({
      ...prevState,
      [role]: {
        ...prevState[role],
        [permission]: !prevState[role][permission],
      },
    }));
  };

  const handleEsignOpen = () => setEsignOpen(true);
  const handleEsignClose = () => setEsignOpen(false);

  const handleEsignSubmit = () => {
    console.log("E-signature password:", password);
    console.log("Checked permissions:", checkedState);
    setEsignOpen(false);
  };

  RolesPermissionsPopup.propTypes = {
    open: PropTypes.bool.isRequired,
    handleCloseRolesPopup: PropTypes.func.isRequired,
    handleSubmitRolesPopup: PropTypes.func, // Assuming this is an optional prop
  };
  
  return (
    <div>
      {/* Main Popup for Roles and Permissions */}
      <Dialog open={open} onClose={handleCloseRolesPopup} maxWidth="md" fullWidth>
        <DialogTitle style={{ textAlign: "center" }}>Roles and Permissions</DialogTitle>
        <DialogContent>
          <Table style={{ tableLayout: "fixed", width: "100%" }}>
            <TableHead>
              <TableRow>
                <TableCell style={{ textAlign: "center" }}>Role</TableCell>
                {permissions.map((permission) => (
                  <TableCell
                    key={permission}
                    align="center"
                    style={{ width: "12%", textAlign: "center" }}
                  >
                    {permission}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {roles.map((role) => (
                <TableRow key={role}>
                  <TableCell style={{ textAlign: "center" }}>{role}</TableCell>
                  {permissions.map((permission) => (
                    <TableCell key={`${role}-${permission}`} align="center" style={{ width: "12%" }}>
                      <Checkbox
                        checked={checkedState[role][permission]}
                        onChange={() => handleCheckboxChange(role, permission)}
                        size="small"
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRolesPopup} style={{ color: "black" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            style={{ backgroundColor: "#E53471", color: "white" }}
            onClick={() => {
              handleEsignOpen();  
              handleSubmitRolesPopup && handleSubmitRolesPopup(); 
            }}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>

      {/* E-signature Popup */}
      <Dialog open={esignOpen} onClose={handleEsignClose} maxWidth="sm" fullWidth>
        <DialogTitle style={{ textAlign: "center" }}>E-signature</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Password"
            type="password"
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEsignClose} style={{ color: "black" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            style={{ backgroundColor: "#303f9f", color: "white" }}
            onClick={handleEsignSubmit}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default RolesPermissionsPopup;
