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
import { useFetchDepartmentsQuery } from "api/auth/departmentApi";
import { useFetchPermissionsByGroupIdQuery } from "api/auth/permissionApi";
import { useAuth } from "hooks/use-auth";
import { hasPermission } from "utils/hasPermission"; 
import moment from "moment";  

const DepartmentListing = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const { data: departments = [], isLoading, error } = useFetchDepartmentsQuery();
  
  const group = user?.user_permissions?.group || {};
  const groupId = group.id;
 
  const { data: userPermissions = [], isError: permissionError } = useFetchPermissionsByGroupIdQuery(groupId?.toString(), {
    skip: !groupId, 
  });

  if (isLoading) return <div>Loading departments...</div>;
  if (error) return <div>Error loading departments: {error.message}</div>;
  const formatDate = (dateString) => {
    return moment(dateString).format('DD/MM/YY');
  };

  const formattedData = departments.map((item, index) => ({
    id: item.id,
    serial_number: index + 1,
    department_name: item.department_name || "N/A",
    department_description: item.department_description || "N/A",
    department_created_at: formatDate(item.department_created_at), 
  }));

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleEditDepartment = (department) => {
    navigate("/update-department", { state: { department } });
  };

  const filteredData = formattedData.filter(
    (department) =>
      department.department_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      department.department_description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { field: "serial_number", headerName: "Sr. No.", flex: 0.5, headerAlign: 'center' },
    { field: "department_name", headerName: "Department Name", flex: 1, headerAlign: 'center' },
    { field: "department_description", headerName: "Department Description", flex: 1.5, headerAlign: 'center' },
    { field: "department_created_at", headerName: "Created At", flex: 0.75, headerAlign: 'center' },
    {
      field: "action",
      headerName: "Action",
      flex: 0.5,
      headerAlign: 'center',
      renderCell: (params) => (
        hasPermission(userPermissions, "department", "isChange") ? (
          <IconButton color="primary" onClick={() => handleEditDepartment(params.row)}>
            <EditIcon />
          </IconButton>
        ) : null
      ),
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
            onChange={handleSearch}
          />
          <MDTypography variant="h4" fontWeight="medium" sx={{ flexGrow: 1, textAlign: "center" }}>
            Department Listing
          </MDTypography>
          {hasPermission(userPermissions, "department", "isAdd") && (
            <MDButton variant="contained" color="primary" onClick={() => navigate("/add-department")} sx={{ ml: 2 }}>
              Add Department
            </MDButton>
          )}
        </MDBox>
        <MDBox display="flex" justifyContent="center" p={2}>
          <div style={{ height: 700, width: "100%" }}>
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
                },
              }}
            />
          </div>
        </MDBox>
      </Card>
    </MDBox>
  );
};

export default DepartmentListing;
