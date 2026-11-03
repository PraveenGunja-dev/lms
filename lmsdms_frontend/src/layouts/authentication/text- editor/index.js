import React, { useEffect, useState, useRef, useContext } from "react";
import "quill/dist/quill.snow.css";
import { useParams } from "react-router-dom";
import OrdersOverview from "layouts/dashboard/components/OrdersOverview";
import { Box, IconButton, Paper, TextareaAutosize, TextField } from "@mui/material";
import MDBox from "components/MDBox";
import Grid from "@mui/material/Grid";
import MDButton from "components/MDButton";
import {
  useGetTemplateQuery,
  useCreateDocumentMutation,
  useDocumentReviewStatusMutation,
  useDocumentDocadminStatusMutation,
} from "api/auth/texteditorApi";
import ESignatureDialog from "layouts/authentication/ESignatureDialog";
import { useCreateCommentMutation } from "api/auth/commentsApi";
import { useNavigate, useLocation } from "react-router-dom";
import { useDraftDocumentMutation } from "api/auth/texteditorApi";
import {
  useDocumentApproveStatusMutation,
  useDocumentApproverStatusMutation,
} from "api/auth/texteditorApi";
import SendBackDialog from "./sendback";
import { useDocumentSendBackStatusMutation } from "api/auth/texteditorApi";
import { useFetchDocumentsQuery } from "api/auth/documentApi";
import { toast, ToastContainer } from "react-toastify";
import RemarkDialog from "./remark";
import SelectUserDialog from "./user-select";
import { Button, AppBar, Toolbar, Typography, CircularProgress } from "@mui/material";
import { useAddPathUrlDataForCommentsMutation } from "api/auth/editDocumentApi";
import ViewUserDialog from "./view-user";
import { AuthContext } from "context/auth-context";
import { useDocTimeLineQuery } from "api/auth/timeLineApi";
import { useFetchSendbackDataQuery } from "api/auth/documentApi";
import { getErrorMessage } from "services/baseQuery";

const DocumentView = () => {
  const { id } = useParams();
  const { data: reviewerData, refetch: reviewerRefetch } = useFetchSendbackDataQuery(id); 
  const { user, setValue } = useContext(AuthContext);
  const currentUserID = user.id;
  const sendBackRequests = reviewerData?.send_back_requests || [];

  const isUserSendBack = sendBackRequests.some(
    (request) => request.user_id == currentUserID && request.is_send_back
  );
  const shouldShowSendBackButton = !isUserSendBack;
  useEffect(() => {
    reviewerRefetch();
  }, [reviewerRefetch]);
  // console.log("Reviewer Data", reviewerData);
  const [loading, setLoading] = useState(true);
  const docEditorRef = useRef(null);
  const [addPathUrlDataForComments, { isLoading: isAddingComment }] =
    useAddPathUrlDataForCommentsMutation();
  const { refetch } = useDocTimeLineQuery(id);
  // const [saving, setSaving] = useState(false);
  const [Error1, setError] = useState(null);
  const [docEditorLoaded, setDocEditorLoaded] = useState(false);
  const [editorConfig, setEditorConfig] = useState(null);
  const { data: templateData, isError, error: apiError } = useGetTemplateQuery(id);
  const quillRef = useRef(null);
  const [opencommentDialog, setOpencommentDialog] = useState(false);
  const [selectedRange, setSelectedRange] = useState(null);
  const [createDocument] = useCreateDocumentMutation();
  const [createComment] = useCreateCommentMutation();
  const { data, error, isLoading } = useGetTemplateQuery(id);
  // console.log("Template ID:", data?.select_template);
  const [draftDocument] = useDraftDocumentMutation();
  const [documentReviewStatus] = useDocumentReviewStatusMutation();
  const navigate = useNavigate();
  const [documentApproveStatus] = useDocumentApproveStatusMutation();
  const [documentSendBackStatus] = useDocumentSendBackStatusMutation();
  const [documentApproverStatus] = useDocumentApproverStatusMutation();
  const [documentDocAdmin] = useDocumentDocadminStatusMutation();
  const searchParams = new URLSearchParams(location.search);
  const document_current_status = searchParams.get("status");
  // console.log("Document status:::",typeof document_current_status)
  const approval_status = searchParams.get("approval_status");
  const version = searchParams.get("version");
  const templateIDMain = searchParams.get("templateID");
  const is_reviewed = searchParams.get("is_reviewed");
  // console.log("Test..",typeof version);
  console.log("Test2..", typeof templateIDMain);

  // console.log("------------------------------------------", typeof is_reviewed);
  const [isSaved, setIsSaved] = useState(false);
  const handleDownloadSave = () => {
    setIsSaved(true);
    handleDownloadFeature(); // Existing save function
  };
  const [dialogOpen, setDialogOpen] = useState(false); // Manage dialog visibility
  const [assignedTo, setAssignedTo] = useState(""); // State for Assigned To dropdown
  const [statusSendBack, setStatusSendBack] = useState(""); // State for Status Send Back dropdown

  const { data: documentsData, isLoading: isDocumentsLoading } = useFetchDocumentsQuery();
  const [openSignatureDialog, setOpenSignatureDialog] = useState(false);
  const [action, setAction] = useState("");
  const [openRemarkDialog, setOpenRemarkDialog] = useState(false);
  const [remark, setRemark] = useState(""); // Store entered remark
  const [openuserDialog, setOpenuserDialog] = useState(false);
  const [openviewuserDialog, setopenviewuserDialog] = useState(false);
  const [approver, setApprover] = useState("");
  const [reviewer, setReviewer] = useState([]);
  const [docAdmin, setDocAdmin] = useState("");
  const [cacheDocument, setCacheDocument] = useState("");
  const docCommentsRef = useRef([]);

  // console.log("User====>",user.id);

  const userGroupIds = documentsData?.userGroupIds || [];
  const isButtonVisible = (requiredGroupIds) => {
    // console.log(
    //   "Checking visibility for groups:",
    //   requiredGroupIds,
    //   "against user groups:",
    //   userGroupIds
    // );
    return requiredGroupIds.some((id) => userGroupIds.includes(id));
  };

  useEffect(() => {
    if (isLoading) return;

    if (isError) {
      setError(apiError?.message || "Failed to fetch template data");
      setLoading(false);
      return;
    }
    if (templateData) {
      const fetchEditorConfig = async () => {
        try {
          const response = await fetch(
            // `http://127.0.0.1:8000/dms_module/get_editor_config?template_id=${data?.select_template}`,
            // `http://127.0.0.1:8000/dms_module/get_editor_config?document_id=${id}&template_id=${templateIDMain}`,
            `${
              process.env.REACT_APP_APIKEY
            }dms_module/get_editor_config?document_id=${id}&template_id=${templateIDMain}&is_view=${false}`,
            // http://127.0.0.1:8000/dms_module/get_editor_config?document_id=${id}&template_id=${templateIDMain}
            {
              // const response = await fetch(`http://43.204.122.158:8080/dms_module/get_editor_config?template_id=${data?.select_template}`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${sessionStorage.getItem("token")}` },
              body: JSON.stringify({
                url: templateData,
                // url:documentFilter?.front_file_url,
                user_name: "John Doe",
              }),
            }
          );
          if (!response.ok) {
            throw new Error("Failed to fetch editor configuration");
          }

          const config = await response.json();
          setEditorConfig(config);
          setDocEditorLoaded(true);
        } catch (fetchError) {
          setError("Failed to fetch ONLYOFFICE configuration");
          // console.error(fetchError);
        } finally {
          setLoading(false);
        }
      };

      fetchEditorConfig();
    } else {
      setError("Template URL is missing in the API response");
      setLoading(false);
    }
    return () => {
      setEditorConfig(null);
      setDocEditorLoaded(false);
      // console.log("Cleanup: Resetting editor config");
    };
  }, [isLoading, isError, templateData, apiError]);

  useEffect(() => {
    if (docEditorLoaded && editorConfig) {
      const script = document.createElement("script");
      script.src = process.env.REACT_APP_ONLYOFFICE_SCRIPT;
      // script.src = "http://127.0.0.1/web-apps/apps/api/documents/api.js"; // ONLYOFFICE API script URL
      // script.src = "http://13.232.63.196:8080/web-apps/apps/api/documents/api.js"
      // console.log("Callback troubleshoot:::",editorConfig)
      script.onload = () => {
        try {
          docEditorRef.current = new window.DocsAPI.DocEditor("onlyoffice-editor-container", {
            width: "100%",
            height: "100%",
            type: "desktop",
            document: editorConfig.document,
            editorConfig: {
              mode: "edit", // Ensure the document is in edit mode
              callbackUrl: editorConfig.callbackUrl, // Save callback URL
              user: {
                id: "1",
                // name: "Rohit Sharma",
                name: `${user?.first_name}`,
              },
              watermark: {
                text: "Confidential nonono", // The text of the watermark
                color: "rgba(255, 0, 0, 0.5)", // Semi-transparent light gray color
                fontSize: 50, // Size of the watermark text
                diagonal: true, // Place the watermark diagonally
                visibleForAllUsers: true, // Make the watermark visible for all users
              },
              customization: {
                autosave: false,
                forcesave: false, // Enable forced saving
                features: {
                  forcesave: false,
                  autosave: false,
                },
                saveButton: false, // Enable save button
                showReviewChanges: false,
                trackChanges: true,
                chat: false,
                comments: true,
                zoom: 100,
                compactHeader: false,
                leftMenu: true,
                rightMenu: false,
                toolbar: true,
                statusBar: true,
                autosaveMessage: false,
                forcesaveMessage: false,
              },
            },
            events: {
              onDocumentStateChange: (event) => {},
              onAppReady: async () => {
                window.docEditor = docEditorRef.current;
                try {
                } catch (error) {
                  console.error("Error inserting header:", error);
                }
              },
              onError: (event) => {
                console.error("Editor error:", event);
                return true;
              },
              onDownloadAs: async (response) => {
                try {
                  const cacheUrl = response?.data?.url;
                  setCacheDocument(cacheUrl);
                  let newVersion = version;
                  if (document_current_status !== "6" && document_current_status !== "7") {
                    newVersion = (parseFloat(version) + 0.01).toFixed(2); // Ensures two decimal place
                  }

                  if (cacheUrl) {
                    const draftData = {
                      user: user?.id,
                      document_id: id,
                      comment_data: docCommentsRef?.current,
                      version_no: newVersion,
                      front_file_url: cacheUrl,
                      department_id: String(user?.department),
                      // templateID: data?.select_template,
                      // userEmail: user?.email,
                      // username: user?.first_name,
                    };
                    try {
                      // Send the comment data to the API
                      const result = await addPathUrlDataForComments(draftData).unwrap();
                      // console.log("Data Added", result);
                      toast.success("Document Saved.");
                    } catch (apiError) {
                      console.error("Error saving comment:", apiError);
                      // You might want to show an error message to the user here
                    }
                  }

                  return true; // Allow the normal download to proceed
                } catch (error) {
                  // console.error("Error saving document:", error);
                  return true;
                }
              },
            },
            token: editorConfig.token, // Pass the authentication token
          });
        } catch (initError) {
          setError("Failed to initialize ONLYOFFICE editor");
          // console.error(initError);
        }
      };
      script.onerror = () => {
        setError("Failed to load ONLYOFFICE script");
        console.error("Script load error");
      };
      document.body.appendChild(script);
      return () => {
        if (docEditorRef.current) {
          docEditorRef.current.destroyEditor(); // Destroy the ONLYOFFICE instance
          docEditorRef.current = null;
          // console.log("Cleanup: ONLYOFFICE editor destroyed");
        }

        document.body.removeChild(script); // Remove script tag
        // console.log("Cleanup: ONLYOFFICE script removed");
      };
    }
  }, [docEditorLoaded, editorConfig]);

  const handleRemarkConfirm = async (remark) => {
    // Close RemarkDialog and open E-Signature dialog
    setOpenRemarkDialog(false);
    setRemark(remark);
    // console.log("-+-+-+-+-+-+-+-+-++-+-+-+--+-+", remark);
    // Now proceed to E-Signature dialog
    setOpenSignatureDialog(true);
  };

  const handleSignatureComplete = async (password) => {
    setOpenSignatureDialog(false);

    if (!password) {
      toast.error("E-Signature is required to proceed.");
      return;
    }

    try {
      let response;
      switch (action) {
        case "saveDraft":
          response = await draftDocument({ document_id: id, status_id: 2, remark }).unwrap();
          toast.success("Saved as Draft!");
          break;
        case "submit":
          response = await documentApproveStatus({
            document_id: id,
            status: "3",
            remark,
            visible_to_users: reviewer,
            approver,
            doc_admin: docAdmin,
          }).unwrap();

          toast.success("Document Submitted!");
          break;
        case "review":
          response = await documentReviewStatus({ document_id: id, status: "4", remark }).unwrap();
          toast.success("Document Reviewed!");
          break;
        case "approve":
          response = await documentApproverStatus({
            document_id: id,
            status: "9",
            remark,
          }).unwrap();
          toast.success("Document Approved!");
          break;
        default:
          throw new Error("Invalid action");
      }
      refetch();
      // Navigate after success
      setTimeout(() => {
        navigate("/document-listing");
      }, 2000);
    } catch (error) {
      // console.error("API Error:", error);
      toast.error(getErrorMessage(error, "Failed to process the action. Please try again."));
    }
  };

  const handleSaveDraft = () => {
    setAction("saveDraft");
    setOpenSignatureDialog(true);
  };

  const handleSubmit = () => {
    setAction("submit");

    if (document_current_status == 8) {
      setOpenRemarkDialog(true);
    } else {
      setOpenuserDialog(true);
    }
  };

  const handleReview = () => {
    setAction("review");
    setOpenRemarkDialog(true);
  };

  const handleApprove = () => {
    setAction("approve");
    setOpenRemarkDialog(true);
  };

  const handleAddComment = () => {
    const quill = quillRef.current;
    const range = quill.getSelection();
    if (range) {
      setSelectedRange(range);
      setOpencommentDialog(true); // Open modal instead of drawer
    } else {
      alert("Please select text to add a comment.");
    }
  };

  const handlePrint = () => {
    navigate(`/print-document/${id}?status=${document_current_status}`);
  };
  
  const handleOpenDialog = () => {
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  // Handle dialog confirm
  const handleConfirmDialog = async () => {
    try {
      // Call the API using the mutation hook and pass the required data directly
      const response = await documentSendBackStatus({
        document_id: id, // Replace with your actual document_id
        assigned_to: assignedTo, // Value from the dialog's state
        status_sendback: "8", // The current status (replace with actual status if needed)
        remark: remark, // Include the remark field
      }).unwrap();

      if (response.status) {
        toast.success("Document Sent Back Successfully!");
        setTimeout(() => {
          navigate("/document-listing");
        }, 2000);
      } else {
        alert("Action failed. Please try again."); // Failure alert
      }
    } catch (error) {
      // console.error("Error calling API:", error);
      toast.error("Failed to Send Back. Please try again.");
    }
  };

  const container = document.getElementById("onlyoffice-editor-container");

  const handleDownloadFeature = async () => {
    try {
      // console.log("Hit Featureeeeeeeeee ---------->");
      if (docEditorRef.current) {
        docEditorRef.current.downloadAs("docx", async (blobUrl) => {
          // console.log("Blob URL:", blobUrl);
        });
        // console.log("Docc")
        setIsSaved(true);
      }
    } catch (error) {
      console.error("Save failed:", error);
    }
  };

  const handleDialogOpen = () => {
    // console.log("Doc Admin Approve clicked - Confirmed");
    setDialogeffectiveOpen(true); // Open the dialog
  };

  if (loading || isLoading) {
    return (
      <Box padding={2} display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
        <Typography sx={{ marginLeft: 2 }}>Loading editor...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box padding={2} display="flex" justifyContent="center" alignItems="center" height="100vh">
        <Typography variant="h6" color="error">{`Error: ${error.message}`}</Typography>
      </Box>
    );
  }

  const handleOpeusernDialog = () => {
    setOpenuserDialog(true);
  };

  const handleuserCloseDialog = () => {
    setOpenuserDialog(false);
    setOpenRemarkDialog(true);
  };
  const handleConfirmSelection = (selectedUsers) => {
    setApprover(selectedUsers.approver);
    setReviewer(selectedUsers.reviewer);
    setDocAdmin(selectedUsers.docAdmin);

    setOpenuserDialog(false); // Close the SelectUserDialog
    setOpenRemarkDialog(true); // Now open the RemarkDialog
  };
  const handleviewuserCloseDialog = () => {
    setopenviewuserDialog(false);
    setOpenRemarkDialog(true);
  };
  const handleConfirmViewSelection = (selectedUsers) => {
    setApprover(selectedUsers.approver);
    setReviewer(selectedUsers.reviewer);
    setDocAdmin(selectedUsers.docAdmin);

    setopenviewuserDialog(false);
    setOpenRemarkDialog(true);
  };
  return (
    <MDBox
      sx={{
        fontFamily: "Arial, sans-serif",
        display: "flex",
        flexDirection: "column",
        height: "190vh",
        backgroundColor: "#f4f4f4",
        minHeight: "100vh",
        position: "relative",
      }}
    >
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Document Editor
          </Typography>
        </Toolbar>
      </AppBar>
      <Box
        id="onlyoffice-editor-container"
        sx={{
          flex: 1,
          backgroundColor: "#fff",
          boxShadow: 2,
          margin: "20px",
        }}
      />
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          padding: 2,
          backgroundColor: "#f4f4f4",
        }}
      >
        <MDBox mt={2} display="flex" justifyContent="center" gap={2}>
          {/* Condition 1: Show Submit and Save Draft buttons when status is "1" or "2" */}
          {(document_current_status === "1" ||
            document_current_status === "2" ||
            document_current_status === "10" ||
            document_current_status === "8") &&
            isButtonVisible([2]) && (
              <>
                <MDButton
                  variant="gradient"
                  color="submit"
                  type="button" // Set to "button" to prevent default form submission
                  onClick={handleSubmit}
                  disabled={isLoading || !isSaved} // Disable the button while the API call is in progress
                >
                  {isLoading ? "Submitting..." : "Submit"}
                </MDButton>
                <MDButton
                  variant="gradient"
                  color="submit"
                  // onClick={handleSaveDraft}
                  onClick={handleDownloadFeature}
                  disabled={isLoading}
                >
                  Save
                </MDButton>
              </>
            )}
          {/* Condition 2: Show Review button when status is "For Under Review" */}
          {(document_current_status === "3" ||
            document_current_status === "2" ||
            document_current_status === "8") &&
            is_reviewed !== "true" &&
            isButtonVisible([3]) && (
              <>
                {shouldShowSendBackButton && (
                  <MDButton
                    variant="gradient"
                    color="submit"
                    onClick={handleReview}
                    disabled={isLoading || !isSaved}
                  >
                    Review
                  </MDButton>
                )}
                {shouldShowSendBackButton && (
                  <MDButton
                    variant="gradient"
                    color="error"
                    onClick={handleOpenDialog}
                    disabled={isLoading || !isSaved}
                  >
                    Send Back
                  </MDButton>
                )}
                <MDButton
                  variant="gradient"
                  color="submit"
                  // onClick={handleSaveDraft}
                  onClick={handleDownloadFeature}
                  disabled={isLoading}
                >
                  Save
                </MDButton>
              </>
            )}

          {/* Condition 3: Show Approve button when status is "Approver" */}
          {(document_current_status === "4" || document_current_status === "2") &&
            isButtonVisible([4]) && (
              <>
                <MDButton
                  variant="gradient"
                  color="submit"
                  onClick={handleApprove}
                  disabled={isLoading || !isSaved}
                >
                  Approve
                </MDButton>
                <MDButton
                  variant="gradient"
                  onClick={handleOpenDialog}
                  color="error"
                  disabled={isLoading || !isSaved}
                >
                  Send Back
                </MDButton>
                <MDButton
                  variant="gradient"
                  color="submit"
                  // onClick={handleSaveDraft}
                  onClick={handleDownloadFeature}
                  disabled={isLoading}
                >
                  Save
                </MDButton>
              </>
            )}
          {/* Condition 4 */}
          {document_current_status === "5" && isButtonVisible([5]) && (
            <>
              {/* <MDButton variant="gradient" color="submit" onClick={handleDoc} disabled={isLoading}>
              Doc Admin Approve
            </MDButton> */}
              {/* <MDButton
                variant="gradient"
                color="error"
                onClick={handleOpenDialog}
                disabled={isLoading || !isSaved}
              >
                Send Back
              </MDButton> */}
            </>
          )}
          {/* Display success or error messages */}
          {data && <p>{data.message}</p>}
          {error && <p>Error: {error.message}</p>}

          {/* <MDButton
            variant="gradient"
            color="submit"
            onClick={handleSaveDraft}
            // onClick={handleDownloadFeature}
            disabled={isLoading}
          >
            Save Draft
          </MDButton> */}
          {/* <button
          onClick={handleSave}
          className={`px-4 py-2 rounded ${
            saving 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-500 hover:bg-blue-600'
          } text-white font-medium`}
        >
          {true ? 'Saving...' : 'Save Document'}
        </button> */}
          <MDButton
            variant="gradient"
            color="submit"
            onClick={() => {
              handlePrint();
            }}
          >
            Print
          </MDButton>
        </MDBox>
      </Box>

      <MDBox
        sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}
      >
        {/* import time line code  */}
        <Grid container spacing={3} justifyContent="center" alignItems="center">
          <Grid
            item
            xs={12}
            md={6}
            lg={4}
            sx={{
              maxHeight: "500px", // Adjust the height as needed
              overflowY: "auto",
              border: "1px solid #ddd", // Optional: Just to visually separate it
              padding: "10px",
              backgroundColor: "#fff",
            }}
          >
            <OrdersOverview docId={id} />
          </Grid>
        </Grid>
      </MDBox>
      <div></div>
      <SendBackDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        onConfirm={handleConfirmDialog}
        assignedTo={assignedTo}
        setAssignedTo={setAssignedTo}
        remarks={remark}
        setRemarks={setRemark}
        documentId={id}
      />

      <ESignatureDialog
        open={openSignatureDialog}
        onClose={() => setOpenSignatureDialog(false)}
        onConfirm={handleSignatureComplete} // Only one action is passed here
      />
      <RemarkDialog
        open={openRemarkDialog}
        onClose={() => setOpenRemarkDialog(false)} // Close the RemarkDialog
        onConfirm={handleRemarkConfirm} // Handle the remark confirmation and proceed to E-Signature
      />

      <SelectUserDialog
        open={openuserDialog}
        onClose={handleuserCloseDialog}
        onConfirm={handleConfirmSelection}
      />
      <ViewUserDialog
        open={openviewuserDialog}
        onClose={handleviewuserCloseDialog}
        onConfirm={handleConfirmViewSelection}
        documentId={id}
      />
      {/* <ConditionalDialog
        open={dialogeffectiveOpen}
        onClose={handleDialogClose} // Handle dialog close
        onConfirm={handleDialogConfirm} // Handle dialog confirmation
        trainingStatus={trainingRequired} // Pass trainingRequired as trainingStatus
        documentId={id}
      /> */}
      {/* <ToastContainer position="top-right" autoClose={3000} /> */}
    </MDBox>
  );
};

export default DocumentView;
