import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Card from "@mui/material/Card";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDInput from "components/MDInput";
import MDButton from "components/MDButton";
import BasicLayout from "layouts/authentication/components/BasicLayout";
import bgImage from "assets/images/bg-sign-in-basic.jpeg";
import ESignatureDialog from "layouts/authentication/ESignatureDialog";
import {
  FormControl,
  FormHelperText,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel,
} from "@mui/material";
import {
  useCreateDocumentMutation,
  useFetchDocumentTypesQuery,
  useViewTemplateQuery,
  useDepartmentWiseReviewerQuery,
  useFetchAllDocumentsQuery,
} from "api/auth/documentApi";
import { useFetchWorkflowsQuery } from "api/auth/workflowApi";
import { useFetchDepartmentsQuery } from "api/auth/departmentApi";
import { getErrorMessage } from "services/baseQuery";

function AddDocument() {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [description, setDescription] = useState("");
  const [revisionMonth, setRevisionMonth] = useState("");
  const [revisionTime, setRevisionTime] = useState("");
  const [workflow, setWorkflow] = useState("");
  const [trainingRequired, setTrainingRequired] = useState("No");
  const [template, setTemplate] = useState("");
  const [operations, setOperations] = useState("Create online");
  const [openSignatureDialog, setOpenSignatureDialog] = useState(false);
  const [createDocument] = useCreateDocumentMutation();
  // const [selectedUsers, setSelectedUsers] = useState([]);
  const [parentDocument, setParentDocument] = useState("");
  const navigate = useNavigate();
  const isSopSelected = type === 1;
  const { data: documentTypesData } = useFetchDocumentTypesQuery();
  const { data: alldocument } = useFetchAllDocumentsQuery();
  const { data: templateData } = useViewTemplateQuery();
  const {
    data: workflowsData,
    isLoading: workflowsLoading,
    error: workflowsError,
  } = useFetchWorkflowsQuery();
  const [equipmentId, setEquipmentId] = useState("");
  const [productCode, setProductCode] = useState("");

  // const { data: userdata, isLoading, error } = useDepartmentWiseReviewerQuery();
  // const users = userdata || [];
  const { data: departments, isLoading, isError } = useFetchDepartmentsQuery();
  const [selectedUser, setSelectedUser] = useState("");
  const [errors, setErrors] = useState({});
  console.log(">>>>",departments)
  // const validateInputs = () => {
  //   const newErrors = {};

  //   if (!title.trim()) newErrors.title = "Title is required.";
  //   if (!type || (typeof type === "string" && type.trim() === "")) {
  //     newErrors.type = "Type is required.";
  //   }
  //   // if (!documentNumber.trim()) newErrors.documentNumber = "Document number is required.";
  //   if (!description.trim()) newErrors.description = "Description is required.";
  //   if (!revisionMonth || revisionMonth <= 0) {
  //     newErrors.revisionMonth = "Revision month must be a positive number.";
  //   }

  //   if (!revisionTime) {
  //     setErrors({ revisionTime: "Revision Date  is required" });
  //     return;
  //   }
  //   if (!workflow || (typeof workflow === "string" && workflow.trim() === "")) {
  //     newErrors.workflow = "Workflow is required.";
  //   }
  //   if (!template || (typeof template === "string" && template.trim() === "")) {
  //     newErrors.template = "Template is required.";
  //   }

  //   setErrors(newErrors);
  //   return Object.keys(newErrors).length === 0;
  // };
  const validateInputs = () => {
    const newErrors = {};
    if (!title.trim()) newErrors.title = "Title is required.";
    if (!type) newErrors.type = "Type is required.";
    if (!description.trim()) newErrors.description = "Description is required.";
    if (!revisionMonth || revisionMonth <= 0)
      newErrors.revisionMonth = "Revision month must be a positive number.";
    if (!workflow) newErrors.workflow = "Workflow is required.";
    if (!template) newErrors.template = "Template is required.";
    if (!departmentId) newErrors.department = "Department is required.";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      toast.error("Please fill all required fields.");
      return false;
    }
    return true;
  };
  const handleDateChange = (e) => {
    const selectedDate = new Date(e.target.value);
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      setErrors({ revisionTime: "You can't revise in the past" });
    } else {
      setErrors((prevErrors) => ({ ...prevErrors, revisionTime: undefined }));
      setRevisionTime(e.target.value);
    }
  };
  const handleRevisionMonthChange = (e) => {
    const value = e.target.value;

    // Allow empty input for backspacing
    if (value === "") {
      setRevisionMonth(""); // Let user delete input
      setErrors((prevErrors) => ({ ...prevErrors, revisionMonth: undefined })); // Clear error
      return;
    }

    const monthsToAdd = parseInt(value, 10);

    // Allow only non-negative numbers
    if (isNaN(monthsToAdd) || monthsToAdd < 0) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        revisionMonth: "Please enter a valid positive number or 0.",
      }));
      return;
    }

    // Clear previous errors if valid
    setErrors((prevErrors) => ({ ...prevErrors, revisionMonth: undefined }));

    const currentDate = new Date();

    if (monthsToAdd === 0) {
      setRevisionTime(currentDate.toISOString().split("T")[0]);
    } else {
      currentDate.setMonth(currentDate.getMonth() + monthsToAdd);
      setRevisionTime(currentDate.toISOString().split("T")[0]);
    }

    // Set the valid input
    setRevisionMonth(value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateInputs()) return;
    setOpenSignatureDialog(true);
  };
  const handleChange = (event) => {
    setSelectedUser(event.target.value);
    if (errors.user) {
      setErrors((prevErrors) => ({ ...prevErrors, user: null }));
    }
  };

  const handleClear = () => {
    setTitle("");
    setType("");
    // setDocumentNumber("");
    setDescription("");
    setRevisionTime("");
    setWorkflow("");
    setTemplate("");
    setTrainingRequired("No");
    setOperations("Create online");
    setDepartmentId("")
    setErrors({});
  };

  const handleSignatureComplete = async (password) => {
    setOpenSignatureDialog(false);

    if (!password) {
      toast.error("E-Signature is required to proceed.");
      return;
    }

    try {
      // Prepare the document data similar to the example you provided
      const documentData = {
        document_title: title.trim(),
        // document_number: documentNumber.trim(),
        document_type: type, // Assuming `type` is already the correct value
        document_description: description.trim(),
        revision_month: revisionMonth,
        revision_date: revisionTime.trim(),
        document_operation: operations, // Assuming `operations` is the right value
        workflow: workflow, // Assuming `workflow` is the correct value
        select_template: template, // Assuming `template` is the right value
        document_current_status_id: 1, // Use the correct ID if needed
        training_required: trainingRequired.toLowerCase() === "yes", // Convert to boolean
        // visible_to_users: selectedUsers, // Assuming selectedUsers is an array
        parent_document: parentDocument,
        // parent_document: [parentDocument],
        department_id: departmentId,
        equipment_id: equipmentId,
        product_code: productCode,
      };

      // Make the API call to create the document
      const response = await createDocument(documentData).unwrap();

      toast.success("Document added successfully!");
      console.log("API Response:", response);

      // Redirect to the document listing page after a delay
      setTimeout(() => {
        navigate("/document-listing");
      }, 1500);
    } catch (error) {
      console.error("Error creating document:", error);
      toast.error(getErrorMessage(error, "Failed to add document. Please try again."));
    }
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
            Add Document
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
                error={Boolean(errors.title)}
                helperText={errors.title}
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
                  onChange={(e) => {
                    const selectedType = e.target.value;
                    setType(selectedType); // Update the type when selected

                    // If the type is set to 1, clear the parent document value
                    if (selectedType === 1) {
                      setParentDocument(""); // Reset parent document when Type is 1
                    }
                  }}
                  input={<OutlinedInput label="Type" />}
                  sx={{
                    minWidth: 200,
                    height: "3rem",
                    ".MuiSelect-select": { padding: "0.45rem" },
                  }}
                >
                  {documentTypesData?.map((docType) => (
                    <MenuItem key={docType.id} value={docType.id}>
                      {docType.document_name}
                    </MenuItem>
                  ))}
                </Select>
                {errors.type && (
                  <p style={{ color: "red", fontSize: "0.75rem", marginTop: "4px" }}>
                    {errors.type}
                  </p>
                )}
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
                  {alldocument?.map((doc) => {
                    if (doc.status == "Effective" || doc.status == "Obsolete") {
                      return null;
                    }
                    return (
                      <MenuItem key={doc.id} value={doc.id}>
                        {doc.document_title}
                      </MenuItem>
                    );
                  })}
                </Select>

                {/* Show message when Parent Document is not required */}
                {type === 1 && (
                  <p style={{ color: "gray", fontSize: "0.75rem", marginTop: "4px" }}>
                    Parent Document is not required for this type.
                  </p>
                )}
              </FormControl>
            </MDBox>
            {/* Equipment ID (Shown when type === 4) */}
            {type === 4 && (
              <MDBox mb={3}>
                <MDInput
                  type="text"
                  label="Equipment ID"
                  value={equipmentId}
                  onChange={(e) => setEquipmentId(e.target.value)}
                  error={Boolean(errors.equipmentId)}
                  helperText={errors.equipmentId}
                  fullWidth
                />
              </MDBox>
            )}

            {/* Product Code (Shown when type === 5, 6, or 7) */}
            {[5, 6, 7].includes(type) && (
              <MDBox mb={3}>
                <MDInput
                  type="text"
                  label="Product Code"
                  value={productCode}
                  onChange={(e) => setProductCode(e.target.value)}
                  error={Boolean(errors.productCode)}
                  helperText={errors.productCode}
                  fullWidth
                />
              </MDBox>
            )}

            {/* <MDBox mb={3}>
              <MDInput
                type="text"
                label="Document Number"
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
                error={Boolean(errors.documentNumber)}
                helperText={errors.documentNumber}
                fullWidth
              />
            </MDBox> */}
<MDBox mb={3}>
  <FormControl fullWidth margin="dense">
    <InputLabel id="select-department-label">Department</InputLabel>
    <Select
      labelId="select-department-label"
      id="select-department"
      value={departmentId}
      onChange={(e) => {
        setDepartmentId(e.target.value);
        if (errors.departmentId) {
          setErrors((prevErrors) => ({ ...prevErrors, departmentId: null }));
        }
      }}
      input={<OutlinedInput label="Department" />}
      sx={{
        minWidth: 200,
        height: "3rem",
        ".MuiSelect-select": { padding: "0.45rem" },
      }}
    >
      {isLoading ? (
        <MenuItem disabled>Loading departments...</MenuItem>
      ) : isError ? (
        <MenuItem disabled>Error loading departments</MenuItem>
      ) : Array.isArray(departments) && departments.length > 0 ? (
        departments.map((dept) => (
          <MenuItem key={dept.id} value={dept.id}>
            {dept.department_name}
          </MenuItem>
        ))
      ) : (
        <MenuItem disabled>No departments available</MenuItem>
      )}
    </Select>
    {errors.departmentId && (
      <p style={{ color: "red", fontSize: "0.75rem", marginTop: "4px" }}>
        {errors.departmentId}
      </p>
    )}
  </FormControl>
</MDBox>
            <MDBox mb={3}>
              <MDInput
                type="text"
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                error={Boolean(errors.description)}
                helperText={errors.description}
                fullWidth
              />
            </MDBox>

            <MDBox mb={3}>
              <MDInput
                type="number"
                label="Revision Month"
                value={revisionMonth}
                onChange={handleRevisionMonthChange}
                error={Boolean(errors.revisionMonth)}
                helperText={errors.revisionMonth}
                fullWidth
                inputProps={{
                  min: 0,
                  style: { appearance: "textfield" }, // Removes number input controls
                  onWheel: (e) => e.target.blur(), // Prevents scroll when focused
                }}
              />
            </MDBox>
            {/* <MDBox mb={3}>
              <MDInput
                type="date"
                value={revisionTime}
                onChange={handleDateChange}
                error={Boolean(errors.revisionTime)}
                fullWidth
                InputLabelProps={{
                  shrink: true,
                }}
                label="Revision Date"
                disabled
              />
              {errors.revisionTime && <FormHelperText>{errors.revisionTime}</FormHelperText>}
            </MDBox> */}

            <MDBox mb={3} display="flex" alignItems="center">
              <FormLabel
                component="legend"
                style={{ fontSize: "0.875rem", color: "black", marginRight: "16px" }}
              >
                Operations
              </FormLabel>
              <RadioGroup row value={operations} onChange={(e) => setOperations(e.target.value)}>
                <FormControlLabel value="Create online" control={<Radio />} label="Create online" />
                <FormControlLabel
                  value="Upload files"
                  control={<Radio />}
                  label="Upload files"
                  disabled
                />
              </RadioGroup>
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
                >
                  {workflowsLoading ? (
                    <MenuItem disabled>Loading...</MenuItem>
                  ) : workflowsError ? (
                    <MenuItem disabled>Error loading workflows</MenuItem>
                  ) : (
                    workflowsData?.map((flow) => (
                      <MenuItem key={flow.id} value={flow.id}>
                        {flow.workflow_name}
                      </MenuItem>
                    ))
                  )}
                </Select>
                {errors.workflow && (
                  <p style={{ color: "red", fontSize: "0.75rem", marginTop: "4px" }}>
                    {errors.workflow}
                  </p>
                )}
              </FormControl>
            </MDBox>
            <MDBox mb={3}>
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
            </MDBox>
            {/* <MDBox mb={3}>
              <FormControl fullWidth margin="dense">
                <InputLabel id="select-user-label">Select Users</InputLabel>
                <Select
                  labelId="select-user-label"
                  id="select-user"
                  multiple // Enable multiple selection
                  value={selectedUsers} // Use an array to hold selected values
                  onChange={(e) => setSelectedUsers(e.target.value)} // Update the handler for multiple selection
                  input={<OutlinedInput label="Select Users" />}
                  sx={{
                    minWidth: 200,
                    height: "3rem",
                    ".MuiSelect-select": { padding: "0.45rem" },
                  }}
                  renderValue={(selected) =>
                    selected
                      .map((userId) => {
                        const user = users.find((u) => u.id === userId);
                        return user?.first_name || userId;
                      })
                      .join(", ")
                  }
                >
                  {users.length > 0 ? (
                    users.map((user) => (
                      <MenuItem key={user.id} value={user.id}>
                        {user.first_name}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled>No users available</MenuItem>
                  )}
                </Select>
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
                Submit
              </MDButton>
            </MDBox>
          </MDBox>
        </MDBox>

        {/* E-Signature Dialog */}
        <ESignatureDialog
          open={openSignatureDialog}
          onClose={() => setOpenSignatureDialog(false)}
          onConfirm={handleSignatureComplete}
        />

        {/* Toast Notifications */}
      </Card>
    </BasicLayout>
  );
}

export default AddDocument;
