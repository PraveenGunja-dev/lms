import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '@mui/material/Card';
import { DataGrid } from '@mui/x-data-grid';
import IconButton from '@mui/material/IconButton';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MDBox from 'components/MDBox';
import MDTypography from 'components/MDTypography';
import MDInput from 'components/MDInput';
import MDButton from 'components/MDButton';
import AddStatusDialog from './status';
import UpdateStatusDialog from './edit';  // Import the update status dialog
import { useViewStatusQuery, useDeleteStatusMutation } from 'api/auth/statusApi'; 
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { useFetchPermissionsByGroupIdQuery } from 'api/auth/permissionApi';
import { useAuth } from 'hooks/use-auth';
import { hasPermission } from 'utils/hasPermission';
import moment from 'moment';

const StatusListing = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [statuses, setStatuses] = useState([]);
  const [statusToDelete, setStatusToDelete] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);  
  const [statusId, setStatusId] = useState(null);  
  const [statusText, setStatusText] = useState(''); 
  const navigate = useNavigate();
  const { user, role } = useAuth();

  const { data, isLoading, isError, refetch } = useViewStatusQuery();

  const group = user?.user_permissions?.group || {};
  const groupId = group.id;
 
  const { data: userPermissions = [], isError: permissionError } = useFetchPermissionsByGroupIdQuery(groupId?.toString(), {
    skip: !groupId, // Ensure it skips if groupId is missing
  });

  useEffect(() => {
    if (data) {
      setStatuses(data);
    }
  }, [data]);

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleUpdate = (id, status) => {
    setStatusId(id);
    setStatusText(status);
    setEditDialogOpen(true);  // Open the update dialog
  };

  const [deleteStatus] = useDeleteStatusMutation();

  const handleDelete = async () => {
    if (statusToDelete) {
      try {
        const response = await deleteStatus(statusToDelete).unwrap();
        if (response.status) {
          setStatuses((prevStatuses) => prevStatuses.filter((status) => status.id !== statusToDelete));
          setConfirmationDialogOpen(false);
        } else {
          console.error('Error deleting status:', response.message || 'Unknown error');
        }
      } catch (error) {
        console.error('Error deleting status:', error);
      }
    }
  };

  
  const handleCloseConfirmationDialog = () => {
    setConfirmationDialogOpen(false);
    setStatusToDelete(null);
  };

  const filteredData = statuses?.filter(
    (status) =>
      status.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
      status.created_at.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const rowsWithSerial = filteredData?.map((status, index) => ({
    ...status,
    srNo: index + 1,
    created_at: moment(status.created_at).format("DD/MM/YY"), 
  }));

  const columns = [
    { field: 'srNo', headerName: 'Sr. No.', flex: 0.5, headerAlign: 'center' },
    { field: 'status', headerName: 'Status', flex: 1, headerAlign: 'center' },
    { field: 'created_at', headerName: 'Date', flex: 1, headerAlign: 'center' },
    {
      field: 'action',
      headerName: 'Action',
      flex: 1,
      headerAlign: 'center',
      renderCell: (params) => (
        <div>
          {/* Role-based rendering for Edit and Delete buttons */}
          {hasPermission(userPermissions, "dynamicstatus", "isChange") && (
            <IconButton color="primary" onClick={() => handleUpdate(params.id, params.row.status)}>
              <EditIcon />
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
  if (isError) return <MDTypography variant="h5">Error loading statuses.</MDTypography>;

  return (
    <MDBox p={3}>
      <Card sx={{ maxWidth: "80%", mx: "auto", mt: 3, marginLeft: 'auto', marginRight: 0 }}>
        <MDBox p={3} display="flex" alignItems="center">
          <MDInput
            label="Search"
            variant="outlined"
            size="small"
            sx={{ width: '250px', mr: 2 }}
            value={searchTerm}
            onChange={handleSearch}
          />
          <MDTypography variant="h4" fontWeight="medium" sx={{ flexGrow: 1, textAlign: 'center' }}>
            Status
          </MDTypography>
          {hasPermission(userPermissions, "dynamicstatus", "isAdd") && (
            <MDButton variant="contained" color="primary" sx={{ ml: 2 }} onClick={handleAddClick}>
              Add
            </MDButton>
          )}
        </MDBox>
        <MDBox display="flex" justifyContent="center" p={2}>
          <div style={{ height: 500, width: '100%' }}>
            <DataGrid
              rows={rowsWithSerial || []}
              columns={columns}
              pageSize={5}
              rowsPerPageOptions={[5, 10, 20]}
              disableSelectionOnClick
              sx={{
                border: '1px solid #ddd',
                borderRadius: '4px',
                '& .MuiDataGrid-columnHeaders': {
                  display: 'flex',
                  justifyContent: 'center',
                  backgroundColor: '#f5f5f5',
                  fontWeight: 'bold',
                },
                '& .MuiDataGrid-cell': {
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                },
              }}
            />
          </div>
        </MDBox>
      </Card>

      <AddStatusDialog open={dialogOpen} handleClose={handleCloseDialog} refetch={refetch} />
      <UpdateStatusDialog
        open={editDialogOpen}
        handleClose={() => setEditDialogOpen(false)}
        statusId={statusId}
        statusText={statusText}
      />
      
      {/* Confirmation Dialog */}
      <Dialog open={confirmationDialogOpen} onClose={handleCloseConfirmationDialog}>
        <DialogTitle>Delete Status</DialogTitle>
        <DialogContent>
          <MDTypography variant="body2">Are you sure you want to delete this status?</MDTypography>
        </DialogContent>
        <DialogActions>
          <MDButton onClick={handleCloseConfirmationDialog}>Cancel</MDButton>
          <MDButton color="error" onClick={handleDelete}>Delete</MDButton>
        </DialogActions>
      </Dialog>
    </MDBox>
  );
};

export default StatusListing;
