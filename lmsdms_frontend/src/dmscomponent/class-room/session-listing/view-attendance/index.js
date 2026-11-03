import React, { useEffect, useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import MDButton from "components/MDButton";
import MDTypography from "components/MDTypography";
import PropTypes from "prop-types"; 
import { useGetAttendanceQuery } from "apilms/classRoomApi"; 

const ViewAttendanceDialog = ({ open, setOpen, sessionId }) => {
  const { data: attendanceData, isLoading, error } = useGetAttendanceQuery(sessionId, {
    skip: !sessionId, 
  });

  useEffect(() => {
    if (!sessionId) {
      setOpen(false); 
    }
  }, [sessionId, setOpen]);

  return (
    <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
      <DialogTitle>View Attendance</DialogTitle>
      <DialogContent>
        {isLoading ? (
          <MDTypography variant="body1" align="center">
            Loading attendance data...
          </MDTypography>
        ) : error ? (
          <MDTypography variant="body1" align="center" color="error">
            Error loading attendance data.
          </MDTypography>
        ) : attendanceData && attendanceData.length > 0 ? (
          attendanceData.map((user) => (
            <div
              key={user.user_id}
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "10px",
                color: user.status.toLowerCase() === "present" ? "#4caf50" : "#f44336", 
              }}
            >
              <div
                style={{
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  backgroundColor: user.status.toLowerCase() === "present" ? "#4caf50" : "#f44336", 
                  marginRight: "10px",
                }}
              ></div>
              <MDTypography variant="body1" style={{ flex: 1 }}>
                {user.user_name}
              </MDTypography>
              {user.status.toLowerCase() === "present" ? (
                <span style={{ fontSize: "18px", color: "#4caf50" }}>✔</span>
              ) : (
                <span style={{ fontSize: "18px", color: "#f44336" }}>✘</span>
              )}
            </div>
          ))
        ) : (
          <MDTypography variant="body1" align="center">
            No attendance data available.
          </MDTypography>
        )}
      </DialogContent>
      <DialogActions>
        <MDButton onClick={() => setOpen(false)} color="secondary">
          Close
        </MDButton>
      </DialogActions>
    </Dialog>
  );
};
ViewAttendanceDialog.propTypes = {
  open: PropTypes.bool.isRequired, // open is a boolean, and it's required
  setOpen: PropTypes.func.isRequired, // setOpen is a function, and it's required
  sessionId: PropTypes.number.isRequired, // sessionId is required for fetching attendance
};

export default ViewAttendanceDialog;
