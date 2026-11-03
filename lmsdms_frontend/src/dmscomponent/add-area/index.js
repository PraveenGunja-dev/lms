import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
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
import { useCreateGetAreaMutation } from "apilms/AreaApi";
import { useFetchDepartmentsQuery } from "api/auth/departmentApi";

function AddArea() {
  const [areaName, setAreaName] = useState("");
  const [departmentName, setDepartmentName] = useState("");
  const [description, setDescription] = useState("");
  const [openSignatureDialog, setOpenSignatureDialog] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const { data: departments, isLoading, isError } = useFetchDepartmentsQuery();
  const [createArea, { isLoading: isCreating }] = useCreateGetAreaMutation();
  const validateInputs = () => {
    const newErrors = {};
    if (!areaName.trim()) newErrors.areaName = "Area Name is required.";
    if (!departmentName) newErrors.departmentName = "Department Name is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateInputs()) return;
    setOpenSignatureDialog(true);
  };
  const handleClear = () => {
    setAreaName("");
    setDepartmentName("");
    setDescription("");
    setErrors({});
  };
  const handleSignatureComplete = async (password) => {
    setOpenSignatureDialog(false);
    if (!password) {
      toast.error("E-Signature is required to proceed.");
      return;
    }
    try {
      await createArea({
        area_name: areaName.trim(),
        department_id: departmentName,
        area_description: description.trim(),
      }).unwrap();
      toast.success("Area added successfully!");
      setTimeout(() => {
        navigate("/area-listing");
      }, 1500);
    } catch (error) {
      console.error("Error submitting area:", error);
      toast.error("Failed to add area. Please try again.");
    }
  };
  const handleDepartmentChange = (event) => {
    setDepartmentName(event.target.value);
  };
  if (isLoading) return <div>Loading departments...</div>;
  if (isError) return <div>Error fetching departments</div>;
  return (
    <BasicLayout image={bgImage} showNavbarFooter={false}>
      <Card sx={{ width: 600, mx: "auto" , mt:5 , mb:5}}>
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
            Add Area
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
                label={<><span style={{ color: "red" }}>*</span>Area Name</>}
                fullWidth
                value={areaName}
                onChange={(e) => setAreaName(e.target.value)}
                error={!!errors.areaName}
                helperText={errors.areaName}
              />
            </MDBox>

            <MDBox mb={3}>
              <FormControl fullWidth margin="dense">
                <InputLabel id="select-department-label">
                  <><span style={{ color: "red" }}>*</span>Department Name</>
                </InputLabel>
                <Select
                  labelId="select-department-label"
                  id="select-department"
                  value={departmentName}
                  onChange={handleDepartmentChange}
                  input={<OutlinedInput label="Department Name" />}
                  sx={{
                    minWidth: 200,
                    height: "3rem",
                    ".MuiSelect-select": { padding: "0.45rem" },
                  }}
                >
                  {departments?.length > 0
                    ? departments.map((dept) => (
                        <MenuItem key={dept.id} value={dept.id}>
                          {dept.department_name}
                        </MenuItem>
                      ))
                    : <MenuItem disabled>No Departments Available</MenuItem>}
                </Select>
                {errors.departmentName && (
                  <p style={{ color: "red", fontSize: "0.75rem", marginTop: "4px" }}>
                    {errors.departmentName}
                  </p>
                )}
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
              <MDButton
                variant="gradient"
                color="submit"
                fullWidth
                type="submit"
                disabled={isCreating}
              >
                {isCreating ? "Submitting..." : "Submit"}
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
     
    </BasicLayout>
  );
}

export default AddArea;
