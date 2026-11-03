import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "@mui/material/Card";
import { DataGrid } from "@mui/x-data-grid";
import IconButton from "@mui/material/IconButton";
import EditIcon from "@mui/icons-material/Edit";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDInput from "components/MDInput";
import MDButton from "components/MDButton";
import { useFetchDocumentTypesQuery } from 'api/auth/documentApi';
import { useFetchPermissionsByGroupIdQuery } from 'api/auth/permissionApi';
import { hasPermission } from "utils/hasPermission";
import { useAuth } from "hooks/use-auth";
import moment from "moment";

const DocumentTypesListing = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { user, role } = useAuth();
  const { data, error, isLoading } = useFetchDocumentTypesQuery();

  const group = user?.user_permissions?.group || {};
  const groupId = group.id;
 
  const { data: userPermissions = [], isError: permissionError } = useFetchPermissionsByGroupIdQuery(groupId?.toString(), {
    skip: !groupId, // Ensure it skips if groupId is missing
  });

  const navigate = useNavigate();

  const handleAddDocumentType = () => {
    navigate("/add-documenttype");
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleEditType = (item) => {
    navigate("/edit-documenttype", { state: { item } });
};

  // Add serial number based on index
  const filteredData = data ? data
    .filter((item) => item.document_name.toLowerCase().includes(searchTerm.toLowerCase()))
    .map((item, index) => ({
      ...item,
      serial_number: index + 1,  // Add serial number based on the index
      created_at: moment(item.created_at).format("DD/MM/YY"), 
      
    })) : [];

  const columns = [
    { field: "serial_number", headerName: "Sr. No.", flex: 0.5, headerAlign: "center" },
    { field: "document_name", headerName: "Document Type Name", flex: 1, headerAlign: "center" },
    { field: "created_at", headerName: "Created At", flex: 1, headerAlign: "center" },
    {
      field: "action",
      headerName: "Action",
      flex: 0.5,
      headerAlign: "center",
      renderCell: (params) => (
        <MDBox display="flex" gap={1}>
          {hasPermission(userPermissions, "documenttype", "isChange") && (
            <IconButton 
              color="primary" 
              onClick={() => handleEditType(params.row)}  // Pass the document type ID
            >
              <EditIcon />
            </IconButton>
          )}
        </MDBox>
      ),
      sortable: false,
      filterable: false,
    },
  ];

  if (isLoading) return <div>Loading...</div>;
  if (error || permissionError) return <div>Error loading data or permissions.</div>;

  return (
    <MDBox p={3}>
      <Card sx={{ maxWidth: "80%", mx: "auto", mt: 3, marginLeft: 'auto', marginRight: 0 }}>
        <MDBox p={3} display="flex" alignItems="center">
          <MDInput
            label="Search Document Type"
            variant="outlined"
            size="small"
            sx={{ width: "250px", mr: 2 }}
            value={searchTerm}
            onChange={handleSearch}
          />
          <MDTypography variant="h4" fontWeight="medium" sx={{ flexGrow: 1, textAlign: "center" }}>
            Document Types Listing
          </MDTypography>
          {hasPermission(userPermissions, "documenttype", "isAdd") && (
            <MDButton variant="contained" color="primary" onClick={handleAddDocumentType} sx={{ ml: 2 }}>
              Add Document Type
            </MDButton>
          )}
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
      </Card>
    </MDBox>
  );
};

export default DocumentTypesListing;
