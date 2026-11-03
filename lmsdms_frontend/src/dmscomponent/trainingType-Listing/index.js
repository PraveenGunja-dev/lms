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
import { useFetchTrainingTypesQuery } from "apilms/trainingtypeApi"; // Import the API hook
import { useFetchPermissionsByGroupIdQuery } from "api/auth/permissionApi";
import { useAuth } from "hooks/use-auth";
import { hasPermission } from "utils/hasPermission";
const TrainingTypeListing = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const group = user?.user_permissions?.group || {};
  const groupId = group.id;

  const { data: userPermissions = [], isError: permissionError } =
    useFetchPermissionsByGroupIdQuery(groupId?.toString(), {
      skip: !groupId,
    });

  const { data, isLoading, isError, refetch } = useFetchTrainingTypesQuery();
  console.log(data);
  useEffect(() => {
    refetch();
  }, [location.key]);

  const handleAddTrainingType = () => {
    navigate("/training-type");
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleEditTrainingType = (item) => {
    navigate("/edit-trainingtype", { state: { item } });
  };

  // Process fetched data and apply search filter
  const filteredData = (data?.data || [])
    .filter((item) => item.training_type_name.toLowerCase().includes(searchTerm.toLowerCase()))
    .map((item, index) => ({
      id: item.id,
      serial_number: index + 1,
      training_type_name: item.training_type_name,
      created_by: `${item.created_by_first_name} ${item.created_by_last_name}`,
      created_at: moment(item.training_type_created_at).format("DD/MM/YY"),
    }));

  const columns = [
    { field: "serial_number", headerName: "Sr. No.", flex: 0.5, headerAlign: "center" },
    { field: "training_type_name", headerName: "Training Type", flex: 1, headerAlign: "center" },
    { field: "created_by", headerName: "Created By", flex: 1, headerAlign: "center" },
    { field: "created_at", headerName: "Created Date", flex: 1, headerAlign: "center" },
    // {
    //   field: "action",
    //   headerName: "Action",
    //   flex: 0.5,
    //   headerAlign: "center",
    //   renderCell: (params) => (
    //     hasPermission(userPermissions, "trainingtype", "isChange") ? (

    //     <MDBox display="flex" gap={1}>
    //       <IconButton
    //         color="primary"
    //         onClick={() => handleEditTrainingType(params.row)} // Pass the training type details
    //       >
    //         <EditIcon />
    //       </IconButton>
    //     </MDBox>
    //     ):null
    //   ),
    //   sortable: false,
    //   filterable: false,
    // },
  ];
  if (hasPermission(userPermissions, "trainingtype", "isChange")) {
    columns.push({
      field: "action",
      headerName: "Action",
      flex: 0.5,
      headerAlign: "center",
      renderCell: (params) => (
        <MDBox display="flex" gap={1}>
          <IconButton
            color="primary"
            onClick={() => handleEditTrainingType(params.row)} // Pass the training type details
          >
            <EditIcon />
          </IconButton>
        </MDBox>
      ),
      sortable: false,
      filterable: false,
    });
  }
  if (isLoading) {
    return <MDTypography variant="h6">Loading...</MDTypography>;
  }

  if (isError) {
    return (
      <MDTypography variant="h6" color="error">
        Failed to fetch data.
      </MDTypography>
    );
  }

  return (
    <MDBox p={3}>
      <Card sx={{ maxWidth: "80%", mx: "auto", mt: 3, marginLeft: "auto", marginRight: 0 }}>
        <MDBox p={3} display="flex" alignItems="center">
          <MDInput
            label="Search Training Type"
            variant="outlined"
            size="small"
            sx={{ width: "250px", mr: 2 }}
            value={searchTerm}
            onChange={handleSearch}
          />
          <MDTypography variant="h4" fontWeight="medium" sx={{ flexGrow: 1, textAlign: "center" }}>
            Training Type Listing
          </MDTypography>
          {hasPermission(userPermissions, "trainingtype", "isAdd") && (
            <MDButton
              variant="contained"
              color="primary"
              onClick={handleAddTrainingType}
              sx={{ ml: 2 }}
            >
              Add Training Type
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

export default TrainingTypeListing;
