import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Card from "@mui/material/Card";
import { DataGrid } from "@mui/x-data-grid";
import IconButton from "@mui/material/IconButton";
import EditIcon from "@mui/icons-material/Edit";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDInput from "components/MDInput";
import MDButton from "components/MDButton";
import { useGetJobRoleQuery } from "apilms/jobRoleApi"; // Import the correct hook
import { useFetchPermissionsByGroupIdQuery } from "api/auth/permissionApi";
import { useAuth } from "hooks/use-auth";
import { hasPermission } from "utils/hasPermission"; 
import moment from "moment"; // To format the date

const JobroleListing = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const group = user?.user_permissions?.group || {};
    const groupId = group.id;
   
    const { data: userPermissions = [], isError: permissionError } = useFetchPermissionsByGroupIdQuery(groupId?.toString(), {
      skip: !groupId, 
    });
  const { data: response, isLoading, isError, refetch } = useGetJobRoleQuery();

  useEffect(() => {
    refetch();
  }, []);

  // Extract the `data` array from the response
  const jobRoles = response?.data || [];

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleEditJobrole = (jobrole) => {
    navigate("/edit-jobrole", { state: { jobrole } });
  };

  // Filter the data by the job role name (using the correct property)
  const filteredData = jobRoles
    .filter((jobrole) =>
      jobrole.job_role_name.toLowerCase().includes(searchTerm.toLowerCase()) // Use job_role_name instead of role_name
    )
    .map((jobrole, index) => ({
      ...jobrole,
      serial_number: index + 1,
      date: moment(jobrole.created_at).format("DD/MM/YY"), // Use moment for formatting
      // Add logic for plant, department, and area to display "-" if null
      plant: jobrole.plant || "-",
      department: jobrole.department || "-",
      area: jobrole.area || "-",
    }));

  const columns = [
    { field: "serial_number", headerName: "Sr. No.", flex: 0.5, headerAlign: "center" },
    { field: "job_role_name", headerName: "Role Name", flex: 1, headerAlign: "center" }, // Use job_role_name here
    { field: "date", headerName: "Date", flex: 1, headerAlign: "center" },
    { field: "plant", headerName: "Plant", flex: 1, headerAlign: "center" },
    { field: "department", headerName: "Department", flex: 1, headerAlign: "center" },
    { field: "area", headerName: "Area", flex: 1, headerAlign: "center" },
    {
      field: "action",
      headerName: "Action",
      flex: 0.5,
      headerAlign: "center",
      renderCell: (params) => (
        hasPermission(userPermissions, "jobrole", "isChange") ? (

       <IconButton color="primary" onClick={() => handleEditJobrole(params.row)}>
          <EditIcon />
        </IconButton>
        ) : null
      ),
    },
  ];

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isError) {
    return <div>Error loading job roles.</div>;
  }

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
            Job Role Listing
          </MDTypography>
          {hasPermission(userPermissions, "jobrole", "isAdd") && (

          <MDButton
            variant="contained"
            color="primary"
            onClick={() => navigate("/add-jobrole")}
            sx={{ ml: 2 }}
          >
            Add Job Role
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
                },
              }}
            />
          </div>
        </MDBox>
      </Card>
    </MDBox>
  );
};

export default JobroleListing;
