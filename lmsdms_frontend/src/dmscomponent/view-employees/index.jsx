import React, { useState,useEffect } from "react";
import { Card } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import { useUserListQuery } from "api/auth/userApi";
import UserAcknowledgementDialog from "./UserAcknowledgementDialog"; // Import the dialog component
import { useAuth } from "hooks/use-auth";
import MDInput from "components/MDInput";
function ViewEmployeeStatus() {
  const { data, refetch,error, isLoading } = useUserListQuery();
  const { user } = useAuth();
  const group = user?.user_permissions?.group || {};
  const groupId = group.id;
  const [searchTerm, setSearchTerm] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null); 

  const renderStatusIcon = (params) => {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
          marginTop: "14px",
        }}
      >
        {params.value ? (
          <CheckCircleIcon style={{ color: "green", width: "22px", height: "22px" }} />
        ) : (
          <CancelIcon
            style={{
              color: "red",
              width: "22px",
              height: "22px",
              cursor: groupId === 8 ? "pointer" : "not-allowed", // Change cursor style based on groupId
            }}
            onClick={() => {
              if (groupId === 8 && params?.field == "is_induction_complete" && params.row.is_department_assigned == true) {
                handleOpenDialog(params.row); // Open the dialog when groupId is 8
              }
            }}
          />
        )}
      </div>
    );
  };
  useEffect(() => {
    refetch();
  }, []);
  // Function to open the dialog and set the selected user
  const handleOpenDialog = (userData) => {
    setSelectedUser(userData); // Set the selected user data
    setOpenDialog(true); // Open the dialog
  };

  // Function to handle the dialog close
  const handleCloseDialog = () => {
    setOpenDialog(false); // Close the dialog
    setSelectedUser(null); // Reset selected user
  };

  // Define the columns
  const columns = [
    { field: "empNo", headerName: "Emp. No.", width: 80 },
    { field: "name", headerName: "Name", width: 150 },
    {
      field: "is_user_created",
      headerName: "Emp. Created",
      width: 120,
      renderCell: renderStatusIcon,
    },
    {
      field: "is_department_assigned",
      headerName: "Dept. Assign",
      width: 130,
      renderCell: renderStatusIcon,
    },
    {
      field: "is_induction_complete",
      headerName: "Induction Completed",
      width: 160,
      renderCell: renderStatusIcon,
    },
    {
      field: "is_induction_certificate",
      headerName: "Induction Certificate",
      width: 160,
      renderCell: renderStatusIcon,
    },
    { field: "is_jr_approve", headerName: "JD Approval", width: 110, renderCell: renderStatusIcon },
    { field: "is_jr_assign", headerName: "JR Assign", width: 100, renderCell: renderStatusIcon },
    {
      field: "is_tni_generate",
      headerName: "Document Reading",
      width: 140,
      renderCell: renderStatusIcon,
    },
    {
      field: "is_tni_consent",
      headerName: "In Assesment",
      width: 120,
      renderCell: renderStatusIcon,
    },
    {
      field: "is_qualification",
      headerName: "Qualification",
      width: 120,
      renderCell: renderStatusIcon,
    },
  ];
  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };
  
  // Convert API data to rows
  const rows = data
  ? data?.data
      .map((user, index) => ({
        id: user.id,
        empNo: user.employee_number,
        name: user.full_name,
        is_user_created: user.is_user_created,
        is_department_assigned: user.is_department_assigned,
        is_induction_complete: user.is_induction_complete,
        is_induction_certificate: user.is_induction_certificate,
        is_jr_assign: user.is_jr_assign,
        is_jr_approve: user.is_jr_approve,
        is_tni_generate: user.is_tni_generate,
        is_tni_consent: user.is_tni_consent,
        is_qualification: user.is_qualification,
      }))
      .filter((user) =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        user.empNo.toLowerCase().includes(searchTerm.toLowerCase())
      ) // Filters by name and employee number
  : [];


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
            Employee Workflow
          </MDTypography>
        </MDBox>

        {/* Loading and Error Handling */}
        {isLoading ? (
          <MDTypography textAlign="center">Loading...</MDTypography>
        ) : error ? (
          <MDTypography color="error" textAlign="center">
            Error fetching data!
          </MDTypography>
        ) : (
          <MDBox display="flex" justifyContent="center" p={2}>
            <DataGrid
              rows={rows}
              columns={columns}
              pageSize={5}
              rowsPerPageOptions={[5]}
              sx={{
                "& .MuiDataGrid-columnHeaders": {
                  whiteSpace: "normal",
                  wordWrap: "normal",
                  lineHeight: "1.2",
                  fontSize: "12px",
                },
              }}
            />
          </MDBox>
        )}
      </Card>

      {/* UserAcknowledgementDialog Component */}
      {selectedUser && (
        <UserAcknowledgementDialog
          open={openDialog}
          onClose={handleCloseDialog}
          onSubmit={(remark) => console.log("Submitted Remark:", remark)} // Handle the remark submission
          selectedUserData={selectedUser} // Pass the selected user data
        />
      )}
    </MDBox>
  );
}

export default ViewEmployeeStatus;
