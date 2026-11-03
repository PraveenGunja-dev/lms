import React, { useState, useEffect } from "react";
import { useGetPrintRejectDocumentDataQuery } from "api/auth/dashboardApi";
import Card from "@mui/material/Card";
import { DataGrid } from "@mui/x-data-grid";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDInput from "components/MDInput";
import MDButton from "components/MDButton";
import { Dialog, DialogContent, DialogTitle, DialogActions, TextField } from "@mui/material";
import moment from "moment";
const RejectedPrintDocument = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedRemarks, setSelectedRemarks] = useState("");

  const {
    data: rejectedPrintData,
    isLoading,
    isError,
    refetch,
  } = useGetPrintRejectDocumentDataQuery();

  useEffect(() => {
    refetch();
  }, [refetch]);

  const handleOpenDialog = (remarks) => {
    setSelectedRemarks(remarks);
    setOpen(true);
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setSelectedRemarks("");
  };

  const documents = rejectedPrintData?.printRejectData || [];

  const filteredData = documents.filter(
    (doc) =>
      doc.document_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.status?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const rows = filteredData.map((doc, index) => ({
    id: doc.id || index, // use backend ID if exists
    srNo: index + 1,
    
    ...doc, // this keeps created_at and all fields intact
    created_at: moment(doc.created_at).format("DD/MM/YY - HH:MM:ss"),
  }));

  const columns = [
    {
      field: "srNo",
      headerName: "Sr No",
      flex: 0.3,
      headerAlign: "center",
      width: 90,
    },
    {
      field: "document_title",
      headerName: "Document Title",
      headerAlign: "center",
      flex: 1,
    },
    {
      field: "no_of_print",
      headerName: "Requested Prints",
      headerAlign: "center",
      flex: 1,
    },
    // {
    //   field: "no_of_request_by_admin",
    //   headerName: "Admin Allowed Prints",
    //   headerAlign: "center",
    //   flex: 1,
    // },
    {
      field: "status",
      headerName: "Request Status",
      headerAlign: "center",
      flex: 1,
    },
    {
      field: "created_at",
      headerName: "Created Date",
      flex: 1,
      headerAlign: "center",
    },

    // {
    //   field: "remarks",
    //   headerName: "Remarks",
    //   flex: 1,
    //   renderCell: (params) => (
    //     <MDButton
    //       variant="outlined"
    //       color="info"
    //       size="small"
    //       onClick={() => handleOpenDialog(params.row.remarks)}
    //     >
    //       View
    //     </MDButton>
    //   ),
    // },
  ];

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error fetching rejected print requests.</div>;

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
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <MDTypography
            variant="h4"
            fontWeight="medium"
            sx={{ flexGrow: 1, textAlign: "center", mr: 28 }}
          >
            Rejected Print Request Listing
          </MDTypography>
        </MDBox>

        <MDBox display="flex" justifyContent="center" sx={{ height: 500, mt: 2 }}>
          <div style={{ height: 500, width: "100%" }}>
            <DataGrid
              rows={rows}
              columns={columns}
              pageSize={5}
              rowsPerPageOptions={[5]}
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

      <Dialog open={open} onClose={handleCloseDialog} fullWidth maxWidth="lg">
        <DialogTitle>Remarks</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={10}
            value={selectedRemarks || "No Remarks Available"}
            variant="outlined"
            InputProps={{ readOnly: true }}
          />
        </DialogContent>
        <DialogActions>
          <MDButton onClick={handleCloseDialog} variant="contained" color="error">
            Close
          </MDButton>
        </DialogActions>
      </Dialog>
    </MDBox>
  );
};

export default RejectedPrintDocument;
