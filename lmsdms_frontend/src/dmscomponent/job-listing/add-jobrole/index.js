// AddJobRole.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "@mui/material/Card";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDInput from "components/MDInput";
import MDButton from "components/MDButton";
import BasicLayout from "layouts/authentication/components/BasicLayout";
import bgImage from "assets/images/bg-sign-in-basic.jpeg";
import ESignatureDialog from "layouts/authentication/ESignatureDialog";
import { useCreateJobRoleMutation } from "apilms/jobRoleApi";
import { toast, ToastContainer } from "react-toastify";
import { FormHelperText } from "@mui/material";

import {
  IconButton,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
} from "@mui/material";
import { useGetPlantQuery } from "apilms/plantApi";
import { useGetAreaQuery } from "apilms/AreaApi";
import { useFetchDepartmentsQuery } from "api/auth/departmentApi";

function AddJobRole() {
  const { data: plantData } = useGetPlantQuery();
  const { data: areaData, isLoading: areaLoading, error: areaError } = useGetAreaQuery();
  const { data: departmentData, isLoading: isDepartmentsLoading } = useFetchDepartmentsQuery();
  const [title, setTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [openSignatureDialog, setOpenSignatureDialog] = useState(false);
  const [errors, setErrors] = useState({});
  const [selectedPlant, setSelectedPlant] = useState(""); // State for selected plant
  const [selectedArea, setSelectedArea] = useState(""); // State for selected area
  const [selectedDepartment, setSelectedDepartment] = useState(""); // State for selected department
  const navigate = useNavigate();
  const [createJobRole] = useCreateJobRoleMutation();
  const validateInputs = () => {
    const newErrors = {};

    if (!title.trim()) newErrors.title = "Job Role Title is required.";
    // if (!jobDescription.trim()) newErrors.jobDescription = "Job Description is required.";
    // if (!selectedPlant) newErrors.selectedPlant = "Plant selection is required.";
    // if (!selectedArea) newErrors.selectedArea = "Area selection is required.";
    if (!selectedDepartment) newErrors.selectedDepartment = "Department selection is required.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateInputs()) return;
    setOpenSignatureDialog(true);
  };
  const handleSignatureComplete = async (password) => {
    setOpenSignatureDialog(false);

    if (!password) {
      toast.error("E-Signature is required to proceed.");
      return;
    }

    try {
      await createJobRole({
        job_role_name: title.trim(),
        job_role_description: jobDescription.trim(),
        plant: selectedPlant,
        area: selectedArea,
        department: selectedDepartment,
      }).unwrap();

      toast.success("Job Role added successfully!");
      setTimeout(() => {
        navigate("/jobrole-listing");
      }, 1500);
    } catch (error) {
      console.error("Error submitting job role:", error);
      toast.error("Failed to add job role. Please try again.");
    }
  };
  const handleClear = () => {
    setTitle("");
    setJobDescription("");
    setErrors({});
    setSelectedDepartment("");
    setSelectedPlant("");
    setSelectedArea("");
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
            Add Job Role
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
                label="Job Role Title"
                fullWidth
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                error={!!errors.title}
                helperText={errors.title}
              />
            </MDBox>
            <MDBox mb={3}>
              <MDInput
                label="Job Description"
                multiline
                rows={4}
                fullWidth
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                // error={!!errors.jobDescription}
                helperText={errors.jobDescription}
              />
            </MDBox>
            <MDBox mb={3}>
              <FormControl fullWidth>
                <InputLabel id="select-plant-label">Plant Name</InputLabel>
                <Select
                  labelId="select-plant-label"
                  id="select-plant"
                  value={selectedPlant}
                  onChange={(e) => setSelectedPlant(e.target.value)}
                  input={<OutlinedInput label="Plant Name" />}
                  // error={!!errors.selectedPlant}
                  sx={{
                    minWidth: 200,
                    height: "3rem",
                    ".MuiSelect-select": { padding: "0.45rem" },
                  }}
                >
                  {plantData?.data?.map((plant) => (
                    <MenuItem key={plant.id} value={plant.id}>
                      {plant.plant_name}
                    </MenuItem>
                  ))}
                </Select>
                {errors.selectedPlant && <FormHelperText>{errors.selectedPlant}</FormHelperText>}
              </FormControl>
            </MDBox>

            {/* Area Dropdown */}
            <MDBox mb={3}>
              <FormControl fullWidth>
                <InputLabel id="select-area-label">Select Area</InputLabel>
                <Select
                  labelId="select-area-label"
                  id="select-area"
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                  input={<OutlinedInput label="Select Area" />}
                  // error={!!errors.selectedArea}
                  sx={{
                    minWidth: 200,
                    height: "3rem",
                    ".MuiSelect-select": { padding: "0.45rem" },
                  }}
                >
                  {areaLoading ? (
                    <MenuItem disabled>Loading...</MenuItem>
                  ) : areaError ? (
                    <MenuItem disabled>Error loading areas</MenuItem>
                  ) : areaData?.data?.length > 0 ? (
                    areaData.data.map((area) => (
                      <MenuItem key={area.id} value={area.id}>
                        {area.area_name}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled>No areas available</MenuItem>
                  )}
                </Select>
                {errors.selectedArea && <FormHelperText>{errors.selectedArea}</FormHelperText>}
              </FormControl>
            </MDBox>

            {/* Department Dropdown */}
            <MDBox mb={3}>
              <FormControl fullWidth>
                <InputLabel>Department</InputLabel>
                <Select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  label="Department"
                  // error={!!errors.selectedDepartment}
                  helperText={errors.selectedDepartment}
                  sx={{
                    minWidth: 200,
                    height: "3rem",
                    ".MuiSelect-select": { padding: "0.45rem" },
                  }}
                >
                  {departmentData?.map((department) => (
                    <MenuItem key={department.id} value={department.id}>
                      {department.department_name}
                    </MenuItem>
                  ))}
                </Select>
                {errors.selectedDepartment && (
                  <FormHelperText>{errors.selectedDepartment}</FormHelperText>
                )}
              </FormControl>
            </MDBox>

            <MDBox mt={2} mb={1}>
              <MDButton variant="gradient" color="submit" fullWidth type="submit">
                Submit
              </MDButton>
            </MDBox>
          </MDBox>
        </MDBox>
      </Card>
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

export default AddJobRole;
