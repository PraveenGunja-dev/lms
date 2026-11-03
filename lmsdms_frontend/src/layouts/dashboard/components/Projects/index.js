import { useState } from "react";

// @mui material components
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";
import TextField from "@mui/material/TextField";
import { Typography, Box, Button } from "@mui/material";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

// Material Dashboard 2 React examples
import DataTable from "examples/Tables/DataTable";

// Mock data with colored highlight rectangles for both Ver Status and Workflow
const mockData = () => ({
  columns: [
    { Header: "Title", accessor: "title", width: "20%", filter: "text" },
    { Header: "Doc no.", accessor: "doc_no", width: "10%", filter: "text" },
    { Header: "Ver Status", accessor: "ver_status", width: "10%", filter: "text" },
    { Header: "Effective", accessor: "effective", width: "10%", filter: "text" },
    { Header: "Tra.(%)", accessor: "tra", width: "10%", filter: "text" },
    { Header: "Work flow", accessor: "workflow", width: "10%", filter: "text" },
    { Header: "Edit", accessor: "edit", width: "10%" },
    { Header: "Action", accessor: "action", width: "10%" },
  ],
  rows: [
    {
      title: "Document A",
      doc_no: "123",
      ver_status: (
        <Box sx={{ borderRadius: "4px", border: "1px solid green", padding: "2px 8px", bgcolor: "rgba(0, 255, 0, 0.1)" }}>
          Approved
        </Box>
      ),
      effective: "Yes",
      tra: "85%",
      workflow: (
        <Box sx={{ borderRadius: "4px", border: "1px solid blue", padding: "2px 8px", bgcolor: "rgba(0, 0, 255, 0.1)" }}>
          In Progress
        </Box>
      ),
      edit: <Icon sx={{ color: "black" }}>edit</Icon>,
      action: <Icon sx={{ color: "red" }}>delete</Icon>,
    },
    {
      title: "Document B",
      doc_no: "124",
      ver_status: (
        <Box sx={{ borderRadius: "4px", border: "1px solid orange", padding: "2px 8px", bgcolor: "rgba(255, 165, 0, 0.1)" }}>
          Pending
        </Box>
      ),
      effective: "No",
      tra: "65%",
      workflow: (
        <Box sx={{ borderRadius: "4px", border: "1px solid red", padding: "2px 8px", bgcolor: "rgba(255, 0, 0, 0.1)" }}>
          Not Started
        </Box>
      ),
      edit: <Icon sx={{ color: "black" }}>edit</Icon>,
      action: <Icon sx={{ color: "red" }}>delete</Icon>,
    },
    {
      title: "Document C",
      doc_no: "125",
      ver_status: (
        <Box sx={{ borderRadius: "4px", border: "1px solid red", padding: "2px 8px", bgcolor: "rgba(255, 0, 0, 0.1)" }}>
          Rejected
        </Box>
      ),
      effective: "No",
      tra: "45%",
      workflow: (
        <Box sx={{ borderRadius: "4px", border: "1px solid green", padding: "2px 8px", bgcolor: "rgba(0, 255, 0, 0.1)" }}>
          Completed
        </Box>
      ),
      edit: <Icon sx={{ color: "black" }}>edit</Icon>,
      action: <Icon sx={{ color: "red" }}>delete</Icon>,
    },
    {
      title: "Document D",
      doc_no: "126",
      ver_status: (
        <Box sx={{ borderRadius: "4px", border: "1px solid green", padding: "2px 8px", bgcolor: "rgba(0, 255, 0, 0.1)" }}>
          Approved
        </Box>
      ),
      effective: "Yes",
      tra: "90%",
      workflow: (
        <Box sx={{ borderRadius: "4px", border: "1px solid yellow", padding: "2px 8px", bgcolor: "rgba(255, 255, 0, 0.1)" }}>
          In Review
        </Box>
      ),
      edit: <Icon sx={{ color: "black" }}>edit</Icon>,
      action: <Icon sx={{ color: "red" }}>delete</Icon>,
    },
    {
      title: "Document E",
      doc_no: "127",
      ver_status: (
        <Box sx={{ borderRadius: "4px", border: "1px solid orange", padding: "2px 8px", bgcolor: "rgba(255, 165, 0, 0.1)" }}>
          Pending
        </Box>
      ),
      effective: "No",
      tra: "70%",
      workflow: (
        <Box sx={{ borderRadius: "4px", border: "1px solid blue", padding: "2px 8px", bgcolor: "rgba(0, 0, 255, 0.1)" }}>
          In Progress
        </Box>
      ),
      edit: <Icon sx={{ color: "black" }}>edit</Icon>,
      action: <Icon sx={{ color: "red" }}>delete</Icon>,
    },
  ],
});

function Listing() {
  const { columns, rows } = mockData();
  const [filters, setFilters] = useState({
    title: "",
    doc_no: "",
    ver_status: "",
    effective: "",
    tra: "",
    workflow: "",
  });

  const handleFilterChange = (e, column) => {
    setFilters({ ...filters, [column]: e.target.value });
  };

  // Apply filters
  const filteredRows = rows.filter((row) =>
    Object.keys(filters).every((column) =>
      row[column]?.props?.children
        ? row[column].props.children.toLowerCase().includes(filters[column].toLowerCase())
        : row[column].toString().toLowerCase().includes(filters[column].toLowerCase())
    )
  );

  return (
    <Card>
      <MDBox display="flex" justifyContent="space-between" alignItems="center" p={3}>
        <MDBox>
          <MDTypography variant="h4" gutterBottom>
            Listing
          </MDTypography>
          {/* Favorite and Archive buttons */}
          <MDBox display="flex" gap={2} mt={1}>
            <Button
              variant="contained"
              sx={{
                backgroundColor: "#FFDDC1", // pastel orange
                color: "#000",
                "&:hover": { backgroundColor: "#FBC299" }, // darker pastel on hover
                textTransform: "none",
              }}
              startIcon={<Icon>favorite</Icon>}
            >
              Favorite
            </Button>
            <Button
              variant="contained"
              sx={{
                backgroundColor: "#C4F1BE", // pastel green
                color: "#000",
                "&:hover": { backgroundColor: "#A7E3A3" }, // darker pastel on hover
                textTransform: "none",
              }}
              startIcon={<Icon>archive</Icon>}
            >
              Archive
            </Button>
          </MDBox>
        </MDBox>
      </MDBox>

      {/* Filters */}
      <MDBox display="flex" justifyContent="space-between" p={2}>
        {columns.map(
          (column) =>
            column.filter && (
              <TextField
                key={column.accessor}
                label={column.Header}
                value={filters[column.accessor]}
                onChange={(e) => handleFilterChange(e, column.accessor)}
                variant="outlined"
                size="small"
                sx={{ width: "15%" }}
              />
            )
        )}
      </MDBox>

      <MDBox>
        <DataTable table={{ columns, rows: filteredRows }} />
      </MDBox>
    </Card>
  );
}

export default Listing;
