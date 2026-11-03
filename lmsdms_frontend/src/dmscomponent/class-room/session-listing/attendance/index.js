import React from "react";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import MDButton from "components/MDButton";
import MDTypography from "components/MDTypography";
import PropTypes from "prop-types";
import { useCreateAttendanceMutation, useGetAttendanceQuery } from "apilms/classRoomApi";

const AttendanceDialog = ({
  open,
  setOpen,
  attendanceData,
  setAttendanceData,
  sessionId,
  refetch,
}) => {
  const [createAttendance] = useCreateAttendanceMutation();
  const { refetch: getrefetch } = useGetAttendanceQuery(sessionId, {
    skip: !sessionId,
  });
  const handleAttendanceChange = (index, event) => {
    const isChecked = event.target.checked;

    const updatedAttendance = attendanceData.map((user, idx) => {
      if (idx === index) {
        return { ...user, present: isChecked }; // Toggle the present status based on checkbox state
      }
      return user;
    });

    setAttendanceData(updatedAttendance);
  };

  const handleSaveAttendance = () => {
    const userIds = attendanceData
      .filter((user) => user.present !== undefined)
      .map((user) => user.id);

    // const statuses = attendanceData
    //   .filter(user => user.present !== undefined) // Filter out users with undefined status
    //   .map(user => user.present ? 'present' : 'absent'); // Convert present status to 'present' or 'absent'

    if (userIds.length > 0) {
      const attendanceDataToSend = {
        session_id: sessionId,
        user_ids: userIds,
        status: "present",
      };
      createAttendance(attendanceDataToSend)
        .unwrap()
        .then((response) => {
          console.log("Attendance marked:", response);
          setOpen(false);
          getrefetch();
          refetch();
        })
        .catch((error) => {
          console.error("Error saving attendance:", error);
        });
    }
  };
  const handleCloseDialog = () => {
    setOpen(false);
    refetch();
  };

  return (
    <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
      <DialogTitle>Attendance</DialogTitle>
      <DialogContent>
        {attendanceData?.length > 0 ? (
          attendanceData.map((user, index) => (
            <FormControlLabel
              key={user.id}
              control={
                <Checkbox
                  checked={!!attendanceData[index]?.present} 
                  onChange={(e) => handleAttendanceChange(index, e)}
                  name={user.username}
                />
              }
              label={user.username}
            />
          ))
        ) : (
          <MDTypography variant="body1" align="center">
            No users available for this session.
          </MDTypography>
        )}
      </DialogContent>
      <DialogActions>
        <MDButton onClick={handleCloseDialog} color="secondary">
          Close
        </MDButton>
        <MDButton onClick={handleSaveAttendance} color="primary">
          Save
        </MDButton>
      </DialogActions>
    </Dialog>
  );
};
AttendanceDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  setOpen: PropTypes.func.isRequired,
  attendanceData: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      username: PropTypes.string.isRequired,
      present: PropTypes.bool,
    })
  ).isRequired,
  setAttendanceData: PropTypes.func.isRequired,
  sessionId: PropTypes.number.isRequired,
  refetch: PropTypes.func.isRequired,
};

export default AttendanceDialog;
