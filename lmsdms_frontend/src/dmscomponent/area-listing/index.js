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
import { useGetAreaQuery } from "apilms/AreaApi";  // Import the correct hook
import { useFetchPermissionsByGroupIdQuery } from "api/auth/permissionApi";
import { useAuth } from "hooks/use-auth";
import { hasPermission } from "utils/hasPermission"; 
import moment from "moment"; // To format the date

const AreaListing = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const group = user?.user_permissions?.group || {};
    const groupId = group.id;
   
    const { data: userPermissions = [], isError: permissionError } = useFetchPermissionsByGroupIdQuery(groupId?.toString(), {
      skip: !groupId, 
    });
  
  // Fetching area data
  const { data: response, isLoading, isError, refetch } = useGetAreaQuery();

  useEffect(() => { 
    refetch();
  }, []);
  const areas = response?.data || [];

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleEditArea = (area) => {
    navigate("/edit-area", { state: { area } });
  };

  // Filter the area data based on search term
  const filteredData = areas
    .filter(
      (area) =>
        area.area_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        area.area_description.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .map((area, index) => ({
      ...area,
      serial_number: index + 1,
      date: moment(area.area_created_at).format("DD/MM/YY"),  // Use moment for formatting
    }));

  const columns = [
    { field: "serial_number", headerName: "Sr. No.", flex: 0.5, headerAlign: "center" },
    { field: "area_name", headerName: "Area Name", flex: 1, headerAlign: "center" },
    { field: "department_name", headerName: "Department", flex: 1, headerAlign: "center" },
    { field: "area_description", headerName: "Area Description", flex: 1.5, headerAlign: "center" },
    { field: "date", headerName: "Date", flex: 1, headerAlign: "center" },
    // {
    //   field: "action",
    //   headerName: "Action",
    //   flex: 0.5,
    //   headerAlign: "center",
    //   renderCell: (params) => (
    //      hasPermission(userPermissions, "area", "isChange") ? (
    //     <IconButton color="primary" onClick={() => handleEditArea(params.row)}>
    //       <EditIcon />
    //     </IconButton>
    //      ): null
    //   ),
    // },
  ];
  if (hasPermission(userPermissions, "area", "isChange")) {
    columns.push({
      field: "action",
      headerName: "Action",
      flex: 0.5,
      headerAlign: "center",
      renderCell: (params) => (
        <IconButton color="primary" onClick={() => handleEditArea(params.row)}>
          <EditIcon />
        </IconButton>
      ),
    });
  }

  // Handle loading and error states
  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isError) {
    return <div>Error loading areas.</div>;
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
            Area Listing
          </MDTypography>
            {hasPermission(userPermissions, "area", "isAdd") && (
          <MDButton
            variant="contained"
            color="primary"
            onClick={() => navigate("/add-area")}
            sx={{ ml: 2 }}
          >
            Add Area
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

export default AreaListing;
