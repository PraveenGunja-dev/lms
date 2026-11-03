import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, MenuItem, Select, InputLabel, FormControl, Grid, TextField } from "@mui/material";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import BasicLayout from "layouts/authentication/components/BasicLayout";
import bgImage from "assets/images/bg-sign-in-basic.jpeg";
import MDButton from "components/MDButton";
import OutlinedInput from "@mui/material/OutlinedInput";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ESignatureDialog from "layouts/authentication/ESignatureDialog";
import { useCreateSessionMutation } from "apilms/classRoomApi";
import { useGetselecteduserQuery } from "apilms/classRoomApi";

function AddSession() {
  const navigate = useNavigate();
  const location = useLocation();
  const classroomId = location.state?.classroomId;
  const [sessionName, setSessionName] = useState("");
  const [sessionVenue, setSessionVenue] = useState("");
  const [sessionDate, setSessionDate] = useState("");
  const [sessionTime, setSessionTime] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [errors, setErrors] = useState({});
  const [openSignatureDialog, setOpenSignatureDialog] = useState(false);
  const [createSession, { isLoading }] = useCreateSessionMutation();
  
  const {
    data: userData,
    isLoading: isUserLoading,
    error: userError,
  } = useGetselecteduserQuery(classroomId);
  const users = Array.isArray(userData) ? userData : userData?.data ?? [];

  const validateInputs = () => {
    const newErrors = {};
    if (!sessionName.trim()) newErrors.sessionName = "Session Name is required.";
    if (!sessionVenue.trim()) newErrors.sessionVenue = "Session Venue is required.";
    if (!sessionDate.trim()) newErrors.sessionDate = "Session Date is required.";
    if (!sessionTime.trim()) newErrors.sessionTime = "Session Time is required.";
    if (selectedUsers.length === 0) newErrors.selectedUsers = "At least one user must be selected.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateInputs()) return;
    setOpenSignatureDialog(true); // Open E-Signature Dialog
  };

  const handleSignatureComplete = async (password) => {
    setOpenSignatureDialog(false);
    if (!password) {
      toast.error("E-Signature is required to proceed.");
      return;
    }

    try {
      const sessionData = {
        session_name: sessionName.trim(),
        venue: sessionVenue.trim(),
        start_date: sessionDate.trim(),
        start_time: sessionTime.trim(),
        user_ids: selectedUsers,
        classroom_id: classroomId,
      };

      const response = await createSession(sessionData).unwrap();
      console.log("Session created successfully:", response);
      toast.success("Session created successfully!");
      setTimeout(() => navigate("/class-room"), 1500);
    } catch (err) {
      console.error("Error creating session:", err);
      toast.error("Failed to create session. Please try again.");
    }
  };

  const handleUserChange = (e) => setSelectedUsers(e.target.value);

  if (isUserLoading) return <p>Loading users...</p>;
  if (userError) return <p>Error loading users: {userError.message}</p>;
  const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
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
            Add Session
          </MDTypography>
        </MDBox>

        <MDBox pb={3} px={3}>
          <MDBox component="form" role="form" onSubmit={handleSubmit} sx={{ padding: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label={
                    <>
                      <span style={{ color: "red" }}>*</span> Session Name
                    </>
                  }
                  fullWidth
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  error={!!errors.sessionName}
                  helperText={errors.sessionName}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label={
                    <>
                      <span style={{ color: "red" }}>*</span> Session Venue
                    </>
                  }
                  fullWidth
                  value={sessionVenue}
                  onChange={(e) => setSessionVenue(e.target.value)}
                  error={!!errors.sessionVenue}
                  helperText={errors.sessionVenue}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  type="date"
                  label={
                    <>
                      <span style={{ color: "red" }}>*</span> Session Date
                    </>
                  }
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  error={!!errors.sessionDate}
                  helperText={errors.sessionDate}
                  inputProps={{
                    min: getTodayDateString(),
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  type="time"
                  label={
                    <>
                      <span style={{ color: "red" }}>*</span> Session Time
                    </>
                  }
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={sessionTime}
                  onChange={(e) => setSessionTime(e.target.value)}
                  error={!!errors.sessionTime}
                  helperText={errors.sessionTime}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth error={!!errors.selectedUsers}>
                  <InputLabel id="select-user-label">
                    <span style={{ color: "red" }}>*</span> Select Users
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
                          const user = users.find((u) => u.id === userId);
                          return user ? `${user.first_name} ${user.last_name}` : userId;
                        })
                        .join(", ")
                    }
                    sx={{
                      minWidth: 200,
                      height: "3rem",
                      ".MuiSelect-select": { padding: "0.45rem" },
                    }}
                  >
                    {users.length > 0 ? (
                      users.map((user) => (
                        <MenuItem key={user.id} value={user.id}>
                          {user.first_name} {user.last_name} ({user.email})
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
            </Grid>

            <MDBox mt={2} mb={1}>
              <MDButton
                variant="gradient"
                color="submit"
                fullWidth
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? "Creating..." : "Create Session"}
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
      {/* <ToastContainer position="top-right" autoClose={3000} /> */}
    </BasicLayout>
  );
}

export default AddSession;
