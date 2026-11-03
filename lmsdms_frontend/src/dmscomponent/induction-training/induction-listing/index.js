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
import { useGetInductionQuery } from "apilms/InductionApi";
import moment from "moment";
import { useFetchPermissionsByGroupIdQuery } from "api/auth/permissionApi";
import { useAuth } from "hooks/use-auth";
import { hasPermission } from "utils/hasPermission";
import SlideshowIcon from '@mui/icons-material/Slideshow';
const InductionListing = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  // Fetching plant data
  const { data: response, isLoading, isError, refetch } = useGetInductionQuery();
  const { user, role } = useAuth();
  const group = user?.user_permissions?.group || {};
  const groupId = group.id;

  const { data: userPermissions = [], isError: permissionError } =
    useFetchPermissionsByGroupIdQuery(groupId?.toString(), {
      skip: !groupId,
    });
  useEffect(() => {
    refetch();
  }, [location.key]);
  const inductions = response?.data || [];

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };
  
  const handleEditInduction = (induction) => {
    navigate("/edit-induction", { state: { induction } });
  };
  const handleView = (row) => {
    navigate("/pdf-view", { state: { row } });
    console.log(row)
  };
  const filteredData = inductions
    .filter((induction) =>
      induction.induction_name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .map((induction, index) => ({
      ...induction,
      serial_number: index + 1,
      date: moment(induction.created_at).format("DD/MM/YY"),
    }));

  const columns = [
    { field: "serial_number", headerName: "Sr. No.", flex: 0.5, headerAlign: "center" },
    { field: "induction_name", headerName: "Induction Name", flex: 1, headerAlign: "center" },
    { field: "date", headerName: "Date", flex: 1, headerAlign: "center" },
    {
      field: "View",
      headerName: "Pre-View",
      flex: 0.5,
      headerAlign: "center",
      renderCell: (params) => (
        <IconButton color="warning" onClick={() => handleView(params.row)}>
          <SlideshowIcon />
        </IconButton>
      ),
    },
  ];
  if (hasPermission(userPermissions, "induction", "isChange")) {
    columns.push({
      field: "action",
      headerName: "Action",
      flex: 0.5,
      headerAlign: "center",
      renderCell: (params) => (
        <IconButton color="primary" onClick={() => handleEditInduction(params.row)}>
          <EditIcon />
        </IconButton>
      ),
    });
  }
  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (isError) {
    return <div>Error loading induction set.</div>;
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
            Induction Set Listing
          </MDTypography>
          {hasPermission(userPermissions, "induction", "isAdd") && (
            <MDButton
              variant="contained"
              color="primary"
              onClick={() => navigate("/induction-training")}
              sx={{ ml: 2 }}
            >
              Add Induction Set
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

export default InductionListing;
