import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Card from "@mui/material/Card";
import { DataGrid } from "@mui/x-data-grid";
import IconButton from "@mui/material/IconButton";
import EditIcon from "@mui/icons-material/Edit";
import InfoIcon from "@mui/icons-material/Info";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDInput from "components/MDInput";
import MDButton from "components/MDButton";
import { getUserGroups } from "api/auth/auth";

const RolesPermissionsListing = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [userGroups, setUserGroups] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedId, setSelectedId] = useState(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserGroups = async () => {
            try {
                const response = await getUserGroups();
                setUserGroups(response.data.data || []);
            } catch (err) {
                console.error("Error fetching user groups:", err);
                setError(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchUserGroups();
    }, []);

    if (isLoading) return <div>Loading roles...</div>;
    if (error) return <div>Error loading roles: {error.message}</div>;

    const formattedData = userGroups.map((item, index) => ({
        id: item.id,
        serial_number: index + 1,
        role: item.name || "N/A",
        added_date: new Date(item.created_at).toLocaleDateString(),
    }));

    const handleSearch = (event) => {
        setSearchTerm(event.target.value);
    };

    const handleEditRole = (role) => {
        navigate("/update-permissions", { state: { role } });
    };

    const handleViewId = (id) => {
        setSelectedId(id);
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setSelectedId(null);
    };

    const filteredData = formattedData.filter((role) =>
        role.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const columns = [
        { field: "serial_number", headerName: "Sr. No.", flex: 0.5, headerAlign: "center" },
        { field: "role", headerName: "Role", flex: 1, headerAlign: "center" },
        {
            field: "action",
            headerName: "Action",
            flex: 0.5,
            headerAlign: "center",
            renderCell: (params) => (
                <>
                    <IconButton
                        color="primary"
                        onClick={() => handleEditRole(params.row)}
                    >
                        <EditIcon />
                    </IconButton>
                </>
            ),
        },
    ];

    return (
        <MDBox p={3}>
            <Card
                sx={{
                    maxWidth: "80%",
                    mx: "auto",
                    mt: 3,
                    marginLeft: "auto",
                    marginRight: 0,
                }}
            >
                <MDBox p={3} display="flex" alignItems="center">
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
                        sx={{ flexGrow: 1, textAlign: "center" }}
                    >
                        Roles & Permissions
                    </MDTypography>
                    <MDButton
                        variant="contained"
                        color="primary"
                        onClick={() => navigate("/add-permissions")}
                        sx={{ ml: 2 }}
                    >
                        Add Role
                    </MDButton>
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

export default RolesPermissionsListing;
