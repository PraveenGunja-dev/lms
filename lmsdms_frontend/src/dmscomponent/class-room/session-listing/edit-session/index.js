import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, MenuItem, Select, InputLabel, FormControl, Grid, TextField } from "@mui/material";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import BasicLayout from "layouts/authentication/components/BasicLayout";
import bgImage from "assets/images/bg-sign-in-basic.jpeg";
import MDButton from "components/MDButton";
import OutlinedInput from "@mui/material/OutlinedInput";
import { useUserListQuery } from "api/auth/userApi"; // Import user list query
import { useUpdateSessionMutation } from "apilms/classRoomApi"; // Import the updateSession mutation hook
import moment from "moment"; // Import Moment.js

function EditSession() {
  const location = useLocation();
  const navigate = useNavigate();
  const sessionData = location.state?.session;
  const [sessionName, setSessionName] = useState(sessionData?.session_name || "");
  const [sessionVenue, setSessionVenue] = useState(sessionData?.venue || "");
  const [sessionDate, setSessionDate] = useState(formatDate(sessionData?.start_date || ""));
  const [sessionTime, setSessionTime] = useState(formatTime(sessionData?.start_time || ""));
  const [selectedUsers, setSelectedUsers] = useState(sessionData?.user_ids || []);
  function formatDate(date) {
    return moment(date, "DD/MM/YY HH:mm").format("DD/MM/YY");
  }
  function formatTime(time) {
    return moment(time, "HH:mm:ss").format("HH:mm");
  }
  // console.log("----------------daata in edit session",sessionData);
  const { data: userData, isLoading: isUserLoading, error: userError } = useUserListQuery();

  // Use the update session mutation hook
  const [updateSession, { isLoading: isUpdating, error: updateError }] = useUpdateSessionMutation();
  const handleUserChange = (event) => {
    setSelectedUsers(event.target.value); // MUI Select returns an array when `multiple` is enabled
  };
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Updated session data
    const updatedSessionData = {
      session_name: sessionName,
      venue: sessionVenue,
      start_date: sessionDate, // Only the date part will be used

      start_time: sessionTime,
      user_ids: selectedUsers,
      classroom_id: sessionData?.classroom_id,
    };

    try {
      // Call the mutation to update the session
      const response = await updateSession({
        sessionId: sessionData?.id,
        sessionData: updatedSessionData,
      }).unwrap();
      console.log("Session updated successfully", response);
      navigate("/class-room"); // Redirect to sessions list after successful update
    } catch (error) {
      console.error("Error updating session:", error);
    }
  };

  // Loading and error handling for user list
  if (isUserLoading) return <p>Loading users...</p>;
  if (userError) return <p>Error loading users: {userError.message}</p>;

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
            Edit Session
          </MDTypography>
        </MDBox>

        <MDBox pb={3} px={3}>
          <MDBox component="form" role="form" onSubmit={handleSubmit} sx={{ padding: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Session Name"
                  fullWidth
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Session Venue"
                  fullWidth
                  value={sessionVenue}
                  onChange={(e) => setSessionVenue(e.target.value)}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  type="date"
                  label="Session Date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  type="time"
                  label="Session Time"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={sessionTime}
                  onChange={(e) => setSessionTime(e.target.value)}
                />
              </Grid>

              <Grid item xs={12}>
                <MDBox mb={3}>
                  <FormControl fullWidth margin="dense">
                    <InputLabel id="select-user-label">Select Users</InputLabel>
                    <Select
                      labelId="select-user-label"
                      id="select-user"
                      multiple
                      value={selectedUsers}
                      onChange={handleUserChange}
                      input={<OutlinedInput label="Select Users" />}
                      renderValue={(selected) =>
                        userData?.data
                          ?.filter((user) => selected.includes(user.id))
                          .map((user) => user.username)
                          .join(", ")
                      }
                      sx={{
                        minWidth: 200,
                        height: "3rem",
                        ".MuiSelect-select": { padding: "0.45rem" },
                      }}
                    >
                      {userData?.data?.length > 0 ? (
                        userData.data.map((user) => (
                          <MenuItem key={user.id} value={user.id}>
                            {user.username}
                          </MenuItem>
                        ))
                      ) : (
                        <MenuItem disabled>No users available</MenuItem>
                      )}
                    </Select>
                  </FormControl>
                </MDBox>
              </Grid>
            </Grid>

            <MDBox mt={2} mb={1}>
              <MDButton
                variant="gradient"
                color="submit"
                fullWidth
                type="submit"
                disabled={isUpdating}
              >
                {isUpdating ? "Updating..." : "Update Session"}
              </MDButton>
            </MDBox>
          </MDBox>
        </MDBox>
      </Card>
    </BasicLayout>
  );
}

export default EditSession;
