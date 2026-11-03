import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Card from "@mui/material/Card";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDInput from "components/MDInput";
import MDButton from "components/MDButton";
import BasicLayout from "layouts/authentication/components/BasicLayout";
import bgImage from "assets/images/bg-sign-in-basic.jpeg";
import { useLocation } from "react-router-dom";
import { useFetchDocumentsQuery } from "api/auth/documentApi";
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel,
} from "@mui/material";
import ESignatureDialog from "layouts/authentication/ESignatureDialog";
import { useUpdateDocumentMutation } from "api/auth/editDocumentApi";
import { useFetchDocumentTypesQuery } from "api/auth/documentApi";
import { useFetchWorkflowsQuery } from "api/auth/workflowApi";
import { useDepartmentWiseReviewerQuery } from "api/auth/documentApi";
import { useFetchAllDocumentsQuery } from "api/auth/documentApi";
import { useViewTemplateQuery } from "api/auth/documentApi";
useViewTemplateQuery;
function EditDocument() {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [revisionTime, setRevisionTime] = useState("");
  const [operations, setOperations] = useState("Upload files");
  const [workflow, setWorkflow] = useState("");
  const [trainingRequired, setTrainingRequired] = useState("");
  const [templateFile, setTemplateFile] = useState(null);
  console.log("---------------------------------------",templateFile)
  const [errors, setErrors] = useState({});
  const [openSignatureDialog, setOpenSignatureDialog] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [revisionMonth, setRevisionMonth] = useState("");
  const [parentDocument, setParentDocument] = useState("");
  const [template, setTemplate] = useState("");
  const location = useLocation();
  const { item } = location.state;
  const navigate = useNavigate();
  const id = item.id;
 
  // const { data: documentDetails, isLoading: documentDetailsLoading } = useFetchDocumentsQuery(2);
  const [updateDocument] = useUpdateDocumentMutation(id);
  const { data: documentTypesData, isLoading: documentTypesLoading } = useFetchDocumentTypesQuery();
  const { data: workflowsData, isLoading: workflowsLoading } = useFetchWorkflowsQuery();
  const { data: userdata, isLoading: isUsersLoading } = useDepartmentWiseReviewerQuery();
  const { data: alldocument } = useFetchAllDocumentsQuery();
  const { data: templateData } = useViewTemplateQuery();
  const users = userdata || [];
  
  
  useEffect(() => {
    if (item) {
      setTitle(item.document_title || "");
      setType(item.document_type || "");
      setDescription(item.document_description || "");
      setRevisionMonth(item.revision_month || "");
      setOperations(item.document_operation || "Upload files");
      setWorkflow(item.workflow || "");
      setTrainingRequired(item.training_required ? "Yes" : "No");
      setTemplate(item.select_template || "");
      setTemplateFile(item.selected_template_url || null);
    }
  }, [item]);

  // Validation
  const validateInputs = () => {
    const newErrors = {};
    if (!title.trim()) newErrors.title = "Title is required.";
    if (!type) newErrors.type = "Document type is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  // Form Submission
  const handleSubmit = (e) => {
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
    const documentData = {
      document_id: id,  // Include the document ID
      document_title: title, // Use the updated state value
      document_type: type,
      document_description: description,
      revision_month: revisionMonth,
      document_operation: operations,
      select_template: templateFile,
      workflow: workflow,
      training_required: trainingRequired.toLowerCase() === "yes",
    };
    try {
      await updateDocument(documentData).unwrap(); 
      console.log("Document updated successfully!");
      toast.success("Document updated successfully!");
      setTimeout(() => navigate("/document-listing"), 1500);
    } catch (error) {
      console.error("Error updating document:", error);
      toast.error("Failed to update document. Please try again.");
    }
  };
  
  

  const handleRevisionMonthChange = (e) => {
    const monthsToAdd = parseInt(e.target.value, 10);

    if (isNaN(monthsToAdd) || monthsToAdd <= 0) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        revisionMonth: "Please enter a valid positive number.",
      }));
      return;
    }

    setErrors((prevErrors) => ({ ...prevErrors, revisionMonth: undefined }));

    const currentDate = new Date();
    currentDate.setMonth(currentDate.getMonth() + monthsToAdd);

    const formattedDate = currentDate.toISOString().split("T")[0];

    setRevisionMonth(monthsToAdd);
    setRevisionTime(formattedDate);
  };

  const handleClear = () => {
    setTitle("");
    setType("");

    setDescription("");
    setRevisionTime("");
    setOperations("Upload files");
    setWorkflow("");
    setTrainingRequired("No");
    setTemplateFile(null);
    setErrors({});
  };

  const handleFileChange = (e) => {
    setTemplateFile(e.target.files[0]);
  };

  return (
    <BasicLayout image={bgImage} showNavbarFooter={false}>
      <Card sx={{ width: 600, mx: "auto", marginTop: 10, marginBottom: 10 }}>
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
            Edit Document
          </MDTypography>
        </MDBox>
        <MDBox mt={2} mb={1} display="flex" justifyContent="flex-end">
          <MDButton
            variant="outlined"
            color="error"
            size="small"
            onClick={handleClear}
            sx={{ marginRight: "20px" }}
          >
            Clear
          </MDButton>
        </MDBox>
        <MDBox pb={3} px={3}>
          <MDBox component="form" role="form" onSubmit={handleSubmit} sx={{ padding: 3 }}>
            <MDBox mb={3}>
              <MDInput
                type="text"
                label="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                fullWidth
              />
            </MDBox>
            <MDBox mb={3}>
              <FormControl fullWidth margin="dense">
                <InputLabel id="select-type-label">Type</InputLabel>
                <Select
                  labelId="select-type-label"
                  id="select-type"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  input={<OutlinedInput label="Type" />}
                  sx={{
                    minWidth: 200,
                    height: "3rem",
                    ".MuiSelect-select": { padding: "0.45rem" },
                  }}
                  disabled={documentTypesLoading}
                >
                  {documentTypesLoading ? (
                    <MenuItem disabled>Loading...</MenuItem>
                  ) : (
                    documentTypesData?.map((docType) => (
                      <MenuItem key={docType.id} value={docType.id}>
                        {docType.document_name}
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            </MDBox>
            <MDBox mb={3}>
              <FormControl fullWidth margin="dense">
                <InputLabel id="select-parent-doc-label">Parent Document</InputLabel>
                <Select
                  labelId="select-parent-doc-label"
                  id="select-parent-doc"
                  value={parentDocument}
                  onChange={(e) => setParentDocument(e.target.value)} // Update parent document when selected
                  input={<OutlinedInput label="Parent Document" />}
                  sx={{
                    minWidth: 200,
                    height: "3rem",
                    ".MuiSelect-select": { padding: "0.45rem" },
                  }}
                  disabled={type === 1} // Disable Parent Document dropdown if Type is 1
                >
                  {alldocument?.map((doc) => (
                    <MenuItem key={doc.id} value={doc.id}>
                      {doc.document_title} {/* Display document title */}
                    </MenuItem>
                  ))}
                </Select>

                {/* Show message when Parent Document is not required */}
                {type === 1 && (
                  <p style={{ color: "gray", fontSize: "0.75rem", marginTop: "4px" }}>
                    Parent Document is not required for this type.
                  </p>
                )}
              </FormControl>
            </MDBox>
            <MDBox mb={3}></MDBox>
            <MDBox mb={3}>
              <MDInput
                type="text"
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                fullWidth
              />
            </MDBox>
            <MDBox mb={3}>
              <MDInput
                type="number"
                label="Revision Month"
                value={revisionMonth}
                onChange={handleRevisionMonthChange} // Use the new handler
                error={Boolean(errors.revisionMonth)}
                helperText={errors.revisionMonth}
                fullWidth
                inputProps={{
                  min: 1,
                }}
              />
            </MDBox>
            <MDBox mb={3} display="flex" alignItems="center">
              <FormLabel
                component="legend"
                style={{ fontSize: "0.875rem", color: "black", marginRight: "16px" }}
              >
                Operations
              </FormLabel>
              <RadioGroup row value={operations} onChange={(e) => setOperations(e.target.value)}>
                <FormControlLabel
                  value="Create online"
                  control={<Radio disabled />}
                  label="Create online"
                />
                <FormControlLabel value="Upload files" control={<Radio />} label="Upload files" />
              </RadioGroup>
            </MDBox>

            <MDBox mb={3}>
              <MDInput
                type="file"
                label="Upload Template File"
                fullWidth
                onChange={handleFileChange}
                InputLabelProps={{ shrink: true }}
                inputProps={{ accept: ".pdf,.docx,.txt" }}
              />
            </MDBox>

            <MDBox mb={3}>
              <FormControl fullWidth margin="dense">
                <InputLabel id="select-workflow-label">Workflow</InputLabel>
                <Select
                  labelId="select-workflow-label"
                  id="select-workflow"
                  value={workflow}
                  onChange={(e) => setWorkflow(e.target.value)}
                  input={<OutlinedInput label="Workflow" />}
                  sx={{
                    minWidth: 200,
                    height: "3rem",
                    ".MuiSelect-select": { padding: "0.45rem" },
                  }}
                  disabled={workflowsLoading}
                >
                  {workflowsLoading ? (
                    <MenuItem disabled>Loading...</MenuItem>
                  ) : (
                    workflowsData?.map((flow) => (
                      <MenuItem key={flow.id} value={flow.id}>
                        {flow.workflow_name}
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            </MDBox>
            {/* <MDBox mb={3}>
              <FormControl fullWidth margin="dense">
                <InputLabel id="select-template-label">Select Template</InputLabel>
                <Select
                  labelId="select-template-label"
                  id="select-template"
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                  input={<OutlinedInput label="Select Template" />}
                  sx={{
                    minWidth: 200,
                    height: "3rem",
                    ".MuiSelect-select": { padding: "0.45rem" },
                  }}
                >
                  {templateData?.map((templateItem) => (
                    <MenuItem key={templateItem.id} value={templateItem.id}>
                      {templateItem.template_name}
                    </MenuItem>
                  ))}
                </Select>
                {errors.template && (
                  <p style={{ color: "red", fontSize: "0.75rem", marginTop: "4px" }}>
                    {errors.template}
                  </p>
                )}
              </FormControl>
            </MDBox> */}
            <MDBox mb={3} display="flex" alignItems="center">
              <FormLabel
                component="legend"
                style={{ fontSize: "0.875rem", color: "black", marginRight: "16px" }}
              >
                Training Required
              </FormLabel>
              <RadioGroup
                row
                value={trainingRequired}
                onChange={(e) => setTrainingRequired(e.target.value)}
              >
                <FormControlLabel value="Yes" control={<Radio />} label="Yes" />
                <FormControlLabel value="No" control={<Radio />} label="No" />
              </RadioGroup>
            </MDBox>
            <MDBox mt={4}>
              <MDButton variant="gradient" color="submit" fullWidth type="submit">
                Update
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

      {/* Toast Container */}
      {/* <ToastContainer position="top-right" autoClose={3000} /> */}
    </BasicLayout>
  );
}

export default EditDocument;
