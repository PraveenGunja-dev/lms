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
import moment from "moment";
import { useFetchMethodologiesQuery } from 'apilms/MethodologyApi'; // Import the hook
import { useFetchPermissionsByGroupIdQuery } from "api/auth/permissionApi";
import { useAuth } from "hooks/use-auth";
import { hasPermission } from "utils/hasPermission"; 

const MethodologyListing = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const group = user?.user_permissions?.group || {};
    const groupId = group.id;
   
    const { data: userPermissions = [], isError: permissionError } = useFetchPermissionsByGroupIdQuery(groupId?.toString(), {
      skip: !groupId, 
    });
  
  const { data, error, isLoading,refetch } = useFetchMethodologiesQuery();

   useEffect(() => {
            refetch();
          }, [location.key]);
          
  const handleAddMethodology = () => {
    navigate("/add-methodology");
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleEditMethodology = (item) => {
    navigate("/edit-methodology", { state: { item } });
  };

  // Check if the data is an array and filter it
  const filteredData = Array.isArray(data?.data) // Ensure data is in correct format
    ? data.data
        .filter((item) =>
          item.methodology_name.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .map((item, index) => ({
          ...item,
          serial_number: index + 1,
          created_at: moment(item.methodology_created_at).format("DD/MM/YY"),
        }))
    : [];

  const columns = [
    { field: "serial_number", headerName: "Sr. No.", flex: 0.5, headerAlign: "center" },
    { field: "methodology_name", headerName: "Methodology Name", flex: 1, headerAlign: "center" },
    { field: "created_at", headerName: "Created Date", flex: 1, headerAlign: "center" },
    // {
    //   field: "action",
    //   headerName: "Action",
    //   flex: 0.5,
    //   headerAlign: "center",
    //   renderCell: (params) => (
    //     hasPermission(userPermissions, "methodology", "isChange") ? (
    //     <MDBox display="flex" gap={1}>
    //       <IconButton
    //         color="primary"
    //         onClick={() => handleEditMethodology(params.row)} // Pass the methodology ID
    //       >
    //         <EditIcon />
    //       </IconButton>
    //     </MDBox>
    //       ) : null
    //   ),
    //   sortable: false,
    //   filterable: false,
    // },
  ];
  if (hasPermission(userPermissions, "methodology", "isChange")) {
    columns.push({
      field: "action",
      headerName: "Action",
      flex: 0.5,
      headerAlign: "center",
      renderCell: (params) => (
        <MDBox display="flex" gap={1}>
          <IconButton
            color="primary"
            onClick={() => handleEditMethodology(params.row)} // Pass the methodology ID
          >
            <EditIcon />
          </IconButton>
        </MDBox>
      ),
      sortable: false,
      filterable: false,
    });
  }


  // Handle loading and error states
  if (isLoading) {
    return <MDTypography variant="h6">Loading...</MDTypography>;
  }

  if (error) {
    return <MDTypography variant="h6">Error loading methodologies</MDTypography>;
  }

  return (
    <MDBox p={3}>
      <Card sx={{ maxWidth: "80%", mx: "auto", mt: 3, marginLeft: 'auto', marginRight: 0 }}>
        <MDBox p={3} display="flex" alignItems="center">
          <MDInput
            label="Search Methodology"
            variant="outlined"
            size="small"
            sx={{ width: "250px", mr: 2 }}
            value={searchTerm}
            onChange={handleSearch} 
          />
          <MDTypography variant="h4" fontWeight="medium" sx={{ flexGrow: 1, textAlign: "center" }}>
            Methodology Listing
          </MDTypography>
          {hasPermission(userPermissions, "methodology", "isAdd") && (
          <MDButton
            variant="contained"
            color="primary"
            onClick={handleAddMethodology}
            sx={{ ml: 2 }}
          >
            Add Methodology
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

export default MethodologyListing;
