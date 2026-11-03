import React, { useState } from "react";
import Card from "@mui/material/Card";
import { DataGrid } from "@mui/x-data-grid";
import IconButton from "@mui/material/IconButton";
import AssignmentReturnIcon from "@mui/icons-material/AssignmentReturn";
import ArticleRoundedIcon from "@mui/icons-material/ArticleRounded";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDInput from "components/MDInput";
import { useGetApprovedPrintListQuery } from "api/auth/retrievalApi";
import { useFetchPermissionsByGroupIdQuery } from "api/auth/permissionApi";
import { hasPermission } from "utils/hasPermission";
import { useAuth } from "hooks/use-auth";
import PrintRetrievalDialog from "./retrievaldialog";
import ApprovedRetrievalListingDialog from "./approve-list";
import moment from "moment";

const PrintRetrievalListing = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [approvedDialogOpen, setApprovedDialogOpen] = useState(false);
  const [selectedApprovedRetrieval, setSelectedApprovedRetrieval] = useState(null);
  const [selectedRetrieval, setSelectedRetrieval] = useState(null);

  const { user } = useAuth();
  const group = user?.user_permissions?.group || {};
  const groupId = group.id;

  // Fetch permissions and data
  const { data, error, isLoading } = useGetApprovedPrintListQuery();
  const { data: userPermissions = [], isError: permissionError } =
    useFetchPermissionsByGroupIdQuery(groupId?.toString(), {
      skip: !groupId,
    });

  const handleSearch = (event) => setSearchTerm(event.target.value);

  const handleDialogOpen = (row) => {
    setSelectedRetrieval({ document_title: row.document_title, id: row.id });
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedRetrieval(null);
  };

  const handleApprovedDialogOpen = (row) => {
    setSelectedApprovedRetrieval({ id: row.id });
    setApprovedDialogOpen(true);
  };

  const handleApprovedDialogClose = () => {
    setApprovedDialogOpen(false);
    setSelectedApprovedRetrieval(null);
  };

  const handleRetrieve = (retrievalNumber) => {
    console.log(`Retrieving document: ${retrievalNumber}`);
  };

  const filteredData = data
    ? data
        .filter(
          (item) =>
            item.document_title &&
            item.document_title.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .map((item, index) => ({
          ...item,
          serial_number: index + 1,
        }))
    : [];

  const columns = [
    { field: "serial_number", headerName: "Sr. No.", flex: 0.5, headerAlign: "center" },
    { field: "document_title", headerName: "Document Title", flex: 1, headerAlign: "center" },
    { field: "no_of_print", headerName: "Copies Requested", flex: 0.7, headerAlign: "center" },
    {
      field: "no_of_retrival",
      headerName: "Retrieved Copies",
      flex: 1,
      headerAlign: "center",
      renderCell: (params) => params.row.no_of_retrival ?? "-",
    },
    {
      field: "no_of_request_by_admin",
      headerName: "Copies Approved",
      flex: 0.7,
      headerAlign: "center",
    },
    { field: "status", headerName: "Status", flex: 0.6, headerAlign: "center" },
    {
      field: "Approve",
      headerName: "Approve Date",
      flex: 1,
      headerAlign: "center",
      renderCell: (params) => moment(params.row.created_at).format("DD/MM/YYYY") ?? "-",
    },

    // Column for the "Assign Return" IconButton
    ...(hasPermission(userPermissions, "retrivalnumber", "isAdd")
      ? [
          {
            field: "assign_return",
            headerName: "Retrieval",
            flex: 0.5,
            headerAlign: "center",
            renderCell: (params) => (
              <IconButton color="primary" onClick={() => handleDialogOpen(params.row)}>
                <AssignmentReturnIcon />
              </IconButton>
            ),
          },
        ]
      : []), // If no permission, this column won't appear

    // Column for the "Article Rounded" IconButton
    ...(hasPermission(userPermissions, "retrivalnumber", "isView")
      ? [
          {
            field: "article_rounded",
            headerName: "Retrieval No.",
            flex: 0.5,
            headerAlign: "center",
            renderCell: (params) => (
              <IconButton color="info" onClick={() => handleApprovedDialogOpen(params.row)}>
                <ArticleRoundedIcon />
              </IconButton>
            ),
          },
        ]
      : []), // If no permission, this column won't appear
  ];

  if (isLoading) return <div>Loading...</div>;
  if (error || permissionError) return <div>Error loading data or permissions.</div>;

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
          <MDTypography variant="h4" fontWeight="medium" sx={{ flexGrow: 1, textAlign: "center" }}>
            Print Retrieval Listing
          </MDTypography>
        </MDBox>
        <MDBox display="flex" justifyContent="center" p={2}>
          <div style={{ height: 500, width: "100%" }}> 
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
      <PrintRetrievalDialog
        open={dialogOpen}
        handleClose={handleDialogClose}
        selectedId={selectedRetrieval?.id}
        onRetrieve={handleRetrieve}
      />
      <ApprovedRetrievalListingDialog
        open={approvedDialogOpen}
        handleClose={handleApprovedDialogClose}
        selectedId={selectedApprovedRetrieval?.id}
        onRetrieve={handleRetrieve}
      />
    </MDBox>
  );
};

export default PrintRetrievalListing;
