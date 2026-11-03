import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useFetchDocumentsQuery } from "api/auth/documentApi";
import Card from "@mui/material/Card";
import { DataGrid } from "@mui/x-data-grid";
import IconButton from "@mui/material/IconButton";
import EditIcon from "@mui/icons-material/Edit";
import EditCalendarIcon from "@mui/icons-material/EditCalendar";
import PreviewIcon from "@mui/icons-material/Preview";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDInput from "components/MDInput";
import MDButton from "components/MDButton";
import { hasPermission } from "utils/hasPermission";
import { FormControl, InputLabel, Select, MenuItem, OutlinedInput } from "@mui/material";
import PropTypes from "prop-types";
import { useFetchPermissionsByGroupIdQuery } from "api/auth/permissionApi";
import { useAuth } from "hooks/use-auth";
import moment from "moment";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ConditionalDialog from "./effective";
import VisibilityIcon from "@mui/icons-material/Visibility";
import BrowserUpdatedOutlinedIcon from "@mui/icons-material/BrowserUpdatedOutlined";
import RuleFolderIcon from "@mui/icons-material/RuleFolder";
import ImportContactsTwoToneIcon from "@mui/icons-material/ImportContactsTwoTone";
import FolderSharedOutlinedIcon from "@mui/icons-material/FolderSharedOutlined";
import ChildDocumentsDialog from "./child-document";
import SubtitlesOffIcon from "@mui/icons-material/SubtitlesOff";
import ObsoleteDialog from "./obsolete";
import { useUpdateObsoleteStatusMutation } from "api/auth/documentApi";
import { toast } from "react-toastify";
import EffectiveDialog from "./effectiveDialog";
import { useDocumentEffectiveMutation } from "api/auth/documentApi";
import HowToRegTwoToneIcon from "@mui/icons-material/HowToRegTwoTone";
import ViewSelectionDialog from "./view-user";
import { useFetchDepartmentsQuery } from "api/auth/departmentApi";
import { useFetchDocumentExcelReportQuery } from "api/auth/documentApi";
const DocumentListing = () => {
  const { user } = useAuth();
  const group = user?.user_permissions?.group || {};
  const groupId = group.id;
  // console.log("GRORORO",group)
  const [searchTerm, setSearchTerm] = useState("");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { data, refetch, isLoading, isError } = useFetchDocumentsQuery(groupId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [userGroupIds, setUserGroupIds] = useState([]);
  const [isReviseDialogOpen, setReviseDialogOpen] = useState(false); // Unique state for ReviseDialog
  const [reviseDocument, setReviseDocument] = useState(null); // Unique state for selected document
  const [openChildDialog, setOpenChildDialog] = useState(false);
  const [ObsoletedialogOpen, setObsoleteDialogOpen] = useState(false);
  const [selectedChildDocuments, setSelectedChildDocuments] = useState([]);
  const [isReportRequested, setIsReportRequested] = useState(false);
  const [updateObsoleteStatus] = useUpdateObsoleteStatusMutation();
  const [openDialog, setOpenDialog] = useState(false);
  const [openviewDialog, setOpenviewDialog] = useState(false);
  const [department, setDepartment] = useState("");
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [documentEffective, { isLoading: isEffecting, isError: isEffectError }] =
    useDocumentEffectiveMutation();
  const version = searchParams.get("version");
  const { data: departmentsData, isLoading: isDepartmentsLoading } = useFetchDepartmentsQuery();
  useEffect(() => {
    if (data && data.userGroupIds) {
      setUserGroupIds(data.userGroupIds);
      // console.log("User Group IDssss:", data.userGroupIds); // Corrected property name
    }
  }, [data]);

  useEffect(() => {
    refetch();
  }, [location.key]);
  const { data: response, error } = useFetchDocumentExcelReportQuery(
    {
      department_id: department,
    },
    {
      skip: !isReportRequested,
    }
  );

  const revisionMonth = data?.revision_month;

  const documents = data?.documents || [];

  const { data: userPermissions = [], isError: permissionError } =
    useFetchPermissionsByGroupIdQuery(groupId?.toString(), {
      skip: !groupId,
    });

  const handleDialogOpen = (row) => {
    setSelectedRow(row);
    setDialogOpen(true);
  };
  const handleViewChildDocuments = (row) => {
    setSelectedRow(row);
    setSelectedChildDocuments([]);
    setOpenChildDialog(true);
  };

  const handleViewUsers = (params) => {
    setSelectedRow(params.row);
    setOpenviewDialog(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedRow(null);
  };
  const handleObsoleteClose = () => {
    setObsoleteDialogOpen(false);
  };
  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };
  const handleAddDocument = () => {
    navigate("/add-document");
  };
  const handleObsolete = () => {
    navigate("/Obsolete-data");
  };
  const handleClick = (params) => {
    if (!params || !params.row) {
      console.error("Invalid params object:", params);
      return; // Exit if params or row is missing
    }

    const {
      original_id,
      document_current_status,
      select_template,
      training_required,
      approval_status,
      version,
      is_reviewed,
    } = params.row;
    // Ensure required fields are defined
    if (
      original_id === undefined ||
      document_current_status === undefined ||
      training_required === undefined ||
      approval_status === undefined ||
      is_reviewed === undefined
    ) {
      console.error("Missing data in params.row:", params.row);
      return;
    }
    // console.log("Console.log check for ID:",params?.row?.version)
    navigate(
      `/document-view/${original_id}?status=${document_current_status}&training_required=${training_required}&approvalstatus=${approval_status}&version=${version}&templateID=${select_template}&is_reviewed=${is_reviewed}`
    );
    // console.log("Navigated with:", {
    //   id,
    //   document_current_status,
    //   training_required,
    //   approval_status,
    // });
  };
  const handleReviseDialogOpen = (row) => {
    setSelectedRow(row);
    setReviseDialogOpen(true);
  };

  const handleReviseDialogClose = () => {
    setReviseDialogOpen(false);
    setReviseDocument(null);
  };
  const isButtonVisible = () => {
    return roles.some((role) => role.id === 5);
  };
  const handleReviseConfirm = () => {
    console.log("Revise confirmed for document:", reviseDocument);
    // Add any additional logic here
    handleReviseDialogClose();
  };
  const handleEffectiveClick = (row) => {
    if (row.document_type === 1 && !row.is_effective) {
      toast.warning("User needs to be assigned training before effective document.");
      return; // Prevent opening the dialog
    }
    setSelectedRow(row); // Set the row data
    setOpenDialog(true); // Open the dialog only if is_effective is true
  };
  const handleCloseDialog = () => {
    setOpenDialog(false); // Close the dialog
    setSelectedRow(null); // Reset row data
  };
  const handleConfirmEffective = async () => {
    if (selectedRow) {
      try {
        // Call the mutation with the document ID and status
        await documentEffective({
          document: selectedRow.original_id,
          status: "7", // Pass the status "7" as requested
        }).unwrap(); // unwrap to access the response directly

        // On success, show toast notification
        toast.success(`Document ${selectedRow.document_title} marked as effective!`);
      } catch (error) {
        // On failure, show error toast
        toast.error("Failed to mark the document as effective. Please try again.");
      }
    }

    // Close the dialog after the operation
    handleCloseDialog();
  };
  const handleViewFile = (url, new_url, params) => {
    // navigate("/PreView", { state: { templateDoc: url,new_url:new_url, templateData: params } }); // Pass the URL as state
    navigate("/docviewer", {
      state: {
        docId: params.original_id,
        templateId: params.select_template,
        document_current_status: params.document_current_status,
      },
    });
    // console.log(params)
    // console.log(params.id,params.select_template  )
  };

  const handleEditClick = (rowData) => {
    // Rows carry a grid-only composite id; the edit screen needs the real document id.
    navigate("/edit-document", { state: { item: { ...rowData, id: rowData.original_id } } });
    console.log("Full Row Data passed", rowData);
  };
  const handleObsoleteDialogOpen = (row) => {
    setSelectedRow(row);
    setObsoleteDialogOpen(true);
  };
  const handleObsoleteConfirm = async (documentId) => {
    try {
      await updateObsoleteStatus({
        document_id: documentId,
        status: "12",
      });
      toast.success("Document marked as obsolete successfully!");
      setObsoleteDialogOpen(false);
    } catch (error) {
      toast.error("Failed to mark the document as obsolete. Please try again.");
    }
  };

  const handleDownloadReport = () => {
    if (!department) {
      toast.error("Please select a department before generating the report.");
      return;
    }
    setIsReportRequested(true); // Trigger the request when the button is clicked
  };

  useEffect(() => {
    if (response && response.status && response.data) {
      // Set the download URL from the API response
      setDownloadUrl(response.data);
    }
  }, [response]);

  useEffect(() => {
    if (downloadUrl) {
      // Fetch the file from the URL and trigger the download
      fetch(downloadUrl)
        .then((res) => res.blob()) // Convert the response to a Blob
        .then((blob) => {
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = "document_report.xlsx"; // Set the desired file name
          document.body.appendChild(link); // Append the link to the body (required for Firefox)
          link.click();
          document.body.removeChild(link); // Clean up and remove the link
          setIsReportRequested(false); // Reset request flag after download
          setDownloadUrl(null); // Reset the download URL
        })
        .catch((error) => {
          console.error("Error downloading the file:", error);
          toast.error("Failed to download the report.");
          setIsReportRequested(false); // Reset request flag on error
        });
    }
  }, [downloadUrl]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error fetching the report: {error.message}</div>;
  }
  const filteredData = documents.filter(
    (doc) =>
      (doc.document_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.document_type_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.document_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.created_at.toLowerCase().includes(searchTerm.toLowerCase())) &&
      doc.document_current_status !== 12
  );
  //  const uniqueFilteredData = filteredData?.filter((doc, index, self) =>
  //   index === self.findIndex(d => d.id === doc.id)
  // );
  const rows = filteredData?.map((doc, index) => {
    const effectiveDate = doc.effective_date ? moment(doc.effective_date) : null;
    const revisionMonths = doc.revision_month ? parseInt(doc.revision_month, 10) : null;

    // Calculate revision_date only if effective_date exists and revision_month is valid
    let revisionDate = "N/A";
    if (effectiveDate && revisionMonths) {
      revisionDate = moment(effectiveDate).add(revisionMonths, "months").format("DD/MM/YY");
    }

    return {
      ...doc,
      original_id: doc.id, // ✅ keep backend id
      id: `${doc.id}-${index}`, // ✅ UNIQUE id for DataGrid
      srNo: index + 1, // ✅ correct Sr.No
      created_at: doc.created_at ? moment(doc.created_at).format("DD/MM/YY") : "N/A",
      effective_date: doc.effective_date ? moment(doc.effective_date).format("DD/MM/YY") : "N/A", // Keep as received from API
      revision_date: revisionDate, // Dynamically calculated
    };
  });

  const columns = [
    {
      field: "index",
      headerName: "Sr.No.",
      flex: 0.3,
      headerAlign: "center",
      renderCell: (params) => <span>{params.row.srNo}</span>,
      sortable: false,
      filterable: false,
    },
    {
      field: "document_title",
      headerName: "Title",
      flex: 1,
      headerAlign: "center",
    },
    {
      field: "document_type_name",
      headerName: "Type",
      flex: 0.5,
      headerAlign: "center",
    },
    {
      field: "sop_icon",
      headerName: "SOP Action",
      flex: 0.5,
      headerAlign: "center",
      renderCell: (params) => {
        const isSOP = params.row.document_type_name === "SOP";
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
    {
      field: "document_number",
      headerName: "Document No.",
      flex: 0.55,
      headerAlign: "center",
    },
    {
      field: "version",
      headerName: "Version",
      flex: 0.4,
      headerAlign: "center",
    },
    {
      field: "created_at",
      headerName: "Created Date",
      flex: 0.5,
      headerAlign: "center",
    },
    {
      field: "current_status_name",
      headerName: "Status",
      flex: 0.6,
      headerAlign: "center",
      renderCell: (params) => {
        // Check for the specific condition: is_done is true and current_status_name is "Under Reviewer"
        // console.log("Print params:::",params);
        if (
          groupId == 3 &&
          (params.row.is_done === false || params.row.is_done === null) &&
          params.row.document_current_status == 8
        ) {
          return <span>Under Reviewer</span>;
        }
        // Otherwise, display the original current_status_name
        return <span>{params.row.current_status_name}</span>;
      },
    },
    {
      field: "view_Users",
      headerName: "View Users",
      flex: 0.5,
      headerAlign: "center",
      renderCell: (params) => {
        return (
          <MDBox display="flex" justifyContent="center">
            <IconButton color="default" onClick={() => handleViewUsers(params)}>
              <HowToRegTwoToneIcon />
            </IconButton>
          </MDBox>
        );
      },
      sortable: false,
      filterable: false,
    },
    {
      field: "effective_date",
      headerName: "Effective Date",
      flex: 0.6,
      headerAlign: "center",
    },
    {
      field: "revision_date",
      headerName: "Revision Date",
      flex: 0.6,
      headerAlign: "center",
    },
    {
      field: "actions",
      headerName: "Action",
      flex: 0.9,
      headerAlign: "center",
      renderCell: (params) => (
        <MDBox display="flex" gap={1}>
          {hasPermission(userPermissions, "document", "isChange") && (
            <IconButton
              color="primary"
              onClick={() => handleEditClick(params.row)}
              disabled={params.row.document_current_status >= 7}
            >
              <EditIcon />
            </IconButton>
          )}
          <IconButton
            color="primary"
            onClick={() => {
              handleViewFile(
                params.row.selected_template_url,
                params.row.front_file_url,
                params.row,
                params.row.current_status_name
              );
              // console.log()
              // console.log("Params", params.row);
            }}
          >
            <VisibilityIcon />
          </IconButton>
          {params.row.form_status === "save_draft"
            ? hasPermission(userPermissions, "document", "isView") && (
                <IconButton
                  color="secondary"
                  // onClick={() => {
                  //   console.log("Params passed to handleClick:", params.row);
                  // }}
                >
                  <PreviewIcon />
                </IconButton>
              )
            : hasPermission(userPermissions, "document", "isView") &&
              params.row.current_status_name !== "Release" &&
              !(
                (groupId === 3 && params.row.current_status_name == "Under Approver") ||
                params.row.document_current_status === 7 ||
                params.row.document_current_status === 9
              ) && ( // Hide if status is "Approve"
                <IconButton color="inherit" onClick={() => handleClick(params)}>
                  <EditCalendarIcon />
                </IconButton>
              )}
          {groupId === 5 && (
            <IconButton
              color="success"
              onClick={() => handleDialogOpen(params.row)}
              disabled={params.row.document_current_status !== 9}
            >
              <CheckCircleIcon />
            </IconButton>
          )}
          {/* {params.row.document_current_status === 7 && ( // Show ImportContactsTwoToneIcon when status is 7
            <IconButton
              color="warning"
              onClick={() => handleReviseDialogOpen(params.row)}
            >
              <ImportContactsTwoToneIcon />
            </IconButton>
          )} */}
        </MDBox>
      ),
      sortable: false,
      filterable: false,
    },
    {
      field: "preview_download",
      headerName: "Download",
      flex: 0.4,
      headerAlign: "center",
      renderCell: (params) => (
        <MDBox display="block">
          <IconButton
            color="primary"
            onClick={() => {
              navigate("/PDFPreview", {
                state: {
                  documentId: params.row.original_id,
                },
              });
            }}
            // disabled={params.row.document_current_status !== 9}
          >
            <BrowserUpdatedOutlinedIcon />
          </IconButton>
        </MDBox>
      ),
      sortable: false,
      filterable: false,
    },
    ...(groupId === 5
      ? [
          {
            field: "obsolete",
            headerName: "Obsolete",
            flex: 0.4,
            headerAlign: "center",
            renderCell: (params) => (
              <MDBox display="block">
                <IconButton
                  color="warning"
                  onClick={() => {
                    // Open ObsoleteDialog with row data (pass document_title)
                    handleObsoleteDialogOpen(params.row);
                  }}
                >
                  <SubtitlesOffIcon />
                </IconButton>
              </MDBox>
            ),
            sortable: false,
            filterable: false,
          },
        ]
      : []),
    ...(groupId === 5
      ? [
          {
            field: "effective",
            headerName: "Effective",
            flex: 0.4,
            headerAlign: "center",
            renderCell: (params) => (
              <MDBox display="flex" justifyContent="center">
                <IconButton
                  color="success"
                  onClick={() => handleEffectiveClick(params.row)}
                  disabled={
                    !(
                      params.row.document_current_status === 6 ||
                      params.row.document_current_status === 11
                    )
                  }
                >
                  <RuleFolderIcon />
                </IconButton>
              </MDBox>
            ),
            sortable: false,
            filterable: false,
          },
        ]
      : []),
  ];
  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error fetching documents.</div>;
  return (
    <MDBox p={3}>
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
          {groupId === 5 && (
            <MDBox mb={3}>
              <FormControl sx={{ width: "250px", mr: 2, mt: 3 }} size="small">
                <InputLabel id="select-department-label">Department</InputLabel>
                <Select
                  labelId="select-department-label"
                  id="select-department"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  size="small"
                  input={<OutlinedInput label="Department" />}
                  sx={{
                    minWidth: 200,
                    height: "2.50rem",
                  }}
                >
                  {isDepartmentsLoading ? (
                    <MenuItem disabled>Loading departments...</MenuItem>
                  ) : (
                    departmentsData?.map((dept) => (
                      <MenuItem key={dept.id} value={dept.id}>
                        {dept.department_name}
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            </MDBox>
          )}
          <MDTypography variant="h4" fontWeight="medium" sx={{ flexGrow: 1, textAlign: "center" }}>
            Document Listing
          </MDTypography>

          {groupId === 5 && (
            <MDButton variant="contained" color="primary" onClick={handleObsolete} sx={{ ml: 2 }}>
              Obsolete
            </MDButton>
          )}
          {groupId === 5 && (
            <MDButton
              variant="gradient"
              color="submit"
              onClick={handleDownloadReport}
              sx={{ ml: 2 }}
            >
              Generate Excel
            </MDButton>
          )}

          {hasPermission(userPermissions, "document", "isAdd") && (
            <MDButton
              variant="contained"
              color="primary"
              onClick={handleAddDocument}
              sx={{ ml: 2 }}
            >
              Add Document
            </MDButton>
          )}
        </MDBox>
        <MDBox display="flex" justifyContent="center" p={2}>
          <div style={{ height: 700, width: "100%", overflow: "auto" }}>
            <DataGrid
              rows={rows || []}
              columns={columns}
              pageSize={10}
              rowsPerPageOptions={[10, 25, 50]}
              sx={{
                minWidth: 1500,
                "& .MuiDataGrid-columnHeaders": {
                  backgroundColor: "#f5f5f5",
                  fontWeight: "bold",
                  textAlign: "center",
                  justifyContent: "center",
                },
                "& .MuiDataGrid-cell": {
                  textAlign: "center",
                },
                "& .MuiDataGrid-columnHeaderTitle": {
                  textAlign: "center",
                  width: "100%",
                },
              }}
            />
          </div>
          {/* <ToastContainer position="top-right" autoClose={3000} /> */}
        </MDBox>
      </Card>
      <ConditionalDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        onConfirm={() => console.log("Confirmed for row:", selectedRow)}
        trainingStatus={selectedRow?.training_required || "false"}
        documentId={selectedRow?.original_id  || ""}
        revisionMonth={selectedRow?.revision_month}
        isParent={selectedRow?.is_parent}
        parentId={selectedRow?.parent_document}
      />
      <ChildDocumentsDialog
        open={openChildDialog}
        onClose={() => setOpenChildDialog(false)}
        documentId={selectedRow?.original_id  || ""}
      />
      <ObsoleteDialog
        open={ObsoletedialogOpen}
        onClose={handleObsoleteClose}
        onConfirm={handleObsoleteConfirm}
        documentTitle={selectedRow?.document_title || "Unknown Document"} // Pass document_title here
        documentId={selectedRow?.original_id  || ""}
        selectedRow={selectedRow}
      />
      <EffectiveDialog
        openDialog={openDialog}
        selectedRow={selectedRow}
        handleCloseDialog={handleCloseDialog}
        handleConfirmEffective={handleConfirmEffective}
      />
      <ViewSelectionDialog
        open={openviewDialog}
        onClose={() => setOpenviewDialog(false)}
        documentId={selectedRow?.original_id  || ""}
      />
      {/* <ReviseDialog
  open={isReviseDialogOpen}
  onClose={() => setReviseDialogOpen(false)}
  onConfirm={handleReviseConfirm}
  documentId={selectedRow?.id|| ""} 
  // You can pass more fields like selectedRow or row as needed
/> */}
    </MDBox>
  );
};

DocumentListing.propTypes = {
  userPermissions: PropTypes.arrayOf(
    PropTypes.shape({
      resource: PropTypes.string.isRequired,
      action: PropTypes.string.isRequired,
    })
  ).isRequired,
};

export default DocumentListing;
