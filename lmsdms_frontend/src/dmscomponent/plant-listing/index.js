import React, { useState,useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Card from "@mui/material/Card";
import { DataGrid } from "@mui/x-data-grid";
import IconButton from "@mui/material/IconButton";
import EditIcon from "@mui/icons-material/Edit";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDInput from "components/MDInput";
import MDButton from "components/MDButton";
import { useGetPlantQuery } from "apilms/plantApi";
import moment from "moment";
import { date } from "yup";
import { useFetchPermissionsByGroupIdQuery } from "api/auth/permissionApi";
import { useAuth } from "hooks/use-auth";
import { hasPermission } from "utils/hasPermission"; 
const PlantListing = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const group = user?.user_permissions?.group || {};
    const groupId = group.id;
   
    const { data: userPermissions = [], isError: permissionError } = useFetchPermissionsByGroupIdQuery(groupId?.toString(), {
      skip: !groupId, 
    });
  
  // Fetching plant data
  const { data: response, isLoading, isError,refetch } = useGetPlantQuery();

  useEffect(() => {
      refetch();
    }, [location.key]);
  // Debug the API response
//   console.log("API Response:", response);

  // Extract the `data` array from the response
  const plants = response?.data || [];

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleEditPlant = (plant) => {
    navigate("/edit-plant", { state: { plant } });
  };

  const filteredData = plants
    .filter(
      (plant) =>
        plant.plant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plant.plant_location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plant.plant_description.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .map((plant, index) => ({
      ...plant,
      serial_number: index + 1,
      // date: new Date(plant.plant_created_at).toLocaleDateString(),
      date: moment(plant.plant_created_at).format("DD/MM/YY"),
      
    }));

  const columns = [
    { field: "serial_number", headerName: "Sr. No.", flex: 0.5, headerAlign: "center" },
    { field: "plant_name", headerName: "Plant Name", flex: 1, headerAlign: "center" },
    { field: "plant_location", headerName: "Plant Location", flex: 1, headerAlign: "center" },
    { field: "plant_description", headerName: "Plant Description", flex: 1.5, headerAlign: "center" },
    { field: "date", headerName: "Date", flex: 1, headerAlign: "center" },
    // {
    //   field: "action",
    //   headerName: "Action",
    //   flex: 0.5,
    //   headerAlign: "center",
    //   renderCell: (params) => (
    //       hasPermission(userPermissions, "plant", "isChange") ? (
    //     <IconButton color="primary" onClick={() => handleEditPlant(params.row)}>
    //       <EditIcon />
    //     </IconButton>
    //       ): null
    //   ),
    // },
  ];
  if (hasPermission(userPermissions, "plant", "isChange")) {
    columns.push({
      field: "action",
      headerName: "Action",
      flex: 0.5,
      headerAlign: "center",
      renderCell: (params) => (
         
        <IconButton color="primary" onClick={() => handleEditPlant(params.row)}>
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
    return <div>Error loading plants.</div>;
  }

  return (
    <MDBox p={3}>
      <Card sx={{ maxWidth: "80%", mx: "auto", mt: 3, marginLeft: "auto", marginRight: 0}}>
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
            Plant Listing
          </MDTypography>
          {hasPermission(userPermissions, "plant", "isAdd") && (

          <MDButton
            variant="contained"
            color="primary"
            onClick={() => navigate("/add-plant")}
            sx={{ ml: 2 }}
          >
            Add Plant
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

export default PlantListing;
