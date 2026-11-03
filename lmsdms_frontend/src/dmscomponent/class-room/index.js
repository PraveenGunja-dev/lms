import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Card from "@mui/material/Card";
import { DataGrid } from "@mui/x-data-grid";
import IconButton from "@mui/material/IconButton";
import EditIcon from "@mui/icons-material/Edit";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDInput from "components/MDInput";
import MDButton from "components/MDButton";
import { useGetClassroomsQuery, useUpdateClassroomPreviewMutation } from "apilms/classRoomApi"; // Import your API hook
import moment from "moment"; // For date formatting
import { CircularProgress } from "@mui/material";
import { toast } from "react-toastify";
import {
  useGetTrainingAttendanceSheetQuery,
  useGetTrainingAttendanceClassSheetQuery,
} from "apilms/reportsApi";
import { useAuth } from "hooks/use-auth";
import SlideshowIcon from "@mui/icons-material/Slideshow";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Button from "@mui/material/Button";

const ClassroomListing = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useAuth();
  const navigate = useNavigate();
  const [updateClassroomView] = useUpdateClassroomPreviewMutation();
  const group = user?.user_permissions?.group || {};
  const groupId = group.id;
  const [downloadClassroomId, setDownloadClassroomId] = useState(null);
  const { data, isLoading, isError, error, refetch } = useGetClassroomsQuery();
  const [downloadDocumentId, setDownloadDocumentId] = useState(null);
  const [startAssessmentModal, setStartAssessmentModal] = useState(false);
  const [selectedClassroom, setSelectedClassroom] = useState(null);

  const {
    data: attendanceSheetData,
    isFetching: isFetchingAttendanceSheet,
    isError: isAttendanceSheetError,
    error: attendanceSheetError,
  } = useGetTrainingAttendanceSheetQuery(downloadDocumentId, {
    skip: !downloadDocumentId,
  });
  const { data: attendanceClassSheetData, isFetching: isFetchingAttendanceClassSheet } =
    useGetTrainingAttendanceClassSheetQuery(downloadClassroomId, {
      skip: !downloadClassroomId,
    });

  useEffect(() => {
    refetch(); // Refresh data on mount
  }, [refetch]);
  // Handle search input change
  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  // Handle classroom edit button click
  const handleEditClassroom = (classroom) => {
    navigate("/class-room-training-edit", { state: { classroom } });
  };

  // Handle session button click
  const handleSession = (classroom) => {
    if (classroom.classroom_id) {
      navigate(`/session-list/${classroom.classroom_id}?is_preview=${classroom.is_preview}`);
    } else {
      console.log("ClassroomId not exist.");
    }
  };

  const handleFileView = async (rowData) => {
    console.log(rowData.classroom_id);

    navigate("/classroom-file-view", { state: { rowData } });
  };

  // Open the assessment warning modal
  const handleAssessmentClick = (rowData) => {
    setSelectedClassroom(rowData);
    setStartAssessmentModal(true);
  };

  // Close the assessment warning modal
  const handleAssesmentModalClose = () => {
    setStartAssessmentModal(false);
    setSelectedClassroom(null);
  };

  // Start the assessment after confirmation
  const startAssessmentClick = () => {
    if (selectedClassroom?.classroom_id) {
      navigate(`/exam-mcq-module/${selectedClassroom.classroom_id}`);
    } else {
      toast.error("Classroom ID is missing");
    }
    setStartAssessmentModal(false);
  };

  const handleDownloadAttendanceSheet = (documentId, classroomId) => {
    if (documentId) {
      setDownloadDocumentId(documentId);
    } else if (classroomId) {
      setDownloadClassroomId(classroomId);
    } else {
      toast.error("No valid document or classroom ID available for download.");
    }
  };

  useEffect(() => {
    const handleDownload = (data, id) => {
      if (data && id) {
        if (data.status === false) {
          toast.error(`Failed to download attendance sheet: ${data.message}`);
          setDownloadDocumentId(null);
          setDownloadClassroomId(null);
          return;
        }
        const url = data.data;
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `attendance_sheet_${id}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        setDownloadDocumentId(null);
        setDownloadClassroomId(null);
        toast.success("Attendance sheet downloaded successfully!");
      }
    };

    handleDownload(attendanceSheetData, downloadDocumentId);
    handleDownload(attendanceClassSheetData, downloadClassroomId);
  }, [attendanceSheetData, downloadDocumentId, attendanceClassSheetData, downloadClassroomId]);

  // Handle error in attendance sheet download
  useEffect(() => {
    if (isAttendanceSheetError) {
      toast.error(`Failed to download attendance sheet: ${attendanceSheetError?.message}`, {});
      setDownloadDocumentId(null); // Reset the document ID
    }
  }, [isAttendanceSheetError, attendanceSheetError]);

  if (isLoading) {
    return (
      <MDBox
        sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}
      >
        <CircularProgress size={50} />
      </MDBox>
    );
  }

  if (isError) {
    toast.error(`Error: ${error?.message}`);
    return <MDTypography color="error.main">Failed to load classroom data.</MDTypography>;
  }

  // Filter classroom data based on search term
  const filteredData = data?.data
    ?.filter(
      (classroom) =>
        classroom.classroom_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        classroom.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .map((classroom, index) => ({
      ...classroom,
      serial_number: index + 1,
      start_date: moment(classroom.created_at).format("DD/MM/YY HH:mm"),
    }));

  // Columns configuration
  const columns = [
    { field: "serial_number", headerName: "Sr. No.", flex: 0.5, headerAlign: "center" },
    { field: "classroom_name", headerName: "Class Name", flex: 1, headerAlign: "center" },
    { field: "start_date", headerName: "Start Date & Time", flex: 1, headerAlign: "center" },
    { field: "is_assesment", headerName: "Assesment", flex: 1, headerAlign: "center" },
    {
      field: "session",
      headerName: "Session",
      flex: 1,
      headerAlign: "center",
      renderCell: (params) => (
        <MDButton variant="outlined" color="primary" onClick={() => handleSession(params.row)}>
          Start Session
        </MDButton>
      ),
    },
    {
      field: "View",
      headerName: "Pre-View",
      flex: 0.5,
      headerAlign: "center",
      renderCell: (params) => (
        <IconButton
          color="warning"
          onClick={() => handleFileView(params.row)}
          // disabled={params.row.files.length === 0}
        >
          <SlideshowIcon />
        </IconButton>
      ),
    },
    ...(groupId === 7
      ? [
          {
            field: "question",
            headerName: "Question",
            flex: 1,
            headerAlign: "center",
            renderCell: (params) => (
              <MDButton
                variant="outlined"
                color="info"
                // onClick={() => navigate("/class-question", { state: { classroom: params.row } })}
                onClick={() => navigate(`/class-question/${params.row?.classroom_id}`)}
                // onClick={() => {
                //   console.log(params.row)
                // }}

                disabled={
                  params.row.is_assesment === "Without Assessment" ||
                  params.row.document !== null ||
                  params.row.is_all_completed
                } // Disable if 'is_assesment' is 'With Assessment'
              >
                Questions
              </MDButton>
            ),
          },
        ]
      : []),
    ...(groupId === 7
      ? [
          {
            field: "quiz",
            headerName: "Quiz",
            flex: 1,
            headerAlign: "center",
            renderCell: (params) => (
              <MDButton
                variant="outlined"
                color="secondary"
                onClick={() => navigate("/class-quiz", { state: { classroom: params.row } })}
                disabled={
                  params.row.is_assesment === "Without Assessment" ||
                  params.row.document !== null ||
                  params.row.is_all_completed
                } // Disable if 'is_assesment' is 'With Assessment'
              >
                Quiz
              </MDButton>
            ),
          },
        ]
      : []),
    ...(groupId !== 7
      ? [
          {
            field: "assessment",
            headerName: "Assessment",
            flex: 1,
            headerAlign: "center",
            renderCell: (params) => (
              <MDButton
                variant="outlined"
                color="warning"
                onClick={() => handleAssessmentClick(params.row)}
                disabled={
                  params.row.classroom_attempted ||
                  !params.row.is_all_completed ||
                  params.row.quiz_count === 0
                }
              >
                Assessment
              </MDButton>
            ),
          },
        ]
      : []),
    ...(groupId === 7
      ? [
          {
            field: "attendance",
            headerName: "Attendance",
            flex: 1.4,
            headerAlign: "center",
            renderCell: (params) => (
              <MDButton
                variant="outlined"
                color="success"
                onClick={() =>
                  handleDownloadAttendanceSheet(params.row.document, params.row.classroom_id)
                }
                disabled={!params.row.is_all_completed}
              >
                Attendance Sheet
              </MDButton>
            ),
          },
        ]
      : []),
  ];

  const getRowId = (row) => {
    if (row.classroom_name && row.created_at) {
      return `${row.classroom_name}-${row.created_at}`;
    } else {
      return row.serial_number || Date.now();
    }
  };

  return (
    <MDBox p={3}>
      {/* Assessment Warning Modal */}
      <Dialog
        open={startAssessmentModal}
        onClose={handleAssesmentModalClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{"Start Assessment?"}</DialogTitle>
        <DialogContent>
          <DialogContentText
            sx={{
              padding: "15px",
            }}
            id="alert-dialog-description"
          >
            Are you sure you want to start the assessment?
            <br />
            <br />
            <strong>Important:</strong> Once you start the assessment:
            <ul>
              <li>You can only attempt the classroom assessment once.</li>
              <li>You must complete and submit it before leaving.</li>
            </ul>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAssesmentModalClose}>Cancel</Button>
          <MDButton onClick={startAssessmentClick} autoFocus color="primary" variant="contained">
            Start Assessment
          </MDButton>
        </DialogActions>
      </Dialog>

      <Card sx={{ maxWidth: "80%", mx: "auto", mt: 3, marginLeft: "auto", marginRight: 0 }}>
        <MDBox p={3} display="flex" alignItems="center">
          <MDInput
            label="Search"
            variant="outlined"
            size="small"
            sx={{ width: "250px", mr: 2 }}
            value={searchTerm}
            onChange={handleSearch}
          />
          <MDTypography variant="h4" fontWeight="medium" sx={{ flexGrow: 1, textAlign: "center" }}>
            Class Room Listing
          </MDTypography>
          <MDButton
            variant="contained"
            color="primary"
            onClick={() => navigate("/classroom-training")}
            sx={{ ml: 2 }}
          >
            Add Classroom
          </MDButton>
        </MDBox>
        <MDBox display="flex" justifyContent="center" p={2}>
          <div style={{ height: 500, width: "100%", overflow: "auto" }}>
            <DataGrid
              rows={filteredData || []} // Use filteredData if available
              columns={columns}
              pageSize={5}
              rowsPerPageOptions={[5, 10, 20]}
              disableSelectionOnClick
              getRowId={getRowId} // Specify how to get the row's unique id
              sx={{
                minWidth: 1400,
                border: "1px solid #ddd",
                borderRadius: "4px",
                "& .MuiDataGrid-columnHeaders": {
                  display: "flex",
                  justifyContent: "center",
                  backgroundColor: "#f5f5f5",
                  fontWeight: "bold",
                },
                "& .MuiDataGrid-cell": {
                  textAlign: "center",
                },
              }}
            />
          </div>
        </MDBox>
      </Card>
    </MDBox>
  );
};

export default ClassroomListing;
