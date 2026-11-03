import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Card from "@mui/material/Card";
import { DataGrid } from "@mui/x-data-grid";
import IconButton from "@mui/material/IconButton";
import EditIcon from "@mui/icons-material/Edit";
import Switch from "@mui/material/Switch"; // Import Switch
import { styled } from "@mui/system";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDInput from "components/MDInput";
import MDButton from "components/MDButton";
import { useFetchTrainersQuery } from "api/auth/trainerApi";
import moment from "moment";
import { useTrainerActiveDeactiveMutation } from "api/auth/trainerApi";
import { useFetchPermissionsByGroupIdQuery } from "api/auth/permissionApi";
import { useAuth } from "hooks/use-auth";
import { hasPermission } from "utils/hasPermission";
const Android12Switch = styled(Switch)(({ theme }) => ({
  padding: 9,
  "& .MuiSwitch-track": {
    borderRadius: 20 / 2,
    "&::before, &::after": {
      content: '""',
      position: "absolute",
      top: "43%",
      transform: "translateY(-50%)",
      width: 10,
      height: 14,
    },
    "&::before": {
      backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="14" width="14" viewBox="0 0 24 24"><path fill="${encodeURIComponent(
        theme.palette.getContrastText(theme.palette.primary.main)
      )}" d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z"/></svg>')`,
      left: 12,
    },
    "&::after": {
      backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="14" width="14" viewBox="0 0 24 24"><path fill="${encodeURIComponent(
        theme.palette.getContrastText(theme.palette.primary.main)
      )}" d="M19,13H5V11H19V13Z" /></svg>')`,
      right: 22,
    },
  },
  "& .MuiSwitch-thumb": {
    boxShadow: "none",
    width: 14,
    height: 14,
    marginY: 1,
    padding: 4,
  },
}));

const TrainerListing = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const [trainerActiveDeactive] = useTrainerActiveDeactiveMutation();
  const { data: response, isLoading, isError, refetch } = useFetchTrainersQuery();
  const { user, role } = useAuth();
  const group = user?.user_permissions?.group || {};
  const groupId = group.id;

  const { data: userPermissions = [], isError: permissionError } =
    useFetchPermissionsByGroupIdQuery(groupId?.toString(), {
      skip: !groupId,
    });
  useEffect(() => {
    refetch();
  }, [refetch]);

  console.log(response);
  const trainers = response || []; // Safe access using optional chaining

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isError) {
    return <div>Error loading trainers.</div>;
  }

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleEditTrainer = (trainer) => {
    navigate("/edit-trainer", { state: { trainer } });
  };

  const filteredData = trainers
    .filter(
      (trainer) =>
        trainer.trainer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trainer.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .map((trainer, index) => ({
      id: trainer.id,
      serial_number: index + 1,
      trainer_name: trainer.trainer_name,
      description: trainer.description,
      created_at: moment(trainer.created_at).format("DD-MM-YY"),
      active: trainer.is_active, // Assuming the trainer object has is_active property
    }));

  const columns = [
    { field: "serial_number", headerName: "Sr. No.", flex: 0.5, headerAlign: "center" },
    { field: "trainer_name", headerName: "Trainer Name", flex: 1, headerAlign: "center" },
    { field: "description", headerName: "Trainer Description", flex: 1.5, headerAlign: "center" },
    { field: "created_at", headerName: "Created At", flex: 1.5, headerAlign: "center" },
    {
      field: "active",
      headerName: "Inactive/Active",
      flex: 1,
      headerAlign: "center",
      renderCell: (params) => (
        <Android12Switch
          checked={params.row.active} // This ensures the switch is checked if the trainer is active
          onChange={(e) => handleSwitchChange(params.row.id, e.target.checked)}
          color="primary"
        />
      ),
    },
    // {
    //   field: "action",
    //   headerName: "Action",
    //   flex: 0.5,
    //   headerAlign: "center",
    //   renderCell: (params) =>
    //     hasPermission(userPermissions, "trainer", "isChange") ? (
    //       <IconButton color="primary" onClick={() => handleEditTrainer(params.row)}>
    //         <EditIcon />
    //       </IconButton>
    //     ) : null,
    // },
  ];
  if (hasPermission(userPermissions, "trainer", "isChange")) {
    columns.push({
      field: "action",
      headerName: "Action",
      flex: 0.5,
      headerAlign: "center",
      renderCell: (params) => (
        <IconButton color="primary" onClick={() => handleEditTrainer(params.row)}>
          <EditIcon />
        </IconButton>
      ),
    });
  }

  const handleSwitchChange = (trainerId, checked) => {
    // Toggle trainer's active status in the backend
    trainerActiveDeactive(trainerId) // Only pass the trainerId to toggle the active status
      .unwrap()
      .then((response) => {
        console.log("Trainer status updated:", response);
        // After a successful update, you may want to refetch the data or optimistically update the UI
        refetch(); // This ensures the data is updated from the server
      })
      .catch((error) => {
        console.error("Failed to update trainer status:", error);
        // Handle error (e.g., reset the switch to its original state if the update fails)
      });
  };

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
            Trainer Listing
          </MDTypography>
          {hasPermission(userPermissions, "trainer", "isAdd") && (
            <MDButton
              variant="contained"
              color="primary"
              onClick={() => navigate("/add-trainer")}
              sx={{ ml: 2 }}
            >
              Add Trainer
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

export default TrainerListing;
