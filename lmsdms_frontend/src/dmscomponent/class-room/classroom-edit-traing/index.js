import React, { useState, useEffect } from "react";
import {
  Card,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
  Grid,
  CircularProgress,
  Radio,
  RadioGroup,
  FormControlLabel,
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import BasicLayout from "layouts/authentication/components/BasicLayout";
import ESignatureDialog from "layouts/authentication/ESignatureDialog";
import bgImage from "assets/images/bg-sign-in-basic.jpeg";
import MDInput from "components/MDInput";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useFetchTrainingsQuery } from "apilms/trainingApi";
import { useFetchTrainersQuery } from "api/auth/trainerApi";
import { useUserListQuery } from "api/auth/userApi";
import { useFailedUserQuery } from "api/auth/userApi";

function ClassroomEditTraining() {
  const location = useLocation();
  const navigate = useNavigate();
  const { classroom } = location.state || {};
  console.log(classroom);
  const { data: alldocument } = useFetchTrainingsQuery();
  const { data: alltrainers } = useFetchTrainersQuery();
  const { data: userData } = useUserListQuery();

  const [classroomTitle, setClassroomTitle] = useState(classroom?.classroom_name || "");
  const [trainingType, setTrainingType] = useState(classroom?.is_assesment || "");
  const [description, setDescription] = useState(classroom?.description || "");
  const [trainer, setTrainer] = useState(classroom?.trainer || "");
  const [sopdocument, setsopdocument] = useState(classroom?.document_id || "None");
  const [selectedUsers, setSelectedUsers] = useState(classroom?.user || []);
  const [onlineOfflineStatus, setOnlineOfflineStatus] = useState(
    classroom?.online_offline_status || "Online"
  );
  const { data: failedUsersData, isLoading: isFailedUsersLoading } =
    useFailedUserQuery(sopdocument);
  const [status, setStatus] = useState(classroom?.status || "Assigned");
  const [File, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [openSignatureDialog, setOpenSignatureDialog] = useState(false);
  const handleUserChange = (e) => setSelectedUsers(e.target.value);
  useEffect(() => {
    if (!classroom) {
      navigate("/class-room");
    }
  }, [classroom, navigate]);

  const validateInputs = () => {
    const newErrors = {};
    if (!classroomTitle.trim()) newErrors.classroomTitle = "Classroom Title is required.";
    if (!trainingType) newErrors.trainingType = "Training Type is required.";
    if (!description.trim()) newErrors.description = "Description is required.";
    if (!trainer) newErrors.trainer = "Trainer is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateInputs()) return;
    setOpenSignatureDialog(true);
  };
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setErrors((prev) => ({ ...prev, File: "" }));
  };
  const handleSignatureComplete = async (password) => {
    setOpenSignatureDialog(false);
    if (!password) {
      toast.error("E-Signature is required to proceed.");
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append("document_id", sopdocument);
    formData.append("trainer", trainer);
    formData.append("classroom_name", classroomTitle.trim());
    formData.append("is_assesment", trainingType);
    formData.append("description", description.trim());
    formData.append("status", status);
    formData.append("upload_doc", File);
    formData.append("online_offline_status", onlineOfflineStatus);
    formData.append("select_users", JSON.stringify(selectedUsers));

    const token = sessionStorage.getItem("token");
    const apiUrl = `${process.env.REACT_APP_APIKEY}lms_module/update_classroom/${classroom.classroom_id}`;

    try {
      const response = await axios.put(apiUrl, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.status) {
        toast.success("Classroom training updated successfully!");
        setTimeout(() => navigate("/class-room"), 1500);
      } else {
        toast.error(response.data.message || "Failed to update classroom training.");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "An error occurred while updating the classroom training."
      );
    } finally {
      setIsLoading(false);
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
            Edit Classroom Training
          </MDTypography>
        </MDBox>
        <MDBox pb={3} px={3}>
          <MDBox component="form" role="form" onSubmit={handleSubmit} sx={{ padding: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <MDInput
                  type="text"
                  label={
                    <>
                      <span style={{ color: "red" }}>*</span> Classroom Title
                    </>
                  }
                  fullWidth
                  value={classroomTitle}
                  onChange={(e) => setClassroomTitle(e.target.value)}
                  error={!!errors.classroomTitle}
                  helperText={errors.classroomTitle}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth margin="dense">
                  <InputLabel id="training-type-label">
                    <span style={{ color: "red" }}>*</span>Type
                  </InputLabel>
                  <Select
                    labelId="training-type-label"
                    id="training-type"
                    value={trainingType}
                    onChange={(e) => setTrainingType(e.target.value)}
                    input={<OutlinedInput label=" Type " />}
                    sx={{
                      minWidth: 200,
                      height: "3rem",
                      ".MuiSelect-select": { padding: "0.45rem" },
                    }}
                  >
                    <MenuItem value="With Assessment">With Assessment</MenuItem>
                    <MenuItem value="Without Assessment">Without Assessment</MenuItem>
                  </Select>
                </FormControl>
                {errors.trainingType && (
                  <MDTypography variant="caption">{errors.trainingType}</MDTypography>
                )}
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth margin="dense">
                  <InputLabel id="trainer-type-label">
                    <span style={{ color: "red" }}>*</span>Select Trainer
                  </InputLabel>
                  <Select
                    labelId="select-trainer-label"
                    id="select-trainer-doc"
                    value={trainer}
                    onChange={(e) => setTrainer(e.target.value)}
                    input={<OutlinedInput label="Select Trainer " />}
                    sx={{
                      minWidth: 200,
                      height: "3rem",
                      ".MuiSelect-select": { padding: "0.5rem" },
                    }}
                  >
                    {/* Add trainers dynamically */}
                    {alltrainers
                      ?.filter((trainerItem) => trainerItem.is_active) // Only active trainers
                      .map((trainerItem) => (
                        <MenuItem key={trainerItem.id} value={trainerItem.id}>
                          {trainerItem.trainer_name} {/* Display trainer name */}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>

                {/* Display error message for the "trainer" field */}
                {errors.trainer && (
                  <MDTypography variant="caption">
                    {errors.trainer} {/* Display the error message for the trainer */}
                  </MDTypography>
                )}
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth margin="dense">
                  <InputLabel id="select-parent-doc-label">SOP Document</InputLabel>
                  <Select
                    labelId="select-parent-doc-label"
                    id="select-parent-doc"
                    value={sopdocument}
                    onChange={(e) => setsopdocument(e.target.value)} // Update parent document when selected
                    input={<OutlinedInput label="SOP Document" />}
                    sx={{
                      minWidth: 200,
                      height: "3rem",
                      ".MuiSelect-select": { padding: "0.45rem" },
                    }}
                  >
                    {/* Add "N/A" option */}
                    <MenuItem value="None">None</MenuItem>
                    {Array.isArray(alldocument?.document_data.documents) ? (
                      alldocument.document_data.documents.map((doc) => (
                        <MenuItem key={doc.id} value={doc.id}>
                          {doc.document_title} {/* Display document title */}
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem disabled>No documents available</MenuItem>
                    )}
                  </Select>
                </FormControl>
              </Grid>
              {sopdocument === "None" ? (
                <Grid item xs={12}>
                  <FormControl fullWidth error={!!errors.selectedUsers}>
                    <InputLabel id="select-user-label">
                      <span style={{ color: "red" }}>*</span>All Users
                    </InputLabel>
                    <Select
                      labelId="select-user-label"
                      id="select-user"
                      multiple
                      value={selectedUsers}
                      onChange={handleUserChange}
                      input={<OutlinedInput label="Select Users" />}
                      renderValue={(selected) =>
                        selected
                          .map((userId) => {
                            const user = userData?.data.find((u) => u.id === userId);
                            return user?.username || userId;
                          })
                          .join(", ")
                      }
                      sx={{
                        minWidth: 200,
                        height: "3rem",
                        ".MuiSelect-select": { padding: "0.45rem" },
                      }}
                    >
                      {userData?.data.length > 0 ? (
                        userData.data.map((user) => (
                          <MenuItem key={user.id} value={user.id}>
                            {user.username}
                          </MenuItem>
                        ))
                      ) : (
                        <MenuItem disabled>No users available</MenuItem>
                      )}
                    </Select>
                    {errors.selectedUsers && (
                      <MDTypography color="error" variant="caption">
                        {errors.selectedUsers}
                      </MDTypography>
                    )}
                  </FormControl>
                </Grid>
              ) : (
                <Grid item xs={12}>
                  <FormControl fullWidth margin="dense">
                    <InputLabel id="select-failed-users-label">
                      <span style={{ color: "red" }}>*</span>Failed Users
                    </InputLabel>
                    <Select
                      labelId="select-failed-users-label"
                      id="select-failed-users"
                      multiple
                      value={selectedUsers}
                      onChange={handleUserChange}
                      input={<OutlinedInput label="Failed Users" />}
                      renderValue={(selected) =>
                        selected
                          .map((userId) => {
                            const user = failedUsersData?.data.find((u) => u.id === userId);
                            // Return the full name of the user (first name + last name)
                            return user ? `${user.user_first_name} ${user.user_last_name}` : userId;
                          })
                          .join(", ")
                      }
                      sx={{
                        minWidth: 200,
                        height: "3rem",
                        ".MuiSelect-select": { padding: "0.45rem" },
                      }}
                    >
                      {isFailedUsersLoading ? (
                        <CircularProgress />
                      ) : (
                        failedUsersData?.data.map((user) => (
                          <MenuItem key={user.id} value={user.id}>
                            {/* Display the full name (first name + last name) */}
                            {`${user.user_first_name} ${user.user_last_name}`}
                          </MenuItem>
                        ))
                      )}
                    </Select>
                  </FormControl>
                </Grid>
              )}
              <Grid item xs={12}>
                <MDTypography variant="h6">Class Mode</MDTypography>
                <FormControl fullWidth margin="dense">
                  <RadioGroup
                    row
                    value={onlineOfflineStatus}
                    onChange={(e) => setOnlineOfflineStatus(e.target.value)}
                  >
                    <FormControlLabel value="Online" control={<Radio />} label="Online" />
                    <FormControlLabel value="Offline" control={<Radio />} label="Offline" />
                  </RadioGroup>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <MDInput
                  label={
                    <>
                      <span style={{ color: "red" }}>*</span> Description
                    </>
                  }
                  multiline
                  rows={4}
                  fullWidth
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  error={!!errors.description}
                  helperText={errors.description}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth margin="dense">
                  <InputLabel id="status-label">Status</InputLabel>
                  <Select
                    labelId="status-label"
                    id="status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    input={<OutlinedInput label="Status" />}
                    sx={{
                      minWidth: 200,
                      height: "3rem",
                      ".MuiSelect-select": { padding: "0.45rem" },
                    }}
                  >
                    <MenuItem value="Assigned">Assigned</MenuItem>
                    <MenuItem value="Completed">Completed</MenuItem>
                    <MenuItem value="In Progress">In Progress</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <MDInput
                  type="file"
                  label={
                    <>
                       Upload File
                    </>
                  }
                  fullWidth
                  onChange={handleFileChange}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ accept: ".pdf,.ppt,.doc,.docx" }}
                  error={!!errors.File}
                  helperText={errors.File}
                />
              </Grid>
            </Grid>
            <MDBox mt={2} mb={1}>
              <MDButton
                variant="gradient"
                color="submit"
                fullWidth
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? <CircularProgress size={24} /> : "Update"}
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

export default ClassroomEditTraining;
