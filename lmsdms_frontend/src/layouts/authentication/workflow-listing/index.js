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
import { useFetchWorkflowsQuery } from "api/auth/workflowApi";
import { useFetchPermissionsByGroupIdQuery } from "api/auth/permissionApi";
import { useAuth } from "hooks/use-auth";
import { hasPermission } from "utils/hasPermission";
import moment from "moment";

const WorkflowListing = () => {
    const { user, role } = useAuth(); 
    const [searchTerm, setSearchTerm] = useState("");
    const navigate = useNavigate();

    // Fetch workflows
    const { data: workflows = [], isLoading, error } = useFetchWorkflowsQuery();

    const group = user?.user_permissions?.group || {};
    const groupId = group.id;
   
    const { data: userPermissions = [], isError: permissionError } = useFetchPermissionsByGroupIdQuery(groupId?.toString(), {
        skip: !groupId, // Ensure it skips if groupId is missing
      });
    

    if (isLoading) return <div>Loading workflows...</div>;
    if (error) return <div>Error loading workflows: {error.message}</div>;

    const formattedData = workflows.map((item, index) => ({
        id: item.id,
        serial_number: index + 1,
        workflow_name: item.workflow_name || "N/A",
        workflow_description: item.workflow_description || "N/A",
        created_at: moment(item.created_at).format("DD/MM/YY"),
    }));

    const handleSearch = (event) => {
        setSearchTerm(event.target.value);
    };

    const handleEditWorkflow = (workflow) => {
        navigate("/update-workflow", { state: { workflow } });
    };

    const filteredData = formattedData.filter(
        (workflow) =>
            workflow.workflow_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            workflow.workflow_description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const columns = [
        { field: "serial_number", headerName: "Sr. No.", flex: 0.5, headerAlign: "center" },
        { field: "workflow_name", headerName: "Workflow Name", flex: 1, headerAlign: "center" },
        { field: "workflow_description", headerName: "Workflow Description", flex: 1.5, headerAlign: "center" },
        { field: "created_at", headerName: "Created At", flex: 0.75, headerAlign: "center" },
        {
            field: "action",
            headerName: "Action",
            flex: 0.5,
            headerAlign: "center",
            renderCell: (params) => (
                hasPermission(userPermissions, "workflowmodel", "isChange") ? (
                    <IconButton color="primary" onClick={() => handleEditWorkflow(params.row)}>
                        <EditIcon />
                    </IconButton>
                ) : null
            ),
        },
    ];

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
                        Workflow Listing
                    </MDTypography>

                    {/* Show the 'Add Workflow' button if the user has the 'isAdd' permission */}
                    {hasPermission(userPermissions, "workflowmodel", "isAdd") && (
                        <MDButton
                            variant="contained"
                            color="primary"
                            onClick={() => navigate("/add-workflow")}
                            sx={{ ml: 2 }}
                        >
                            Add Workflow
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

export default WorkflowListing;
