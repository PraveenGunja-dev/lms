import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Card from "@mui/material/Card";
import { DataGrid } from "@mui/x-data-grid";
import IconButton from "@mui/material/IconButton";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDInput from "components/MDInput";
import MDButton from "components/MDButton";
import AddinventoryDialog from "./inventory";
import UpdateinventoryDialog from "./edit";
import { useViewInventoryQuery, useDeleteInventoryMutation } from "api/auth/inventoryApi";
import { useFetchPermissionsByGroupIdQuery } from "api/auth/permissionApi";
import { useAuth } from "hooks/use-auth";
import { hasPermission } from "utils/hasPermission";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import moment from 'moment';

const InventoryListing = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [inventories, setInventories] = useState([]);
  const [inventoryToDelete, setInventoryToDelete] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [inventoryId, setInventoryId] = useState(null);
  const [inventoryName, setInventoryName] = useState("");

  const { user, role } = useAuth();
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useViewInventoryQuery();

  const group = user?.user_permissions?.group || {};
  const groupId = group.id;
 

  const { data: userPermissions = [], isError: permissionError } = useFetchPermissionsByGroupIdQuery(groupId?.toString(), {
    skip: !groupId, // Ensure it skips if groupId is missing
  });

  useEffect(() => {
    if (data) {
      setInventories(data);
    }
  }, [data]);

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleUpdate = (id, inventory_name) => {
    console.log("Clicked Edit, ID:", id, "Name:", inventory_name);
    setInventoryId(id);
    setInventoryName(inventory_name);
    setEditDialogOpen(true);
  };

  const [deleteInventory] = useDeleteInventoryMutation();

  const handleDelete = async () => {
    if (inventoryToDelete) {
      try {
        const response = await deleteInventory(inventoryToDelete).unwrap();
        if (response.status) {
          setInventories((prevInventories) =>
            prevInventories.filter((inventory) => inventory.id !== inventoryToDelete)
          );
          setConfirmationDialogOpen(false);
          setInventoryToDelete(null);
        } else {
          console.error("Error deleting inventory:", response.message || "Unknown error");
        }
      } catch (error) {
        console.error("Error deleting inventory:", error);
      }
    }
  };

  const handleDeleteClick = (id) => {
    setInventoryToDelete(id);
    setConfirmationDialogOpen(true);
  };

  const handleCloseConfirmationDialog = () => {
    setConfirmationDialogOpen(false);
    setInventoryToDelete(null);
  };

  const filteredData = inventories?.filter(
    (inventory) =>
      inventory.inventory_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inventory.created_at.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const rowsWithSerial = filteredData?.map((inventory_name, index) => ({
    ...inventory_name,
    srNo: index + 1,
  }));

  const columns = [
    { field: "srNo", headerName: "Sr. No.", flex: 0.5, headerAlign: "center" },
    { field: "inventory_name", headerName: "Inventory Name", flex: 1, headerAlign: "center" },
    {
    field: "created_at",
    headerName: "Date",
    flex: 1,
    headerAlign: "center",
    renderCell: (params) => {
      // Format the date using moment
      return moment(params.row.created_at).format("DD/MM/YY");
    },
  },
    {
      field: "action",
      headerName: "Action",
      flex: 1,
      headerAlign: "center",
      renderCell: (params) => (
        <div>
          {hasPermission(userPermissions, "dynamicinventory", "isChange") && (
            <IconButton color="primary" onClick={() => handleUpdate(params.id, params.row.inventory_name)}>
              <EditIcon />
            </IconButton>
          )}
          {hasPermission(userPermissions, "dynamicinventory", "isDelete") && (
            <IconButton color="error" onClick={() => handleDeleteClick(params.id)}>
              <DeleteIcon />
            </IconButton>
          )}
        </div>
      ),
    },
  ];

  const handleAddClick = () => {
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  if (isLoading) return <MDTypography variant="h5">Loading...</MDTypography>;
  if (isError) return <MDTypography variant="h5">Error loading inventory.</MDTypography>;

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
            Inventory
          </MDTypography>
          {hasPermission(userPermissions, "dynamicinventory", "isAdd") && (
            <MDButton variant="contained" color="primary" sx={{ ml: 2 }} onClick={handleAddClick}>
              Add
            </MDButton>
          )}
        </MDBox>
        <MDBox display="flex" justifyContent="center" p={2}>
          <div style={{ height: 500, width: "100%" }}>
            <DataGrid
              rows={rowsWithSerial || []}
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
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                },
              }}
            />
          </div>
        </MDBox>
      </Card>

      <AddinventoryDialog open={dialogOpen} handleClose={handleCloseDialog} refetch={refetch} />
      <UpdateinventoryDialog
        open={editDialogOpen}
        handleClose={() => setEditDialogOpen(false)}
        inventoryId={inventoryId}
        inventoryName={inventoryName}
      />

      {/* Confirmation Dialog */}
      <Dialog open={confirmationDialogOpen} onClose={handleCloseConfirmationDialog}>
        <DialogTitle>Delete Inventory</DialogTitle>
        <DialogContent>
          <MDTypography variant="body2">Are you sure you want to delete this inventory?</MDTypography>
        </DialogContent>
        <DialogActions>
          <MDButton onClick={handleCloseConfirmationDialog}>Cancel</MDButton>
          <MDButton color="error" onClick={handleDelete}>
            Delete
          </MDButton>
        </DialogActions>
      </Dialog>
    </MDBox>
  );
};

export default InventoryListing;