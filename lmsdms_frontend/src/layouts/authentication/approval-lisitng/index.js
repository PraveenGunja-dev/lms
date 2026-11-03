import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Card from "@mui/material/Card";
import { DataGrid } from "@mui/x-data-grid";
import IconButton from "@mui/material/IconButton";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LocalPrintshopTwoToneIcon from "@mui/icons-material/LocalPrintshopTwoTone";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDInput from "components/MDInput";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import OutlinedInput from "@mui/material/OutlinedInput";
import { useGetPrintRequestsQuery } from "api/auth/printApi";
import { useFetchPermissionsByGroupIdQuery } from "api/auth/permissionApi";
import { hasPermission } from "utils/hasPermission";
import { useAuth } from "hooks/use-auth";
import ApprovalDialog from "./add-approval/index";
import PrintDocumentDialog from "./print-window/index";
import { usePrintRequestExcelReportQuery } from "api/auth/printApi";
import moment from "moment";
import { useViewStatusQuery } from "api/auth/statusApi";
import MDButton from "components/MDButton";

const PrintApprovalListing = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [openDialog, setOpenDialog] = useState(false); 
  const [selectedRequest, setSelectedRequest] = useState(null); 
  const [openPrintDialog, setOpenPrintDialog] = useState(false); // Print Document Dialog state
  const [selectedDocumentId, setSelectedDocumentId] = useState(null); // Store document id
  const [Selectedstatus, setSelectedstatus] = useState(""); // State for Parent Document selection

  const { data: status, isError } = useViewStatusQuery();
  const {
    data: printRequests,
    error,
    isLoading,
    refetch,
  } = useGetPrintRequestsQuery(Selectedstatus);
  
  const { user } = useAuth();
  const group = user?.user_permissions?.group || {};
  const groupId = group.id;
  const {
    data: excelReportData,
    isLoading: isExcelLoading,
    error: excelError,
  } = usePrintRequestExcelReportQuery(Selectedstatus);
  const { data: userPermissions = [], isError: permissionError } =
    useFetchPermissionsByGroupIdQuery(groupId?.toString(), {
      skip: !groupId, // Ensure it skips if groupId is missing
    });
  useEffect(() => {
    refetch();
  }, [location.key]);

  // Conditionally set the Selectedstatus based on the groupId
  useEffect(() => {
    if (groupId === 5 || groupId === 6) {
      setSelectedstatus("all"); // Set default status as "12" for groupId 5 or 6
    } else {
      setSelectedstatus("all"); // Set default as "all" for other groups
    }
  }, [groupId]);

  // Fetch print requests filtered by selected status

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };
 
  const filteredData = (printRequests?.data || []) // Use printRequests.data if API includes "data" field
  .filter((item) => {
    const matchesSearch = item.document_title?.toLowerCase().includes(searchTerm.toLowerCase());

    // If "all" is selected, include all statuses; otherwise, filter by Selectedstatus
    const matchesStatus = Selectedstatus === "all" || item.status_id == Selectedstatus;

    return matchesSearch && matchesStatus;
  })
  .reverse()
  .map((item, index) => ({
    ...item,
    serial_number: index + 1,
  }));

  const handleOpenDialog = (data) => {
    setSelectedRequest(data); // Store the selected request
    setOpenDialog(true); // Open the dialog
  };

  const handleCloseDialog = () => {
    setOpenDialog(false); // Close the dialog
    setSelectedRequest(null); // Clear selected data
  };
  const handleDownloadExcel = () => {
    if (excelReportData && excelReportData.status && excelReportData.data) {
      const fileUrl = excelReportData.data; // Extract file URL from the response
      window.open(fileUrl, "_blank"); // Open the file URL in a new tab to download
    }
  };
  const handleOpenPrintDialog = (documentId, noOfRequestByAdmin, approvalNumbers, document_status,print_count,issue_type,printRequestId) => {
    setSelectedDocumentId(documentId); // Store the document id
    setSelectedRequest((prevRequest) => ({
      ...prevRequest,
      print_request_id: printRequestId,
      no_of_request_by_admin: noOfRequestByAdmin,
      approval_numbers: approvalNumbers, // Ensure approval_numbers is set
      document_status: document_status,
      print_count : print_count,
      issue_type : issue_type,
    }));
    // console.log("++++++++++++++++++++++++++++++++",selectedRequest)
    setOpenPrintDialog(true); // Open the print document dialog
  };
  

  const handleClosePrintDialog = () => {
    setOpenPrintDialog(false); // Close the print document dialog
    setSelectedDocumentId(null); // Clear the selected document id
  };

  const columns = [
    {
      field: "serial_number",
      headerName: "Sr. No.",
      flex: 0.5,
      headerAlign: "center",
      renderCell: (params) => params.row.serial_number ?? "-",
    },
    {
      field: "document_title",
      headerName: "Document",
      flex: 1,
      headerAlign: "center",
      renderCell: (params) => params.row.document_title ?? "-",
    },
    {
      field: "no_of_print",
      headerName: "Requested",
      flex: 1,
      headerAlign: "center",
      renderCell: (params) => params.row.no_of_print ?? "-",
    },
    {
      field: "sop_document_id",
      headerName: "Issue Type",
      flex: 0.75,
      headerAlign: "center",
      renderCell: (params) => params.row.issue_type ?? "-",
    },
    {
      field: "created_at",
      headerName: "Date",
      flex: 1,
      headerAlign: "center",
      renderCell: (params) => {
        const date = params.row.created_at ? moment(params.row.created_at).format("DD/MM/YY") : "-";
        return date;
      },
    },
    {
      field: "version",
      headerName: "Version",
      flex: 1,
      headerAlign: "center",
      renderCell: (params) => params.row.version ?? "-",
    },
    {
      field: "no_of_request_by_admin",
      headerName: "Approved",
      flex: 0.75,
      headerAlign: "center",
      renderCell: (params) => params.row.no_of_request_by_admin ?? "-",
    },
    {
      field: "status",
      headerName: "Status",
      flex: 1,
      headerAlign: "center",
      renderCell: (params) => params.row.status ?? "-",
    },
    // {
    //   field: "no_of_retrival",
    //   headerName: "Retrival",
    //   flex: 1,
    //   headerAlign: "center",
    //   renderCell: (params) => params.row.no_of_retrival ?? "-",
    // },
    {
      field: "Approve",
      headerName: "Approve Date",
      flex: 0.75,
      headerAlign: "center",
      renderCell: (params) => params.row.approved_date ? moment(params.row.created_at).format("DD/MM/YY") : "-",
    },
    {
      field: "first_name",
      headerName: "User",
      flex: 0.75,
      headerAlign: "center",
      renderCell: (params) => params.row.first_name ?? "-",
    },
    // Conditionally add the "Approval" column based on permission
    ...(hasPermission(userPermissions, "printrequestapproval", "isChange")
      ? [
          {
            field: "check_icon",
            headerName: "Approval",
            flex: 0.5,
            headerAlign: "center",
            renderCell: (params) => {
              const status = params.row.status;
              const statusid = params.row.status_id;
              let color = "default";
  
              if (status === "Approve") {
                color = "success"; // Green for approved
              } else if (status === "Reject") {
                color = "error"; // Red for rejected
              } else {
                color = "success"; // Default
              }
  
              return (
                <IconButton
                  color={color}
                  onClick={() => handleOpenDialog(params.row)}
                  disabled={statusid == 9}
                >
                  <CheckCircleIcon />
                </IconButton>
              );
            },
          },
        ]
      : []), // If permission is not granted, do not add this column
    {
      field: "action",
      headerName: "Print",
      flex: 0.75,
      headerAlign: "center",
      renderCell: (params) => (
        <MDBox display="flex" gap={1} justifyContent="center" alignItems="center">
          <IconButton
            color="primary"
            onClick={() =>
              handleOpenPrintDialog(
                params.row.sop_document_id,
                params.row.no_of_request_by_admin,
                params.row.approval_numbers,
                params.row.document_status,
                params.row.print_count,
                params.row.issue_type,
                params.row.id
              )
            }
            disabled={params.row.status_id != 9}
          >
            <LocalPrintshopTwoToneIcon />
          </IconButton>
        </MDBox>
      ),
    },
  ];

  return (
    <MDBox p={3}>
      <Card sx={{ maxWidth: "80%", mx: "auto", mt: 3, marginLeft: "auto", marginRight: 0 }}>
        <MDBox p={3} display="flex" alignItems="center">
          <MDInput
            label="Search Document"
            variant="outlined"
            size="small"
            sx={{ width: "250px", mr: 2 }}
            value={searchTerm}
            onChange={handleSearch}
          />
          {/* Conditionally render the status dropdown based on groupId */}
          {groupId !== 5 && groupId !== 6 && (
            <FormControl fullWidth margin="dense" sx={{ width: "250px" }}>
              <InputLabel id="select-parent-doc-label">Status</InputLabel>
              <Select
                labelId="select-parent-doc-label"
                id="select-parent-doc"
                value={Selectedstatus}
                onChange={(e) => setSelectedstatus(e.target.value)}
                input={<OutlinedInput label="Status" />}
                sx={{
                  minWidth: 200,
                  height: "2.4rem",
                  ".MuiSelect-select": { padding: "0.45rem" },
                }}
              >
                <MenuItem value="all">All</MenuItem>
                {status?.map((status) => (
                  <MenuItem key={status.id} value={status.id}>
                    {status.status}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          <MDTypography
            variant="h4"
            fontWeight="medium"
            sx={{ flexGrow: 1, textAlign: "center", mr: 20 }}
          >
            Print Approval Listing
          </MDTypography>
          <MDButton
            variant="gradient"
            color="submit"
            sx={{ ml: 2 }}
            onClick={handleDownloadExcel}
            disabled={isExcelLoading || excelError}
          >
            {isExcelLoading ? "Generating Excel..." : "Generate Excel"}
          </MDButton>
        </MDBox>
        <MDBox display="flex" justifyContent="center" p={2}>
          <div style={{ height: 500, width: "100%" }}>
            {isLoading && (
              <MDTypography align="center" color="textSecondary">
                Loading...
              </MDTypography>
            )}
            {error && (
              <MDTypography align="center" color="error">
                Failed to load print requests
              </MDTypography>
            )}
            <DataGrid
              rows={filteredData}
              columns={columns}
              pageSize={5}
              rowsPerPageOptions={[5, 10, 20]}
              disableSelectionOnClick
              sx={{
                border: "1px solid #ddd",
                borderRadius: "4px",
                "& .MuiDataGrid-columnHeaders": {
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

      {/* Render ApprovalDialog */}
      {selectedRequest && (
        <ApprovalDialog
          open={openDialog}
          onClose={handleCloseDialog}
          maxCopies={selectedRequest.no_of_print}
          requestId={selectedRequest.id}
        />
      )}

      {/* Render PrintDocumentDialog */}
      {openPrintDialog && (
        <PrintDocumentDialog
          open={openPrintDialog}
          onClose={handleClosePrintDialog}
          id={selectedDocumentId}
          printRequestId={selectedRequest?.print_request_id}
          noOfRequestByAdmin={selectedRequest?.no_of_request_by_admin}
          print_count={selectedRequest?.print_count}
        />
      )}
    </MDBox>
  );
};

export default PrintApprovalListing;
