import React, { useState,useEffect } from "react";
import { useNavigate,useLocation } from "react-router-dom";
import Card from "@mui/material/Card";
import { DataGrid } from "@mui/x-data-grid";
import IconButton from "@mui/material/IconButton";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDInput from "components/MDInput";
import MDButton from "components/MDButton";
import { useViewTemplateQuery } from "api/auth/documentApi";
import { useFetchPermissionsByGroupIdQuery } from "api/auth/permissionApi";
import { useAuth } from "hooks/use-auth";
import { hasPermission } from "utils/hasPermission";
import moment from "moment";

const TemplateListing = () => {
  const { user, role } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch templates data
  const { data, refetch,error, isLoading } = useViewTemplateQuery();

  useEffect(() => {
    refetch();
  }, [location.key]);

  const group = user?.user_permissions?.group || {};
  const groupId = group.id;
 
  // Fetch user permissions for the given role
  const { data: userPermissions = [], isError: permissionError } = useFetchPermissionsByGroupIdQuery(groupId?.toString(), {
    skip: !groupId, // Ensure it skips if groupId is missing
  });

  const handleAddTemplate = () => {
    navigate("/add-template");
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleEditTemplate = (item) => {
    navigate("/update-template", { state: { item } });
  };

  const handleViewFile = (url) => {
    navigate("/doc-example", { state: { templateDoc: url } }); // Pass the URL as state
  };

  // Prepare filtered data with serial numbers
  const filteredData = (data || [])
    .filter((item) => item.template_name.toLowerCase().includes(searchTerm.toLowerCase()))
    .map((item, index) => ({
      ...item,
      serial_number: index + 1,
      created_at: moment(item.created_at).format("DD/MM/YYYY"),
    }));

  const columns = [
    { field: "serial_number", headerName: "Sr. No.", flex: 0.5, headerAlign: "center" },
    { field: "template_name", headerName: "Template Name", flex: 1, headerAlign: "center" },
    { field: "created_at", headerName: "Created At", flex: 1, headerAlign: "center" },
    {
      field: "action",
      headerName: "Action",
      flex: 0.5,
      headerAlign: "center",
      renderCell: (params) =>
        hasPermission(userPermissions, "templatemodel", "isChange") ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "10px" }}>
        <IconButton color="primary" onClick={() => handleEditTemplate(params.row)}>
          <EditIcon />
        </IconButton>
        <IconButton color="primary" onClick={() => handleViewFile(params.row.template_doc)}>
          <VisibilityIcon />
        </IconButton>
      </div>
        ) : null,
    },
  ];

  return (
    <MDBox p={3}>
      <Card sx={{ maxWidth: "80%", mx: "auto", mt: 3, marginLeft: "auto", marginRight: 0 }}>
        <MDBox p={3} display="flex" alignItems="center">
          <MDInput
            label="Search Template"
            variant="outlined"
            size="small"
            sx={{ width: "250px", mr: 2 }}
            value={searchTerm}
            onChange={handleSearch}
          />
          <MDTypography variant="h4" fontWeight="medium" sx={{ flexGrow: 1, textAlign: "center" }}>
            Template Listing
          </MDTypography>

          {hasPermission(userPermissions, "templatemodel", "isAdd") && (
            <MDButton
              variant="contained"
              color="primary"
              onClick={handleAddTemplate}
              sx={{ ml: 2 }}
            >
              Add Template
            </MDButton>
          )}
        </MDBox>
        <MDBox display="flex" justifyContent="center" p={2}>
          {error ? (
            <MDTypography color="error">Error fetching templates</MDTypography>
          ) : (
            <div style={{ height: 500, width: "100%" }}>
              <DataGrid
                rows={filteredData}
                columns={columns}
                pageSize={5}
                rowsPerPageOptions={[5, 10, 20]}
                disableSelectionOnClick
                loading={isLoading}
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
              {!isLoading && filteredData.length === 0 && (
                <MDTypography align="center" color="textSecondary">
                
                </MDTypography>
              )}
            </div>
          )}
        </MDBox>
      </Card>
    </MDBox>
  );
};

export default TemplateListing;
