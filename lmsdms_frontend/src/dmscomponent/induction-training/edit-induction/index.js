import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, MenuItem, Select, InputLabel, FormControl, OutlinedInput } from "@mui/material";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDInput from "components/MDInput";
import MDButton from "components/MDButton";
import BasicLayout from "layouts/authentication/components/BasicLayout";
import bgImage from "assets/images/bg-sign-in-basic.jpeg";
import ESignatureDialog from "layouts/authentication/ESignatureDialog";
import { useUpdateDeleteInductionMutation } from "apilms/InductionApi";
import { useFetchDepartmentsQuery } from "api/auth/departmentApi";

const EditInduction = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const inductionId=state?.induction?.id
  const [inductionTitle, setInductionTitle] = useState(state?.induction?.induction_name || "");
  const [department, setDepartment] = useState(state?.induction?.department || "");
  const [document, setDocument] = useState(null);
  const [openSignatureDialog, setOpenSignatureDialog] = useState(false);
  const [errors, setErrors] = useState({});
  const { data: departments, isLoading: deptLoading } = useFetchDepartmentsQuery();
  const [updateInduction, { isLoading }] = useUpdateDeleteInductionMutation();

  const validateInputs = () => {
    const newErrors = {};
    if (!inductionTitle.trim()) newErrors.inductionTitle = "Induction Title is required.";
    if (!department) newErrors.department = "Department is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
  
    if (file) {
      if (file.type !== "application/pdf") {
        toast.error("Only PDF files are allowed!", { position: "top-right" });
        setDocument(null);
        return;
      }
      setDocument(file);
    }
  };  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateInputs()) return;
    setOpenSignatureDialog(true);
  };

  const handleClear = () => {
    setInductionTitle("");
    setDepartment("");
    setDocument(null);
    setErrors({});
  };

  const handleSignatureComplete = async (password) => {
    setOpenSignatureDialog(false);
    if (!password) {
      toast.error("E-Signature is required to proceed.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("induction_id", state?.induction?.id);
      formData.append("induction_name", inductionTitle.trim());
      formData.append("department", department);
      if (document) formData.append("document", document);
      
      const response = await updateInduction(formData).unwrap();
      
      if (response.status) { 
        toast.success("Induction updated successfully!");
        setTimeout(() => navigate("/induction-listing"), 1500);
      } else {
        toast.error(response.message || "Failed to update induction. Please try again.");
      }
    } catch (error) {
      console.error("Error updating induction:", error);
      toast.error("An error occurred while updating the induction.");
    }
  };

  return (
    <BasicLayout image={bgImage} showNavbarFooter={false}>
      <Card sx={{ width: 600, mx: "auto" }}>
        <MDBox borderRadius="lg" sx={{
          background: "linear-gradient(212deg, #d5b282, #f5e0c3)",
          mx: 2, mt: -3, p: 2, mb: 1, textAlign: "center",
        }}>
          <MDTypography variant="h3" fontWeight="medium" color="#344767" mt={1}>
            Edit Induction Set
          </MDTypography>
        </MDBox>

        <MDBox mt={2} mb={1} display="flex" justifyContent="flex-end">
          <MDButton variant="outlined" color="error" size="small" onClick={handleClear}>
            Clear
          </MDButton>
        </MDBox>

        <MDBox pb={3} px={3}>
          <MDBox component="form" role="form" onSubmit={handleSubmit} sx={{ padding: 3 }}>
            <MDBox mb={3}>
              <MDInput
                type="text"
                label={<><span style={{ color: "red" }}>*</span> Induction Set Name</>}
                fullWidth
                value={inductionTitle}
                onChange={(e) => setInductionTitle(e.target.value)}
                error={!!errors.inductionTitle}
                helperText={errors.inductionTitle}
              />
            </MDBox>

            <MDBox mb={3}>
              <FormControl fullWidth error={!!errors.department}>
                <InputLabel><span style={{ color: "red" }}>*</span>Department</InputLabel>
                <Select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  input={<OutlinedInput label="Department" />}
                  sx={{
                    minWidth: 200,
                    height: "3rem",
                    ".MuiSelect-select": { padding: "0.5rem" },
                  }}
                >
                  {deptLoading ? (
                    <MenuItem disabled>Loading...</MenuItem>
                  ) : (
                    departments?.map((dept) => (
                      <MenuItem key={dept.id} value={dept.id}>
                        {dept.department_name}
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            </MDBox>
            <MDBox mb={3}>
              <MDInput
                type="file"
                fullWidth
                onChange={handleFileChange}
                error={!!errors.document}
                helperText={errors.document}
              />
            </MDBox>
            <MDBox mt={2} mb={1}>
              <MDButton variant="gradient" color="submit" fullWidth type="submit" disabled={isLoading}>
                {isLoading ? "Updating..." : "Save Changes"}
              </MDButton>
            </MDBox>
          </MDBox>
        </MDBox>
      </Card>

      <ESignatureDialog open={openSignatureDialog} onClose={() => setOpenSignatureDialog(false)} onConfirm={handleSignatureComplete} />
    </BasicLayout>
  );
};

export default EditInduction;
