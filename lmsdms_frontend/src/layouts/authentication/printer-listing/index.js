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
import { useGetPrintersQuery } from "api/auth/PrinterApi"; // Import the API hook
import { useFetchPermissionsByGroupIdQuery } from "api/auth/permissionApi";
import { hasPermission } from "utils/hasPermission";
import { useAuth } from "hooks/use-auth";

const PrinterListing = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();
  const group = user?.user_permissions?.group || {};
  const groupId = group.id;

  const { data: printers, isLoading, isError } = useGetPrintersQuery();
  const { data: userPermissions = [], isError: permissionError } = useFetchPermissionsByGroupIdQuery(
    groupId?.toString(),
    {
      skip: !groupId, // Ensure it skips if groupId is missing
    }
  );

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleEditPrinter = (printer) => {
    navigate("/update-printer", { state: { printer } });
  };

  const handleAddPrinter = () => {
    navigate("/add-printer");
  };

  // Filter printers based on search term
  const filteredData = printers
    ? printers
        .filter(
          (printer) =>
            printer.printer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            printer.printer_description.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .map((printer, index) => ({
          ...printer,
          serial_number: index + 1, // Add serial_number after filtering
        }))
    : [];

  const columns = [
    { field: "serial_number", headerName: "Sr. No.", flex: 0.5, headerAlign: "center" },
    { field: "printer_name", headerName: "Printer Name", flex: 1, headerAlign: "center" },
    { field: "printer_description", headerName: "Printer Location", flex: 1.5, headerAlign: "center" },
    {
      field: "action",
      headerName: "Action",
      flex: 0.5,
      headerAlign: "center",
      renderCell: (params) => (
        <MDBox display="flex" gap={1}>
          {hasPermission(userPermissions, "printermachinesmodel", "isChange") && (
            <IconButton color="primary" onClick={() => handleEditPrinter(params.row)}>
              <EditIcon />
            </IconButton>
          )}
        </MDBox>
      ),
      sortable: false,
      filterable: false,
    },
  ];

  // Handle loading and error states
  if (isLoading) return <div>Loading...</div>;
  if (isError || permissionError) return <div>Error loading data or permissions.</div>;

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
            Printer Listing
          </MDTypography>
          {hasPermission(userPermissions, "printermachinesmodel", "isAdd") && (
            <MDButton variant="contained" color="primary" onClick={handleAddPrinter} sx={{ ml: 2 }}>
              Add Printer
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

export default PrinterListing;
