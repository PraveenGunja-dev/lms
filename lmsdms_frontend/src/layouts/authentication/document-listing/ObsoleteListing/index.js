import React, { useState } from "react";
import Card from "@mui/material/Card";
import { DataGrid } from "@mui/x-data-grid";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDInput from "components/MDInput";
import moment from "moment"; 
import { useGetObsoleteStatusDataQuery } from "api/auth/documentApi";

const ObsoleteDataListing = () => {
  const [searchTerm, setSearchTerm] = useState(""); 
  const { data: obsoleteData, isLoading, error } = useGetObsoleteStatusDataQuery();
  if (isLoading) {
    return (
      <MDBox p={3}>
        <Card sx={{ maxWidth: "80%", mx: "auto", mt: 3, marginLeft: "auto", marginRight: 0 }}>
          <MDBox p={3} display="flex" alignItems="center">
            <MDTypography variant="h4" fontWeight="medium" sx={{ flexGrow: 1, textAlign: "center" }}>
              Loading Obsolete Data...
            </MDTypography>
          </MDBox>
        </Card>
      </MDBox>
    );
  }

  // Handle error state
  if (error) {
    return (
      <MDBox p={3}>
        <Card sx={{ maxWidth: "80%", mx: "auto", mt: 3, marginLeft: "auto", marginRight: 0 }}>
          <MDBox p={3} display="flex" alignItems="center">
            <MDTypography variant="h4" fontWeight="medium" sx={{ flexGrow: 1, textAlign: "center" }}>
              Error loading data: {error.message}
            </MDTypography>
          </MDBox>
        </Card>
      </MDBox>
    );
  }
  const filteredData = (obsoleteData?.length > 0 ? obsoleteData : []).filter(
    (doc) =>
      doc.document_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.document_type_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.document_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.created_at.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const rows = filteredData.map((doc, index) => ({
    ...doc,
    index,
    created_at: moment(doc.created_at).format("DD/MM/YY"), 
  }));

  const columns = [
    {
      field: "index",
      headerName: "Sr.No.",
      flex: 0.3,
      headerAlign: "center",
      renderCell: (params) => <span>{params.row.index + 1}</span>,
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
    },
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
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <MDTypography variant="h4" fontWeight="medium" sx={{ flexGrow: 1, textAlign: "center" }}>
            Obsolete Data Listing
          </MDTypography>
        </MDBox>
        <MDBox display="flex" justifyContent="center" p={2}>
          <div style={{ height: 500, width: "100%" }}>
            <DataGrid
              rows={rows || []}
              columns={columns}
              pageSize={10}
              rowsPerPageOptions={[10, 25, 50]}
              sx={{
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
        </MDBox>
      </Card>
    </MDBox>
  );
};

export default ObsoleteDataListing;
