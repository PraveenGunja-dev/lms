import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  OutlinedInput,
} from "@mui/material"; 
import { useFetchDepartmentsQuery } from "api/auth/departmentApi";
import PropTypes from "prop-types"; // Import PropTypes
import MDButton from "components/MDButton";
import { useAssignDepartmentMutation } from "api/auth/departmentApi";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useUserListQuery } from "api/auth/userApi";

const AssignDepartmentDialog = ({
  open,
  onClose,
  fullName,
  selectedUserid,
  is_department_assigned,
  departmentId,
}) => {
  const [department, setDepartment] = useState(departmentId);
  const { refetch } = useUserListQuery();
  const { data: departmentsData, isLoading: isDepartmentsLoading } = useFetchDepartmentsQuery();
  const [assignDepartment, { isLoading }] = useAssignDepartmentMutation();

  // Reset department state when the dialog is closed or opened again
  useEffect(() => {
    if (open) {
      setDepartment(departmentId); // Set the department state to the provided departmentId when the dialog is opened
    }
  }, [open, departmentId]);

  const handleDepartmentChange = (event) => {
    setDepartment(event.target.value);
  };

  const handleAssign = async () => {
    try {
      await assignDepartment({ department_id: department, user_id: selectedUserid }).unwrap();
      toast.success(`Department assigned successfully to ${fullName}!`);
      refetch();
      onClose(); // Close the dialog
    } catch (error) {
      toast.error(error.message || "Failed to assign department"); // Show error toast
    }
  };

  return (
    <Dialog open={open} onClose={onClose}fullWidth maxWidth="md">
      <DialogTitle>
        {is_department_assigned
          ? `Update Assigned department to ${fullName}`
          : `Assign Department to ${fullName}`}
      </DialogTitle>
      <DialogContent>
        <FormControl fullWidth margin="dense">
          <InputLabel id="select-department-label">Assign Department</InputLabel>
          <Select
            labelId="select-department-label"
            id="select-department"
            value={department}
            onChange={handleDepartmentChange}
            input={<OutlinedInput label="Assign Department" />}
            sx={{
              minWidth: 200,
              height: "3rem",
              ".MuiSelect-select": {
                padding: "0.75rem",
              },
            }}
            disabled={isDepartmentsLoading}
          >
            {isDepartmentsLoading ? (
              <MenuItem disabled>Loading departments...</MenuItem>
            ) : (
              departmentsData?.map((dept) => (
                <MenuItem key={dept.id} value={dept.id}>
                  {dept.department_name}
                </MenuItem>
              ))
            )}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <MDButton onClick={onClose} color="primary">
          Cancel
        </MDButton>
        <MDButton onClick={handleAssign} variant="gradient" color="submit" disabled={!department}>
          {isDepartmentsLoading ? <CircularProgress size={24} /> : "Assign"}
        </MDButton>
      </DialogActions>
    </Dialog>
  );
};

// PropTypes validation
AssignDepartmentDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  fullName: PropTypes.string.isRequired,
  selectedUserid: PropTypes.number.isRequired,
  is_department_assigned: PropTypes.bool.isRequired,
  departmentId: PropTypes.number.isRequired,
};

export default AssignDepartmentDialog;
