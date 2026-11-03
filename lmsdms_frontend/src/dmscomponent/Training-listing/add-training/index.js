import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  MenuItem,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemText,
  FormControl,
  InputLabel,
  OutlinedInput,
  Select,
} from "@mui/material";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDInput from "components/MDInput";
import MDButton from "components/MDButton";
import BasicLayout from "layouts/authentication/components/BasicLayout";
import bgImage from "assets/images/bg-sign-in-basic.jpeg";
import ESignatureDialog from "layouts/authentication/ESignatureDialog";
import DeleteIcon from "@mui/icons-material/Delete";
import { toast, ToastContainer } from "react-toastify";
import { useCreateTrainingMutation } from "apilms/trainingApi"; // Import the API hook
import { useFetchTrainingTypesQuery } from "apilms/trainingtypeApi";
import { useFetchMethodologiesQuery } from "apilms/MethodologyApi";
import { useGetPlantQuery } from "apilms/plantApi";

function AddTraining() {
  const [plantName, setPlantName] = useState("");
  const [trainingTitle, setTrainingTitle] = useState("");
  const [trainingType, setTrainingType] = useState("");
  const [trainingVersion, setTrainingVersion] = useState("");
  const [trainingNumber, setTrainingNumber] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [refresherTime, setRefresherTime] = useState("");
  const [methodology, setMethodology] = useState("");
  const [documents, setDocuments] = useState([]);
  const [openSignatureDialog, setOpenSignatureDialog] = useState(false);
  const [errors, setErrors] = useState({});

  const { data: trainingTypesData } = useFetchTrainingTypesQuery();
  const { data: methodologiesData } = useFetchMethodologiesQuery();
  const { data: plantData } = useGetPlantQuery(); // Fetch plant data

  const navigate = useNavigate();

  // Use the mutation hook
  const [createTraining, { isLoading, isSuccess, isError }] = useCreateTrainingMutation();

  const handleFileChange = (e) => {
    setDocuments([...documents, ...e.target.files]);
  };

  const handleRemoveDocument = (index) => {
    const updatedDocuments = documents.filter((_, i) => i !== index);
    setDocuments(updatedDocuments);
  };

  const handleClear = () => {
    setPlantName("");
    setTrainingTitle("");
    setTrainingType("");
    setTrainingVersion("");
    setTrainingNumber("");
    setScheduleDate("");
    setRefresherTime("");
    setMethodology("");
    setDocuments([]);
    setErrors({});
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Reset errors before validating
    setErrors({});

    // Validate form fields
    const newErrors = {};
    if (!plantName) newErrors.plantName = "Plant Name is required";
    if (!trainingTitle) newErrors.trainingTitle = "Training Title is required";
    if (!trainingType) newErrors.trainingType = "Training Type is required";
    if (!trainingVersion) newErrors.trainingVersion = "Training Version is required";
    if (!trainingNumber) newErrors.trainingNumber = "Training Number is required";
    if (!scheduleDate) newErrors.scheduleDate = "Schedule Date is required";
    if (!refresherTime) newErrors.refresherTime = "Refresher Time is required";
    if (!methodology) newErrors.methodology = "Methodology is required";
    if (documents.length === 0) newErrors.documents = "At least one document is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors); // Set errors if validation fails
      return; // Stop form submission if validation fails
    }

    setOpenSignatureDialog(true); // Open e-signature dialog
  };

  const handleSignatureComplete = async (isVerified) => {
    setOpenSignatureDialog(false);
  
    if (!isVerified) {
      toast.error("E-Signature is required to proceed.");
      return;
    }
  
    // Prepare data for API request
    const formData = new FormData();
    formData.append("plant", plantName); // Using plantName (id)
    formData.append("training_type", trainingType);
    formData.append("training_number", trainingNumber);
    formData.append("training_name", trainingTitle);
    formData.append("training_version", trainingVersion);
    formData.append("refresher_time", refresherTime);
    formData.append("schedule_date", scheduleDate);
    formData.append("methodology_ids", JSON.stringify([methodology]));
    documents.forEach((doc) => formData.append("training_document", doc));
  
    try {
      const response = await createTraining(formData).unwrap();
      console.log("Training created successfully:", response);
  
      // Show success toast
      toast.success("Training created successfully!");
  
      // Navigate to the training listing page after a short delay
      setTimeout(() => {
        navigate("/trainingListing");
      }, 1500);
    } catch (error) {
      console.error("Error creating training:", error);
  
      // Show error toast
      toast.error("Failed to create training. Please try again.");
    } finally {
      setOpenSignatureDialog(false); // Close dialog
    }
  };
  

  return (
    <BasicLayout image={bgImage} showNavbarFooter={false}>
      <Card sx={{ width: 600, mx: "auto", mt:5, mb:5 }}>
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
            Add Training
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
              <FormControl fullWidth margin="dense">
                <InputLabel id="select-plant-label">Plant Name</InputLabel>
                <Select
                  labelId="select-plant-label"
                  id="select-plant"
                  value={plantName}
                  onChange={(e) => setPlantName(e.target.value)}
                  input={<OutlinedInput label="Plant Name" />}
                  sx={{
                    minWidth: 200,
                    height: "3rem",
                    ".MuiSelect-select": { padding: "0.45rem" },
                  }}
                  error={!!errors.plantName}
                >
                  {plantData?.data.map((plant) => (
                    <MenuItem key={plant.id} value={plant.id}>
                      {plant.plant_name}
                    </MenuItem>
                  ))}
                </Select>
                {errors.plantName && (
                  <p style={{ color: "red", fontSize: "0.75rem", marginTop: "4px" }}>
                    {errors.plantName}
                  </p>
                )}
              </FormControl>
            </MDBox>

            <MDBox mb={3}>
              <MDInput
                type="text"
                label="Training Title"
                fullWidth
                value={trainingTitle}
                onChange={(e) => setTrainingTitle(e.target.value)}
                error={!!errors.trainingTitle}
                helperText={errors.trainingTitle}
              />
            </MDBox>
            <MDBox mb={3}>
              <FormControl fullWidth margin="dense">
                <InputLabel id="select-training-type-label">Training Type</InputLabel>
                <Select
                  labelId="select-training-type-label"
                  id="select-training-type"
                  value={trainingType}
                  onChange={(e) => setTrainingType(e.target.value)}
                  input={<OutlinedInput label="Training Type" />}
                  sx={{
                    minWidth: 200,
                    height: "3rem",
                    ".MuiSelect-select": { padding: "0.45rem" },
                  }}
                  displayEmpty
                  error={!!errors.trainingType}
                >
                  {trainingTypesData?.data.map((type) => (
                    <MenuItem key={type.id} value={type.id}>
                      {type.training_type_name}
                    </MenuItem>
                  ))}
                </Select>
                {errors.trainingType && (
                  <p style={{ color: "red", fontSize: "0.75rem", marginTop: "4px" }}>
                    {errors.trainingType}
                  </p>
                )}
              </FormControl>
            </MDBox>
            <MDBox mb={3}>
              <MDInput
                type="text"
                label="Training Version"
                fullWidth
                value={trainingVersion}
                onChange={(e) => setTrainingVersion(e.target.value)}
                error={!!errors.trainingVersion}
                helperText={errors.trainingVersion}
              />
            </MDBox>
            <MDBox mb={3}>
              <MDInput
                type="text"
                label="Training Number"
                fullWidth
                value={trainingNumber}
                onChange={(e) => setTrainingNumber(e.target.value)}
                error={!!errors.trainingNumber}
                helperText={errors.trainingNumber}
              />
            </MDBox>
            <MDBox mb={3}>
              <MDInput
                type="date"
                label="Schedule Date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                error={!!errors.scheduleDate}
                helperText={errors.scheduleDate}
              />
            </MDBox>
            <MDBox mb={3}>
              <MDInput
                type="date"
                label="Refresher Time"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={refresherTime}
                onChange={(e) => setRefresherTime(e.target.value)}
                error={!!errors.refresherTime}
                helperText={errors.refresherTime}
              />
            </MDBox>
            <MDBox mb={3}>
              <FormControl fullWidth margin="dense">
                <InputLabel id="select-methodology-label">Methodology</InputLabel>
                <Select
                  labelId="select-methodology-label"
                  id="select-methodology"
                  value={methodology}
                  onChange={(e) => setMethodology(e.target.value)}
                  input={<OutlinedInput label="Methodology" />}
                  sx={{
                    minWidth: 200,
                    height: "3rem",
                    ".MuiSelect-select": { padding: "0.45rem" },
                  }}
                    
                  error={!!errors.methodology}
                >
                  {methodologiesData?.data.map((method) => (
                    <MenuItem key={method.id} value={method.id}>
                      {method.methodology_name}
                    </MenuItem>
                  ))}
                </Select>
                {errors.methodology && (
                  <p style={{ color: "red", fontSize: "0.75rem", marginTop: "4px" }}>
                    {errors.methodology}
                  </p>
                )}
              </FormControl>
            </MDBox>
            <MDBox mb={3}>
              <input accept="image/*" type="file" multiple onChange={handleFileChange} />
            </MDBox>
            {documents.length > 0 && (
              <List>
                {documents.map((doc, index) => (
                  <ListItem key={index}>
                    <ListItemText primary={doc.name} />
                    <IconButton onClick={() => handleRemoveDocument(index)}>
                      <DeleteIcon />
                    </IconButton>
                  </ListItem>
                ))}
              </List>
            )}
            <MDButton
              type="submit"
              variant="gradient"
              color="submit"
              fullWidth
              disabled={isLoading}
            >
              {isLoading ? "Submitting..." : "Submit"}
            </MDButton>
          </MDBox>
        </MDBox>
      </Card>
      <ESignatureDialog
        open={openSignatureDialog}
        onClose={() => setOpenSignatureDialog(false)} // Close the dialog
        onConfirm={handleSignatureComplete} // Handle signature completion
      />
       {/* <ToastContainer position="top-right" autoClose={3000} /> */}
    </BasicLayout>
  );
}

export default AddTraining;
