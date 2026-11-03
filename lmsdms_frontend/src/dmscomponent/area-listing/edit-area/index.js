import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import Card from "@mui/material/Card";
import MenuItem from "@mui/material/MenuItem";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDInput from "components/MDInput";
import MDButton from "components/MDButton";
import BasicLayout from "layouts/authentication/components/BasicLayout";
import bgImage from "assets/images/bg-sign-in-basic.jpeg";
import ESignatureDialog from "layouts/authentication/ESignatureDialog";
import { FormControl, InputLabel, Select, OutlinedInput } from "@mui/material";
import { useUpdateDeleteAreaMutation } from "apilms/AreaApi";
import { useFetchDepartmentsQuery } from "api/auth/departmentApi";

function EditArea() {
  const [areaName, setAreaName] = useState("");
  const [departmentName, setDepartmentName] = useState("");
  const [description, setDescription] = useState("");
  const [openSignatureDialog, setOpenSignatureDialog] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const { state } = useLocation();
  
  const { data: departments, isLoading, isError } = useFetchDepartmentsQuery();
  const [updateArea, { isLoading: isUpdating }] = useUpdateDeleteAreaMutation();

  useEffect(() => {
    if (state?.area) {
      const { id, area_name, department, area_description } = state.area;
      setAreaName(area_name);
      setDepartmentName(department);
      setDescription(area_description);
    }
  }, [state]);

  const validateInputs = () => {
    const newErrors = {};
    if (!areaName.trim()) newErrors.areaName = "Area Name is required.";
    if (!departmentName) newErrors.departmentName = "Department Name is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateInputs()) {
      toast.error("Please fill all required fields.");
      return;
    }
    setOpenSignatureDialog(true);
  };

  const handleSignatureComplete = async (password) => {
    setOpenSignatureDialog(false);
    if (!password) {
      toast.error("E-Signature is required to proceed.");
      return;
    }
    try {
      await updateArea({
        id: state.area.id, // Ensure the correct area is updated
        area_name: areaName,
        department_id: departmentName,
        area_description: description,
      }).unwrap();

      toast.success("Area details updated successfully!");
      navigate("/area-listing");
    } catch (error) {
      toast.error("Failed to update area. Please try again.");
      console.error("Error updating area:", error);
    }
  };

  const handleClear = () => {
    setAreaName("");
    setDepartmentName("");
    setDescription("");
  };

  if (isLoading) return <div>Loading departments...</div>;
  if (isError) return <div>Error fetching departments</div>;

  return (
    <BasicLayout image={bgImage} showNavbarFooter={false}>
      <Card sx={{ width: 600, mx: "auto" }}>
        <MDBox
          borderRadius="lg"
          sx={{
            background: "linear-gradient(212deg, #d5b282, #f5e0c3)",
            mx: 2,
            mt: -3,
            p: 2,
            mb: 1,
            textAlign: "center",
          }}
        >
          <MDTypography variant="h3" fontWeight="medium" color="#344767" mt={1}>
            Edit Area
          </MDTypography>
        </MDBox>

        <MDBox pb={3} px={3}>
          <MDBox component="form" role="form" onSubmit={handleSubmit} sx={{ padding: 3 }}>
            <MDBox mb={3}>
              <MDInput
                type="text"
                label="Area Name"
                fullWidth
                value={areaName}
                onChange={(e) => setAreaName(e.target.value)}
                error={!!errors.areaName}
                helperText={errors.areaName}
              />
            </MDBox>
            <MDBox mb={3}>
              <FormControl fullWidth margin="dense" error={!!errors.departmentName}>
                <InputLabel id="select-department-label">Department Name</InputLabel>
                <Select
                  labelId="select-department-label"
                  id="select-department"
                  value={departmentName}
                  onChange={(e) => setDepartmentName(e.target.value)}
                  input={<OutlinedInput label="Department Name" />}
                  sx={{
                    minWidth: 200,
                    height: "3rem",
                    ".MuiSelect-select": {
                      padding: "0.75rem",
                    },
                  }}
                >
                  {departments?.length > 0 ? (
                    departments.map((dept) => (
                      <MenuItem key={dept.id} value={dept.id}>
                        {dept.department_name}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled>No departments available</MenuItem>
                  )}
                </Select>
              </FormControl>
            </MDBox>
            <MDBox mb={3}>
              <MDInput
                label="Description"
                multiline
                rows={4}
                fullWidth
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </MDBox>
            <MDBox mt={2} mb={1}>
              <MDButton variant="gradient" color="submit" fullWidth type="submit" disabled={isUpdating}>
                {isUpdating ? "Updating..." : "Update"}
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
    </BasicLayout>
  );
}

export default EditArea;
