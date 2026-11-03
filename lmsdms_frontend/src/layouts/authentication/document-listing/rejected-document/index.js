import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useGetDocumentDataOfStatusIdElevenQuery } from "api/auth/dashboardApi"; // Use the new API
import { useFetchDepartmentsQuery } from "api/auth/departmentApi";
import Card from "@mui/material/Card";
import { DataGrid } from "@mui/x-data-grid";
import IconButton from "@mui/material/IconButton";
import EditIcon from "@mui/icons-material/Edit";
import EditCalendarIcon from "@mui/icons-material/EditCalendar";
import PreviewIcon from "@mui/icons-material/Preview";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDInput from "components/MDInput";
import MDButton from "components/MDButton";
import { hasPermission } from "utils/hasPermission";
import PropTypes from "prop-types";
import { useAuth } from "hooks/use-auth";
import moment from "moment";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ConditionalDialog from "../effective";
import VisibilityIcon from "@mui/icons-material/Visibility";
import SubjectRoundedIcon from '@mui/icons-material/SubjectRounded';
import {
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Button,
  DialogContent,
  Dialog,
  DialogTitle,
  DialogActions,
  TextField,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useFetchPermissionsByGroupIdQuery } from "api/auth/permissionApi";

const RejectedDocument = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState(""); // Department Selector State
  const [selectedDateRange, setSelectedDateRange] = useState(""); // Date Range Selector State
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [selectedRemarks, setSelectedRemarks] = useState("");
  const { data, refetch, isLoading, isError } = useGetDocumentDataOfStatusIdElevenQuery({
    departmentId: selectedDepartment,
    startDate: startDate ? moment(startDate).format("DD-MM-YYYY") : "", // Format start date
    endDate: endDate ? moment(endDate).format("DD-MM-YYYY") : "", // Format end date
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

  const { data: departmentData, isLoading: isDepartmentsLoading } = useFetchDepartmentsQuery();
  const group = user?.user_permissions?.group || {};
  const groupId = group.id;

  const { data: userPermissions = [], isError: permissionError } =
    useFetchPermissionsByGroupIdQuery(groupId?.toString(), {
      skip: !groupId,
    });
  useEffect(() => {
    if (selectedDepartment && startDate && endDate) {
      refetch();
    }
  }, [selectedDepartment, startDate, endDate, refetch]); // Add these dependencies to refetch when conditions change
  useEffect(() => {
    refetch();
  }, []);
  const documents = data?.rejectdata || []; // Extract documents from the new API response
  const handleDialogOpen = (row) => {
    setSelectedRow(row);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedRow(null);
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleClick = (params) => {
    if (!params || !params.row) {
      console.error("Invalid params object:", params);
      return; // Exit if params or row is missing
    }

    const {
      id,
      document_current_status,
      training_required,
      approval_status,
      version,
      select_template,
      is_reviewed,
    } = params.row;

    if (
      id === undefined ||
      document_current_status === undefined ||
      training_required === undefined ||
      approval_status === undefined
    ) {
      console.error("Missing data in params.row:", params.row);
      return;
    }

    // navigate(
    //   `/document-view/${id}?status=${document_current_status}&training_required=${training_required},&approval_status=${approval_status}`
    // );
    navigate(
      `/document-view/${id}?status=${document_current_status}&training_required=${training_required}&approvalstatus=${approval_status}&version=${version}&templateID=${select_template}&is_reviewed=${is_reviewed}`
    );
  };

  const formatDate = (date) => {
    if (date) {
      return moment(date).format("DD/MM/YYYY");
    }
    return "";
  };

  const handleDateRangeChange = (event) => {
    const selectedRange = event.target.value;
    setSelectedDateRange(selectedRange);

    const today = new Date();
    let startDate, endDate;

    switch (selectedRange) {
      case "today":
        startDate = today;
        endDate = today;
        break;
      case "yesterday":
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 1);
        endDate = startDate;
        break;
      case "last7Days":
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
        endDate = today;
        break;
      case "last30Days":
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 30);
        endDate = today;
        break;
      case "thisMonth":
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      case "lastMonth":
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        endDate = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case "lastYear":
        startDate = new Date(today.getFullYear() - 1, 0, 1);
        endDate = new Date(today.getFullYear() - 1, 11, 31);
        break;
      case "custom":
        setStartDate(null);
        setEndDate(null);
        return;
      default:
        return;
    }

    setStartDate(startDate);
    setEndDate(endDate);
  };

  const handleCustomDateChange = (type, date) => {
    if (type === "start") setStartDate(date);
    if (type === "end") setEndDate(date);
  };

  const filteredData = documents.filter(
    (doc) =>
      doc.document_name?.toString().includes(searchTerm.toLowerCase()) ||
      doc.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.remarks?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.created_at?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const handleOpenDialog = (remarks) => {
    setSelectedRemarks(remarks);
    setOpen(true);
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setSelectedRemarks("");
  };

  const rows = filteredData.map((doc, index) => ({
    ...doc,
    id: index, // Use index as the unique ID
    srNo: index + 1,
    created_at: moment(doc.created_at).format("DD/MM/YY"),
  }));

  const columns = [
    {
      field: "srNo",
      headerName: "Sr.No.",
      flex: 0.3,
      headerAlign: "center",
      sortable: false,
      filterable: false,
    },
    {
      field: "document_name",
      headerName: "Document",
      flex: 0.6,
      headerAlign: "center",
    },
    {
      field: "name",
      headerName: "Name",
      flex: 0.6,
      headerAlign: "center",
    },
    {
      field: "remarks",
      headerName: "Remarks",
      flex: 0.8,
      headerAlign: "center",
      renderCell: (params) => (
        <MDButton
          variant="outlined"
          color="warning"
          onClick={() => handleOpenDialog(params.row.remarks)}
        >
          <SubjectRoundedIcon/>
        </MDButton>
      ),
    },
    {
      field: "status_name",
      headerName: "Status",
      flex: 0.6,
      headerAlign: "center",
    },
    {
      field: "created_at",
      headerName: "Created Date",
      flex: 0.5,
      headerAlign: "center",
    },
  ];

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error fetching documents.</div>;

  if (isDepartmentsLoading) return <div>Loading Departments...</div>;

  return (
    <MDBox p={3}>
      <Card sx={{ maxWidth: "80%", mx: "auto", mt: 3, marginLeft: "auto", marginRight: 0 }}>
        <MDBox p={3} display="flex" alignItems="center">
          {/* Department Dropdown */}
          {/* <FormControl sx={{ minWidth: 180, mr: 2 }}>
            <InputLabel>Department</InputLabel>
            <Select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              label="Department"
              sx={{
                minWidth: 200,
                height: "2.5rem",
                ".MuiSelect-select": { padding: "0.45rem" },
              }}
            >
              {departmentData?.map((department) => (
                <MenuItem key={department.id} value={department.id}>
                  {department.department_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl> */}

          <MDInput
            label="Search"
            variant="outlined"
            size="small"
            sx={{ width: "250px", mr: 2 }}
            value={searchTerm}
            onChange={handleSearch}
          />

          <MDTypography
            variant="h4"
            fontWeight="medium"
            sx={{ flexGrow: 1, textAlign: "center", mr: 28 }}
          >
            Rejected Revise Document List
          </MDTypography>

          {/* Date Range Dropdown */}
          {/* <FormControl sx={{ minWidth: 180 }}>
            <InputLabel>Date Range</InputLabel>
            <Select
              value={selectedDateRange}
              onChange={handleDateRangeChange}
              label="Date Range"
              sx={{
                minWidth: 200,
                height: "2.5rem",
                ".MuiSelect-select": { padding: "0.45rem" },
              }}
            >
              <MenuItem value="today">Today</MenuItem>
              <MenuItem value="yesterday">Yesterday</MenuItem>
              <MenuItem value="last7Days">Last 7 Days</MenuItem>
              <MenuItem value="last30Days">Last 30 Days</MenuItem>
              <MenuItem value="thisMonth">This Month</MenuItem>
              <MenuItem value="lastMonth">Last Month</MenuItem>
              <MenuItem value="lastYear">Last Year</MenuItem>
              <MenuItem value="custom">Custom</MenuItem>
            </Select>
          </FormControl> */}
        </MDBox>

        {/* Selected Date Range Display */}
        <MDBox display="flex" alignItems="center" mt={2} sx={{ marginBottom: "20px" }}>
          {selectedDateRange && selectedDateRange !== "custom" && (
            <MDTypography variant="h6" sx={{ marginLeft: "auto", marginRight: "20px" }}>
              Selected Date: {formatDate(startDate)} to {formatDate(endDate)}
            </MDTypography>
          )}

          {selectedDateRange === "custom" && (
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <MDBox display="flex" gap={2} sx={{ marginLeft: "auto" }}>
                <DatePicker
                  label="Start Date"
                  value={startDate}
                  onChange={(date) => handleCustomDateChange("start", date)}
                  renderInput={(params) => <MDInput {...params} />}
                />
                <DatePicker
                  label="End Date"
                  value={endDate}
                  onChange={(date) => handleCustomDateChange("end", date)}
                  renderInput={(params) => <MDInput {...params} />}
                />
              </MDBox>
            </LocalizationProvider>
          )}
        </MDBox>

        <MDBox display="flex" justifyContent="center" sx={{ height: 500, mt: 2 }}>
          <div style={{ height: 500, width: "100%" }}>
            <DataGrid
              rows={rows}
              columns={columns}
              pageSize={5}
              rowsPerPageOptions={[5]}
              disableSelectionOnClick
              sx={{
                border: "1px solid #ddd",
                borderRadius: "4px",
                "& .MuiDataGrid-columnHeaders": {
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
      <Dialog open={open} onClose={handleCloseDialog} fullWidth maxWidth="lg">
        <DialogTitle>Remarks</DialogTitle>

        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={10} // Ensures 7-row space
            value={selectedRemarks || "No Remarks Available"}
            variant="outlined"
            InputProps={{ readOnly: true }} // Makes it non-editable
          />
        </DialogContent>

        <DialogActions>
          <MDButton onClick={handleCloseDialog} variant="contained" color="error">
            Cancel
          </MDButton>
        </DialogActions>
      </Dialog>
      <ConditionalDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        onConfirm={() => console.log("Confirmed for row:", selectedRow)}
        trainingStatus={selectedRow?.training_required || "false"}
        documentId={selectedRow?.id || ""}
        revisionMonth={selectedRow?.revision_month}
        isParent={selectedRow?.is_parent}
      />
    </MDBox>
  );
};

export default RejectedDocument;
