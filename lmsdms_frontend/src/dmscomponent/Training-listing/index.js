import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Card from "@mui/material/Card";
import { DataGrid } from "@mui/x-data-grid";
import IconButton from "@mui/material/IconButton";
import EditIcon from "@mui/icons-material/Edit";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDInput from "components/MDInput";
import MDButton from "components/MDButton";
import { useAuth } from "hooks/use-auth";
import moment from "moment";
import { useFetchTrainingsQuery } from "apilms/trainingApi"; // Update this path as needed
import VisibilityIcon from "@mui/icons-material/Visibility";
import QuestionAnswerOutlinedIcon from "@mui/icons-material/QuestionAnswerOutlined";
import BrowserUpdatedOutlinedIcon from "@mui/icons-material/BrowserUpdatedOutlined";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import ChecklistIcon from "@mui/icons-material/Checklist";
import QuizIcon from "@mui/icons-material/Quiz";
import WarningIcon from "@mui/icons-material/Warning";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WhiteListDialog from "./whitelist-users";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import FolderSharedOutlinedIcon from "@mui/icons-material/FolderSharedOutlined";
import ChildDocumentsDialog from "layouts/authentication/document-listing/child-document";
import { useFetchDocumentpendingReportQuery } from "apilms/trainingApi";
import DownloadIcon from "@mui/icons-material/Download";

const TrainingListing = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();
  const location = useLocation();
  const group = user?.user_permissions?.group || {};
  const groupId = group.id;
  // Fetch training data using the API query hook
  const { data, error, isLoading, refetch } = useFetchTrainingsQuery();
  const [blacklistModalOpen, setBlacklistModalOpen] = useState(false);
  const [openChildDialog, setOpenChildDialog] = useState(false);
  const [startAssessmentModal, setStartAssessmentModal] = useState(false);
  const [failedAssessmentModal, setFailedAssessmentModal] = useState(false);
  const [selectedRowData, setSelectedRowData] = useState(null);
  const [selectedChildDocuments, setSelectedChildDocuments] = useState([]);
  const [whiteListModalOpen, setWhiteListModalOpen] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [maxAttemptsModalOpen, setMaxAttemptsModalOpen] = useState(false);
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [selectedDownloadDocId, setSelectedDownloadDocId] = useState(null);
  const [downloadError, setDownloadError] = useState(null);
  const { data: downloadData, error: downloadQueryError } = useFetchDocumentpendingReportQuery(
    { documentId: selectedDownloadDocId },
    { skip: !selectedDownloadDocId }
  );

  const handleDownloadIconClick = (docId) => {
    setSelectedDownloadDocId(docId);
    setDownloadModalOpen(true);
    setDownloadError(null);
  };

  const handleDownloadConfirm = () => {
    try {
      if (downloadData?.status && downloadData?.data) {
        const link = document.createElement("a");
        link.href = downloadData.data;
        link.setAttribute("download", `training_report_${selectedDownloadDocId}.pdf`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Close modal after successful download
        handleDownloadModalClose();
      } else {
        setDownloadError("Unable to download report. Please try again.");
        console.error("Download failed:", downloadQueryError);
      }
    } catch (error) {
      setDownloadError("An unexpected error occurred while downloading the report.");
      console.error("Download error:", error);
    }
  };

  const handleDownloadModalClose = () => {
    setDownloadModalOpen(false);
    setSelectedDownloadDocId(null);
    setDownloadError(null);
  };

  const handleWhiteListModalOpen = (docId) => {
    setSelectedDocId(docId);
    setWhiteListModalOpen(true);
  };

  const handleWhiteListModalClose = () => {
    setWhiteListModalOpen(false);
    setSelectedDocId(null);
  };

  const handleBlacklistModalClose = () => {
    setBlacklistModalOpen(false);
  };
  const handleMaxAttemptsModalClose = () => {
    setMaxAttemptsModalOpen(false);
  };

  const handleViewChildDocuments = (row) => {
    setSelectedRowData(row);
    setSelectedChildDocuments([]);
    setOpenChildDialog(true);
  };

  const handleAssesmentModalClose = () => {
    setStartAssessmentModal(false);
    setSelectedRowData(null);
  };

  const handleFailedAssessmentModalClose = () => {
    setFailedAssessmentModal(false);
    setSelectedRowData(null);
  };

  useEffect(() => {
    refetch();
  }, [location.key]);

  const handleAddTraining = () => {
    navigate("/add-training");
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleEditTraining = (item) => {
    navigate("/edit-training", { state: { item } });
  };

  const handleQuestionClick = (rowData) => {
    // console.log(rowData)
    // navigate("/questions", { state: { rowData } });
    navigate(`/questions/${rowData}`);
  };

  const handleQuizClick = (DataQuiz) => {
    // console.log(DataQuiz);
    navigate(`/quiz-list/${DataQuiz.id}`);
    // navigate("/quiz-list", { state: { DataQuiz } });
  };

  const handleAssessmentClick = (rowId) => {
    // Get the document data for the selected row
    const document = data?.document_data?.documents.find((doc) => doc.id === rowId);
    setSelectedRowData(rowId);
    // console.log("rowwwwowow",rowId)
    // Check if the user has a failed quiz session for this document
    if (document && document.quiz_sessions) {
      const userQuizSession = document.quiz_sessions.find((session) => session.user === user.id);

      if (userQuizSession && userQuizSession.status === "Failed") {
        // Show the failed assessment modal
        setFailedAssessmentModal(true);
      } else {
        // Show the regular assessment modal
        setStartAssessmentModal(true);
      }
    } else {
      // If no quiz sessions exist, show the regular assessment modal
      setStartAssessmentModal(true);
    }
  };

  const startAssessmentClick = () => {
    if (selectedRowData) {
      // console.log("SelectedRow Data",selectedRowData)
      navigate(`/mcq-module/${selectedRowData}`);
      handleAssesmentModalClose();
    }
  };

  const goToClassroomActivities = () => {
    // Navigate to classroom activities page
    navigate("/classroom-activities");
    handleFailedAssessmentModalClose();
  };

  // const handleview = (item) => {
  //   const documentUrl = item;
  //   console.log(documentUrl)
  //   if (documentUrl) {
  //     navigate("/training-document-view", { state: { docId: item.docId, templateId: item.templateId } });
  //   }
  // };

  const handleview = (item) => {
    const documentUrl = item;
    console.log(documentUrl);
    if (documentUrl) {
      if (documentUrl.is_parent) {
        // Navigate to parent document view if document has children
        navigate("/parent-training-document-view", {
          state: { docId: item.docId, templateId: item.templateId },
        });
      } else {
        // Navigate to regular document view if document has no children
        navigate("/training-document-view", {
          state: { docId: item.docId, templateId: item.templateId },
        });
      }
    }
  };

  const filteredData = (
    Array.isArray(data?.document_data?.documents) ? data.document_data?.documents : []
  )
    .filter((item) => item.document_title.toLowerCase().includes(searchTerm.toLowerCase()))
    .map((item, index) => {
      return {
        id: item.id,
        serial_number: index + 1,
        document_name: item.document_title,
        document_type: item.document_type_name,
        document_number: item.document_number,
        version: item.version,
        created_date: moment(item.created_at).format("DD-MM-YY"),
        status: item.current_status_name,
        revision_date: item.revision_month,
        effective_date: item.effective_date
          ? moment(item.effective_date).format("DD-MM-YY")
          : "N/A",

        selected_template_url: item.selected_template_url,
        user_view: item.user_view,
        docId: item.id,
        templateId: item.select_template,
        quiz_sessions: item.quiz_sessions,
        is_parent: item.is_parent,
        quiz_count: item.quiz_count,
      };
    });

  const columns = [
    { field: "serial_number", headerName: "Sr. No.", flex: 0.5, headerAlign: "center" },
    { field: "document_name", headerName: "Title", flex: 1.5, headerAlign: "center" },
    { field: "document_type", headerName: "Type", flex: 1, headerAlign: "center" },
    {
      field: "sop_icon",
      headerName: "SOP Action",
      flex: 0.5,
      headerAlign: "center",
      renderCell: (params) => {
        const isSOP = params.row.document_type === "SOP";
        // console.log(params.row)
        return (
          <MDBox display="flex" justifyContent="center">
            <IconButton
              color="success"
              onClick={() => handleViewChildDocuments(params.row)}
              disabled={!isSOP} // Disable if document type is not SOP
            >
              <FolderSharedOutlinedIcon /> {/* Replace with the desired icon */}
            </IconButton>
          </MDBox>
        );
      },
      sortable: false,
      filterable: false,
    },
    { field: "document_number", headerName: "Document No", flex: 1.5, headerAlign: "center" },
    { field: "version", headerName: "Version", flex: 0.8, headerAlign: "center" },
    ...(groupId === 7
      ? [
          {
            field: "report_download",
            headerName: "Reports",
            headerAlign: "center",
            flex: 1,
            renderCell: (params) => (
              <MDBox display="flex" gap={1}>
                <IconButton color="error" onClick={() => handleDownloadIconClick(params.row.docId)}>
                  <BrowserUpdatedOutlinedIcon />
                </IconButton>
              </MDBox>
            ),
          },
        ]
      : []),
    { field: "created_date", headerName: "Created Date", flex: 1, headerAlign: "center" },
    { field: "status", headerName: "Status", flex: 1, headerAlign: "center" },
    { field: "effective_date", headerName: "Effective Date", flex: 1, headerAlign: "center" },
    {
      field: "action",
      headerName: "Action",
      flex: 0.8,
      headerAlign: "center",
      renderCell: (params) => (
        <MDBox display="flex" gap={1}>
          <IconButton
            color="success"
            onClick={() => {
              handleview(params.row);
            }}
          >
            <VisibilityIcon />
          </IconButton>
        </MDBox>
      ),
      sortable: false,
      filterable: false,
    },
    {
      field: "material",
      headerName: "Material",
      flex: 0.8,
      headerAlign: "center",
      renderCell: (params) => {
        return (
          <MDBox display="flex" justifyContent="center">
            <Button
              variant="contained"
              sx={{
                backgroundColor: "#ff3f3f",
                borderRadius: "20px",
                color: "white !important",
                padding: "2px 16px",
                fontSize: "12px",
                minHeight: "unset",
                height: "32px",
                textTransform: "none",
                "&:hover": {
                  backgroundColor: "red",
                  color: "white",
                },
              }}
              onClick={() => navigate(`/training-material/${params.row.id}`)}
            >
              Material
            </Button>
          </MDBox>
        );
      },
    },
    ...(groupId === 7
      ? [
          {
            field: "question",
            headerName: "Question",
            flex: 0.8,
            headerAlign: "center",
            renderCell: (params) => (
              <MDBox display="flex" justifyContent="center">
                <IconButton color="error" onClick={() => handleQuestionClick(params.row.id)}>
                  <QuestionAnswerOutlinedIcon />
                </IconButton>
              </MDBox>
            ),
            sortable: false,
            filterable: false,
          },
        ]
      : []),
    ...(groupId === 7
      ? [
          {
            field: "Quiz",
            headerName: "Quiz",
            flex: 0.8,
            headerAlign: "center",
            renderCell: (params) => (
              <MDBox display="flex" justifyContent="center">
                <IconButton color="secondary" onClick={() => handleQuizClick(params.row)}>
                  <QuizIcon />
                </IconButton>
              </MDBox>
            ),
            sortable: false,
            filterable: false,
          },
        ]
      : []),
    ...(groupId === 7
      ? [
          {
            field: "Whitlist Users",
            headerName: "Whitelist User",
            flex: 0.8,
            headerAlign: "center",
            renderCell: (params) => (
              <MDBox display="flex" justifyContent="center">
                <IconButton
                  color="secondary"
                  onClick={() => {
                    handleWhiteListModalOpen(params.row.docId);
                  }}
                >
                  <AdminPanelSettingsIcon />
                </IconButton>
              </MDBox>
            ),
            sortable: false,
            filterable: false,
          },
        ]
      : []),
    {
      field: "Assessment",
      headerName: "Assessment",
      flex: 0.8,
      headerAlign: "center",
      renderCell: (params) => {
        const isUserInView = params.row?.user_view?.some((view) => view.user === user.id);

        // Check if this document has a failed quiz session for the current user
        const document = data?.document_data?.documents.find((doc) => doc.id === params.row.id);
        const userQuizSession = document?.quiz_sessions?.find(
          (session) => session.user === user.id
        );
        const sessionStatus = (userQuizSession?.status || "").toLowerCase();
        const hasFailedStatus = sessionStatus === "failed";
        const hasPassedStatus = sessionStatus === "passed";
        const hasBlackListed = document?.training_assesment_attempted === true;
        const attemptCount = document?.attempt_count || 0;
        const maxAttempts = document?.max_attempts || 3;
        const maxAttemptsReached = !hasPassedStatus && attemptCount >= maxAttempts;
        const handleBlacklistedClick = () => {
          // Show dialog for blacklisted users
          setBlacklistModalOpen(true);
        };
        return (
          <MDBox display="flex" justifyContent="center">
            {hasPassedStatus ? (
              <IconButton disabled>
                <CheckCircleIcon style={{ color: "green" }} />
              </IconButton>
            ) : hasBlackListed ? (
              <IconButton color="default" onClick={handleBlacklistedClick}>
                <WarningIcon style={{ color: "gray" }} />
              </IconButton>
            ) : maxAttemptsReached ? (
              // ADD THIS NEW CONDITION
              // The server decides: after classroom retraining a new attempt cycle is allowed,
              // otherwise the exam screen shows why the attempt was refused.
              <IconButton
                color="default"
                disabled={!isUserInView || params.row.quiz_count == 0}
                onClick={() => handleAssessmentClick(params.row.id)}
              >
                <WarningIcon style={{ color: "orange" }} />
              </IconButton>
            ) : (
              <IconButton
                disabled={!isUserInView || params.row.quiz_count == 0}
                color={hasFailedStatus ? "warning" : "error"}
                onClick={() => handleAssessmentClick(params.row.id)}
              >
                {hasFailedStatus ? <WarningIcon /> : <ChecklistIcon />}
              </IconButton>
            )}
          </MDBox>
        );
      },
      sortable: false,
      filterable: false,
    },
  ];

  return (
    <MDBox p={3}>
      <Card sx={{ maxWidth: "80%", mx: "auto", mt: 3, marginLeft: "auto", marginRight: 0 }}>
        <MDBox p={3} display="flex" alignItems="center">
          <MDInput
            label="Search Training"
            variant="outlined"
            size="small"
            sx={{ width: "100%", maxWidth: "300px", minWidth: "150px", mr: 2 }}
            value={searchTerm}
            onChange={handleSearch}
          />
          <MDTypography variant="h4" fontWeight="medium" sx={{ flexGrow: 1, textAlign: "center" }}>
            Training Listing
          </MDTypography>
        </MDBox>

        {isLoading ? (
          <MDTypography variant="h5" sx={{ textAlign: "center" }}>
            Loading...
          </MDTypography>
        ) : error ? (
          <MDTypography variant="h5" sx={{ textAlign: "center", color: "red" }}>
            Error fetching training data
          </MDTypography>
        ) : (
          <MDBox display="flex" justifyContent="center" p={2}>
            <div style={{ height: 600, width: "100%", overflow: "auto" }}>
              <DataGrid
                rows={filteredData}
                columns={columns}
                pageSize={7}
                rowsPerPageOptions={[5, 10, 20]}
                disableSelectionOnClick
                sx={{
                  minWidth: 1500,
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
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  },
                }}
              />
            </div>
          </MDBox>
        )}
      </Card>

      {/* Regular Assessment Modal */}
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
            <strong>Important:</strong> Once you start the exam:
            <ul>
              <li>You must complete and submit it before leaving.</li>
              <li>
                If you close or exit the exam without submitting, you will be{" "}
                <strong>blacklisted</strong> and will not be able to attempt the exam again.
              </li>
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

      {/* Failed Assessment Modal */}
      <Dialog
        open={failedAssessmentModal}
        onClose={handleFailedAssessmentModalClose}
        aria-labelledby="failed-assessment-dialog-title"
        aria-describedby="failed-assessment-dialog-description"
      >
        <DialogTitle
          id="failed-assessment-dialog-title"
          sx={{ display: "flex", alignItems: "center", color: "error.main" }}
        >
          <WarningIcon color="error" sx={{ mr: 1 }} />
          {"Assessment Failed"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="failed-assessment-dialog-description">
            You have failed this assessment after 3 attempts. Please complete the required classroom
            activities before attempting again.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleFailedAssessmentModalClose}>Close</Button>
          {/* <Button onClick={goToClassroomActivities} color="primary" variant="contained" autoFocus>
            Go to Classroom Activities
          </Button> */}
        </DialogActions>
      </Dialog>
      {/* Blacklisted Assessment Modal */}
      <Dialog
        open={blacklistModalOpen}
        onClose={handleBlacklistModalClose}
        aria-labelledby="blacklisted-dialog-title"
        aria-describedby="blacklisted-dialog-description"
      >
        <DialogTitle
          id="blacklisted-dialog-title"
          sx={{ display: "flex", alignItems: "center", color: "error.main" }}
        >
          <WarningIcon color="error" sx={{ mr: 1 }} />
          {"Assessment Access Restricted"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="blacklisted-dialog-description">
            You are blacklisted due to not submitting a previous assessment attempt. Please request
            DTC to whitelist your account to regain access.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleBlacklistModalClose}>Close</Button>
        </DialogActions>
      </Dialog>
      {/* Max Attempts Reached Modal */}
      <Dialog
        open={maxAttemptsModalOpen}
        onClose={handleMaxAttemptsModalClose}
        aria-labelledby="max-attempts-dialog-title"
        aria-describedby="max-attempts-dialog-description"
      >
        <DialogTitle
          id="max-attempts-dialog-title"
          sx={{ display: "flex", alignItems: "center", color: "warning.main" }}
        >
          <WarningIcon color="warning" sx={{ mr: 1 }} />
          {"Maximum Attempts Reached"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="max-attempts-dialog-description">
            You have reached the maximum number of attempts for this assessment. Please complete
            the classroom retraining before attempting again.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleMaxAttemptsModalClose}>Close</Button>
        </DialogActions>
      </Dialog>
      <ChildDocumentsDialog
        open={openChildDialog}
        onClose={() => setOpenChildDialog(false)}
        documentId={selectedRowData?.id || ""}
      />
      {/* Whitelist modal */}
      <WhiteListDialog
        open={whiteListModalOpen}
        onClose={handleWhiteListModalClose}
        documentId={selectedDocId}
      />

      <Dialog
        open={downloadModalOpen}
        onClose={handleDownloadModalClose}
        aria-labelledby="download-confirmation-dialog-title"
        aria-describedby="download-confirmation-dialog-description"
      >
        <DialogTitle id="download-confirmation-dialog-title">Confirm Download</DialogTitle>
        <DialogContent>
          <DialogContentText id="download-confirmation-dialog-description">
            Are you sure you want to download the report for this document?
          </DialogContentText>

          {downloadError && (
            <MDTypography variant="body2" color="error" sx={{ mt: 2 }}>
              {downloadError}
            </MDTypography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDownloadModalClose}>Cancel</Button>
          <MDButton
            onClick={handleDownloadConfirm}
            color="primary"
            variant="contained"
            disabled={!selectedDownloadDocId}
          >
            Download
          </MDButton>
        </DialogActions>
      </Dialog>
    </MDBox>
  );
};

export default TrainingListing;
