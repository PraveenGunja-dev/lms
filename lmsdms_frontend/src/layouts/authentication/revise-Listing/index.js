import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Card from "@mui/material/Card";
import { DataGrid } from "@mui/x-data-grid";
import IconButton from "@mui/material/IconButton";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDInput from "components/MDInput";
import BackHandSharpIcon from "@mui/icons-material/BackHandSharp";
import ImportContactsTwoToneIcon from "@mui/icons-material/ImportContactsTwoTone";
import ReviseDialog from "./Revise";
import ReviseApproveDialog from "./Approve";
import { useReviseRequestGetQuery } from "api/auth/reviseApi"; // Adjust import as per your API slice location 
import { useFetchPermissionsByGroupIdQuery } from "api/auth/permissionApi";
import { hasPermission } from "utils/hasPermission";
import { useAuth } from "hooks/use-auth";
import moment from "moment/moment";

const ReviseApprovalList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isReviseDialogOpen, setReviseDialogOpen] = useState(false);
  const [isApproveDialogOpen, setApproveDialogOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch permissions
  const group = user?.user_permissions?.group || {};
  const groupId = group.id;
  const { data: userPermissions = [] } = useFetchPermissionsByGroupIdQuery(groupId?.toString(), {
    skip: !groupId,
  });

  // API call to fetch data
  const { data: apiData, isLoading, refetch } = useReviseRequestGetQuery();

  // Extract data and user_group_id from API response
  const userGroupId = apiData?.user_group_id || null;
  const apiDocuments = apiData?.data || [];

  useEffect(() => {
    refetch();
  }, []);

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleReviseDialogOpen = (row) => {
    setSelectedRow(row);
    setReviseDialogOpen(true);
  };

  const handleReviseDialogClose = () => {
    setReviseDialogOpen(false);
  };

  const handleApproveDialogOpen = (row) => {
    setSelectedRow(row);
    setApproveDialogOpen(true);
  };

  const handleApproveDialogClose = () => {
    setApproveDialogOpen(false);
  };

  const handleApprove = (reason) => {
    console.log("Approved with reason:", reason, "for document:", selectedRow);
    handleApproveDialogClose();
  };

  const handleReject = (reason) => {
    console.log("Rejected with reason:", reason, "for document:", selectedRow);
    handleApproveDialogClose();
  };

 // Format data for DataGrid (filter out approved documents)
const formattedData = apiDocuments
.filter((doc) => doc.status !== "approved") // Exclude approved documents
.map((doc, index) => ({
  id: doc.document_id,
  serial_number: index + 1,
  documentTitle: doc.document_title,
  documentType: doc.document_type,
  requestedUser: doc.user ? `${doc.user}` : "N/A",
  requestedDate: doc.revision_created_at
  ? moment(doc.revision_created_at).format("DD/MM/YYYY")
  : "N/A",
  reviseStatus: doc.status,
  revisereason: doc.revise_description,
  document_current_status_name: doc.document_current_status_name,
  revise_request_id: doc.revise_request_id,
  is_revise: doc.is_revise,
  can_approve_revision: doc.can_approve_revision,
  revise_requested_by: doc.revise_requested_by,
  version: doc.version,
}));
 
console.log(formattedData);

  // Filter data based on the search term
  const displayedData = formattedData.filter(
    (request) =>
      request.requestedUser.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.documentTitle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { field: "serial_number", headerName: "Sr. No.", flex: 0.5, headerAlign: "center" },
    { field: "documentTitle", headerName: "Document Title", flex: 1, headerAlign: "center" },
    { field: "documentType", headerName: "Document Type", flex: 1, headerAlign: "center" },
    { field: "requestedUser", headerName: "Requested User", flex: 1, headerAlign: "center" },
    { field: "version", headerName: "Version", flex: 1, headerAlign: "center" },
    { field: "requestedDate", headerName: "Requested Date", flex: 1, headerAlign: "center" },
    { field: "document_current_status_name", headerName: "Status", flex: 1, headerAlign: "center" },

    // Column for Revise Button
    // ...(hasPermission(userPermissions, "documentrevisionrequestaction", "isChange")
    //   ? [
          {
            field: "revise",
            headerName: "Revise",
            flex: 0.75,
            headerAlign: "center",
            renderCell: (params) =>
              // params.row.reviseRequestId === null ? (
                <IconButton color="warning" onClick={() => handleReviseDialogOpen(params.row)}
                disabled={params.row.is_revise} 
                >
                  <BackHandSharpIcon />
                </IconButton>
              // ) : (
              //   "-"
              // ),
          },
      //   ]
      // : []), // Hide column if no permission

    // Column for Approve Button
    ...(hasPermission(userPermissions, "documentrevisionaction", "isAdd")
      ? [
          {
            field: "approve",
            headerName: "Approve", 
            flex: 0.75, 
            headerAlign: "center",
            renderCell: (params) =>
              // params.row.reviseRequestId !== null ? (
                <IconButton color="primary" onClick={() => handleApproveDialogOpen(params.row)}
                disabled={
                  !params.row.is_revise ||
                  !params.row.can_approve_revision ||
                  params.row.revise_requested_by === user?.id
                }
                >
                  <ImportContactsTwoToneIcon />
                </IconButton>
              // ) : (
              //   "-"
              // ),
          },
        ]
      : []), // Hide column if no permission
  ];

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
          <MDTypography variant="h4" fontWeight="medium" sx={{ flexGrow: 1, textAlign: "center" }}>
            Revise Approval List
          </MDTypography>
        </MDBox>
        <MDBox display="flex" justifyContent="center" p={2}>
          {isLoading ? (
            <MDTypography variant="h6" textAlign="center">
              Loading...
            </MDTypography>
          ) : (
            <div style={{ height: 500, width: "100%" }}>
              <DataGrid
                rows={displayedData}
                columns={columns}
                pageSize={5}
                rowsPerPageOptions={[5, 10, 20]}
                disableSelectionOnClick
                sx={{
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
          )}
        </MDBox>
      </Card>

      <ReviseDialog
        open={isReviseDialogOpen}
        onClose={handleReviseDialogClose}
        documentId={selectedRow?.id || ""}
      />

      <ReviseApproveDialog
        open={isApproveDialogOpen}
        onClose={handleApproveDialogClose}
        onApprove={handleApprove}
        onReject={handleReject}
        row={selectedRow}
      />
    </MDBox>
  );
};

export default ReviseApprovalList;
