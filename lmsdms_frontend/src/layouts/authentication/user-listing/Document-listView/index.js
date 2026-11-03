import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Dialog, DialogActions, DialogContent, DialogTitle, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import MDBox from 'components/MDBox';
import MDTypography from 'components/MDTypography';
import MDButton from "components/MDButton";
import { DataGrid } from '@mui/x-data-grid';
import { useUserIdWiseNoOfAttemptsMutation, useUserIdWiseNoOfClassAttemptsMutation,useUserIdWisewithoutQuery} from 'api/auth/userApi';
import AnswerDialog from './AnswerDialog'; // Import AnswerDialog
import { useAuth } from 'hooks/use-auth';
import moment from 'moment/moment';

const SOPDialog = ({ open, onClose, selectedUserid }) => {
  const [fetchAttempts, { data: attemptsData, isLoading: isAttemptsLoading, isError: isAttemptsError }] = useUserIdWiseNoOfAttemptsMutation();
  // console.log(">>>>",attemptsData)
  const [fetchClassAttempts, { data: classAttemptsData, isLoading: isClassAttemptsLoading, isError: isClassAttemptsError }] = useUserIdWiseNoOfClassAttemptsMutation();
  // const [fetchClassWithoutAssessment, { data: classWithoutAssessmentData }] = useUserIdWisewithoutQuery();
  const { data: classWithoutAssessmentData, isLoading, isError } = useUserIdWisewithoutQuery({ userId: selectedUserid }, { skip: !open });
  console.log("Class Without Assessment Data:", classWithoutAssessmentData);

  const [sopData, setSopData] = useState([]);
  const [classAttempts, setClassAttempts] = useState([]);
  const [classWithoutAssessment, setClassWithoutAssessment] = useState([]);
  const { user } = useAuth();
  const group = user?.user_permissions?.group || {};
  const groupId = group.id;
  const [answerDialogOpen, setAnswerDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
// console.log(">>>>>>>>>>+++++++",fetchClassWithoutAssessment)
  useEffect(() => {
    if (open && selectedUserid) {
      fetchAttempts(selectedUserid);
      fetchClassAttempts(selectedUserid);
      // fetchClassWithoutAssessment(selectedUserid);
    }
  }, [open, selectedUserid, fetchAttempts, fetchClassAttempts]);

  useEffect(() => {
    if (!open) {
      setSopData([]);
      setClassAttempts([]);
    }
  }, [open]);

  const convertTime = (totalTimeInSeconds) => {
    if (!totalTimeInSeconds) return 'N/A';

    const hours = Math.floor(totalTimeInSeconds / 3600); 
    const minutes = Math.floor((totalTimeInSeconds % 3600) / 60); 
    const seconds = totalTimeInSeconds % 60;

    let timeString = '';

    if (hours > 0) {
      timeString += `${hours}h `;
    }
    if (minutes > 0 || hours > 0) {
      timeString += `${minutes}m `;
    }
    timeString += `${seconds}s`; 

    return timeString.trim();
  };

  useEffect(() => {
    if (attemptsData?.status && attemptsData?.data) {
      const formattedData = attemptsData.data.map((item,index) => ({
        id: index + 1,
        user: item.user,
        document: item.document,
        serial_number: item.id,
        documentName: item.document_name,
        obtainedMarks: item.obtain_marks || '0',
        totalMarks: item.total_marks || '0',
        timeTaken: convertTime(item.total_taken_time), 
        document_version: item.document_version,
        status: item.is_pass ? 'Pass' : 'Fail',
        attemptDate: item.created_at ? moment(item.created_at).format("DD/MM/YYYY") : "N/A",
      }));
      setSopData(formattedData);
    }
  }, [attemptsData]);

  useEffect(() => {
    if (classAttemptsData?.status && classAttemptsData?.data) {
      const formattedClassAttempts = classAttemptsData.data.map((item,index) => ({
        id: index + 1,
        user: item.user,
        classroom: item.classroom,
        serial_number: item.id,
        classroomName: item.classroom_name,
        obtainedMarks: item.obtain_marks || '0',
        totalMarks: item.total_marks || '0',
        timeTaken: convertTime(item.total_taken_time),
        status: item.is_pass ? 'Pass' : 'Fail',
        attemptDate: item.created_at ? moment(item.created_at).format("DD/MM/YYYY") : "N/A",
      }));
      setClassAttempts(formattedClassAttempts);
    }
  }, [classAttemptsData]);

  useEffect(() => {
    if (classWithoutAssessmentData?.status && classWithoutAssessmentData?.data) {
      const formattedData = classWithoutAssessmentData.data.map((item, index) => ({
        id: index + 1,
        classroomName: item.classroom_name,
        attemptDate: item.created_at ? moment(item.created_at).format("DD/MM/YYYY") : "N/A",
      }));
      setClassWithoutAssessment(formattedData);
    }
  }, [classWithoutAssessmentData]);

  const handleOpenAnswerDialog = (userId, documentId) => {
    setSelectedUser(userId);
    setSelectedDocument(documentId);
    setAnswerDialogOpen(true);
  };

  const handleCloseAnswerDialog = () => {
    setAnswerDialogOpen(false);
  };

  const columns = [
    { field: "id", headerName: "Sr. No.", flex: 0.5, headerAlign: "center" },
    { field: "documentName", headerName: "Document Name", flex: 1.5, headerAlign: "center" },
    { 
      field: "obtainedMarks", 
      headerName: "Marks Obtained", 
      flex: 1, 
      headerAlign: "center",
      renderCell: (params) => (
        <span>{params.row.obtainedMarks}/{params.row.totalMarks}</span>
      )
    },
    { field: "timeTaken", headerName: "Time Taken", flex: 1, headerAlign: "center" },
    { field: "status", headerName: "Status", flex: 0.8, headerAlign: "center" },
    { field: "document_version", headerName: "Version", flex: 0.8, headerAlign: "center" },
    { field: "attemptDate", headerName: "Attempt Date", flex: 1, headerAlign: "center" },
    ...(groupId === 7
      ? [
    {
      field: "answers",
      headerName: "Answers",
      flex: 1,
      headerAlign: "center",
      renderCell: (params) => (
        <MDButton
          color="success"
          onClick={() => handleOpenAnswerDialog(params.row.user, params.row.document)}
        >
          View
        </MDButton>
      ),
    }
  ]
  : []),
  ];

  const classAttemptsColumns = [
    { field: "id", headerName: "Sr. No.", flex: 0.5, headerAlign: "center" },
    { field: "classroomName", headerName: "Classroom Name", flex: 1.5, headerAlign: "center" },
    { 
      field: "obtainedMarks", 
      headerName: "Marks Obtained", 
      flex: 1, 
      headerAlign: "center",
      renderCell: (params) => (
        <span>{params.row.obtainedMarks}/{params.row.totalMarks}</span>
      )
    },
    { field: "timeTaken", headerName: "Time Taken", flex: 1, headerAlign: "center" },
    { field: "status", headerName: "Status", flex: 0.8, headerAlign: "center" },
    { field: "attemptDate", headerName: "Attempt Date", flex: 1, headerAlign: "center" },
  ];
  
  const classWithoutAssessmentColumns = [
    { field: "id", headerName: "Sr. No.", flex: 0.5,headerAlign: "center" },
    { field: "classroomName", headerName: "Classroom Name", flex: 1.5, headerAlign: "center" },
    { field: "attemptDate", headerName: "Attempt Date", flex: 1, headerAlign: "center"}
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        SOP Details
        <IconButton
          edge="end"
          color="inherit"
          onClick={onClose}
          aria-label="close"
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle> 

      <DialogContent>
        <MDBox p={3}>
          <MDTypography variant="h5" fontWeight="medium" sx={{ mb: 3, textAlign: "center" }}>
            SOP Attempt History
          </MDTypography>
          
          {isAttemptsLoading && (
            <MDTypography variant="h6" color="textSecondary">
              Loading SOP data...
            </MDTypography>
          )}
          
          {isAttemptsError && (
            <MDTypography variant="h6" color="error">
              Failed to fetch data. Please try again.
            </MDTypography>
          )}

          {attemptsData && !isAttemptsLoading && !isAttemptsError && (
            <div style={{ height: 400, width: '100%' }}>
              <DataGrid
                rows={sopData}
                columns={columns}
                pageSize={5}
                rowsPerPageOptions={[5, 10, 20]}
                disableSelectionOnClick
                sx={{
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  "& .MuiDataGrid-columnHeaders": {
                    backgroundColor: "#f5f5f5",
                    fontWeight: "bold"
                  },
                  "& .MuiDataGrid-cell": {
                    textAlign: "center"
                  }
                }}
              />
            </div>
          )}

          {classAttemptsData && classAttempts.length > 0 && (
            <>
              <MDTypography variant="h5" fontWeight="medium" sx={{ mt: 5, mb: 3, textAlign: "center" }}>
                Classroom Attempt History
              </MDTypography>
              <div style={{ height: 400, width: '100%' }}>
                <DataGrid
                  rows={classAttempts}
                  columns={classAttemptsColumns}
                  pageSize={5}
                  rowsPerPageOptions={[5, 10, 20]}
                  disableSelectionOnClick
                  sx={{
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    "& .MuiDataGrid-columnHeaders": {
                      backgroundColor: "#f5f5f5",
                      fontWeight: "bold"
                    },
                    "& .MuiDataGrid-cell": {
                      textAlign: "center"
                    }
                  }}
                />
              </div>
            </>
          )}
           {classWithoutAssessmentData && classWithoutAssessment.length > 0 && (
            <>
              <MDTypography variant="h5" fontWeight="medium" sx={{ mt: 5, mb: 3, textAlign: "center" }}>
                Classroom Without Assessment
              </MDTypography>
              <div style={{ height: 400, width: '100%' }}>
                <DataGrid
                  rows={classWithoutAssessment}
                  columns={classWithoutAssessmentColumns}
                  pageSize={5}
                  rowsPerPageOptions={[5, 10, 20]}
                  disableSelectionOnClick
                  sx={{
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    "& .MuiDataGrid-columnHeaders": {
                      backgroundColor: "#f5f5f5",
                      fontWeight: "bold"
                    },
                    "& .MuiDataGrid-cell": {
                      textAlign: "center"
                    }
                  }}
                />
              </div>
            </>
          )}
          
        </MDBox>
      </DialogContent>

      <DialogActions>
        <MDButton onClick={onClose} color="primary">
          Close
        </MDButton>
      </DialogActions>

      {/* Answer Dialog */}
      <AnswerDialog
        open={answerDialogOpen}
        onClose={handleCloseAnswerDialog}
        userId={selectedUser}
        documentId={selectedDocument}
      />
    </Dialog>
  );
};

SOPDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  selectedUserid: PropTypes.string.isRequired,
};

export default SOPDialog;