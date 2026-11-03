import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, MenuItem, Select, InputLabel, FormControl, OutlinedInput } from "@mui/material";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDInput from "components/MDInput";
import MDButton from "components/MDButton";
import BasicLayout from "layouts/authentication/components/BasicLayout";
import bgImage from "assets/images/bg-sign-in-basic.jpeg";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ESignatureDialog from "layouts/authentication/ESignatureDialog";
import { useFetchDepartmentsQuery } from "api/auth/departmentApi"; // API call for fetching departments
import { useCreateGetInductionMutation } from "apilms/InductionApi";

const AddInductionTraining = () => {
  const [inductionTitle, setInductionTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [document, setDocument] = useState(null);
  const [openSignatureDialog, setOpenSignatureDialog] = useState(false);
  const [errors, setErrors] = useState({}); 
  const { data: departments, isLoading: deptLoading } = useFetchDepartmentsQuery();
  const navigate = useNavigate();
  const [createInduction]=useCreateGetInductionMutation();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/pdf") {
      setDocument(file);
      setErrors((prevErrors) => ({ ...prevErrors, document: "" }));
    } else {
      setDocument(null);
      setErrors((prevErrors) => ({ ...prevErrors, document: "Only PDF files are allowed." }));
      toast.error("Only PDF files are allowed.");
    }
  };

  const validateInputs = () => {
    const newErrors = {};
    if (!inductionTitle.trim()) newErrors.inductionTitle = "Induction Title is required.";
    if (!department) newErrors.department = "Department is required.";
    if (!document) {
      newErrors.document = "Document is required.";
    } else if (document.type !== "application/pdf") {
      newErrors.document = "Only PDF files are allowed.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateInputs()) return;
    setOpenSignatureDialog(true);
  };

  const handleClear = () => {
    setInductionTitle("");
    setDepartment("");
    setDocument(null);
  };

  const handleSignatureComplete = async (password) => {
    setOpenSignatureDialog(false);
    if (!password) {
      toast.error("E-Signature is required to proceed.");
      return;
    }

    try {
      const inductiondata = new FormData();
      inductiondata.append("induction_name", inductionTitle.trim());
      inductiondata.append("department", department);
      inductiondata.append("document", document);

      const response = await createInduction(inductiondata).unwrap();

      if (response.status) {
        toast.success("Induction Training added successfully!");
        setTimeout(() => {
          navigate("/induction-listing");
        }, 1500);
      } else {
        toast.error(response.message || "Failed to add Induction Training. Please try again.");
      }
    } catch (error) {
      console.error("Error adding induction training:", error);
      toast.error("An error occurred while adding the Induction Training.");
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
            Add Induction Set Name
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
                <InputLabel id="department-label"
                ><span style={{ color: "red" }}>*</span>Department</InputLabel>
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
                inputProps={{ accept: "application/pdf" }}
              />
            </MDBox>

            <MDBox mt={2} mb={1}>
              <MDButton variant="gradient" color="submit" fullWidth type="submit">
                Submit
              </MDButton>
            </MDBox>
          </MDBox>
        </MDBox>
      </Card>

      <ESignatureDialog open={openSignatureDialog} onClose={() => setOpenSignatureDialog(false)} onConfirm={handleSignatureComplete} />
    </BasicLayout>
  );
};

export default AddInductionTraining;