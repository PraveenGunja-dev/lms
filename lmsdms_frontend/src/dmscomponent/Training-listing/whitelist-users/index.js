import React from 'react';
import PropTypes from 'prop-types';
import { 
  Button, 
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogTitle, 
  CircularProgress, 
  List, 
  ListItem, 
  ListItemText,
  Box,
  Typography
} from '@mui/material';
import { useFetchTrainingWiseUsersQuery } from 'apilms/trainingApi';
import { useToggleUserTrainingMutation } from 'apilms/quizapi';
import MDButton from 'components/MDButton';
import { toast } from 'react-toastify';

function WhiteListDialog({ open, onClose, documentId }) {
    // Fetch users based on documentId
    const { data, error, isLoading,refetch } = useFetchTrainingWiseUsersQuery(documentId, { skip: !documentId });
    
    // Use the toggle mutation hook
    const [toggleUserTraining, { isLoading: isToggling }] = useToggleUserTrainingMutation();
    
    // Handle whitelist toggle
    const handleToggleWhitelist = async (userId, currentStatus) => {
        try {
            // Prepare payload with required fields
            const payload = {
                user_id: userId,
                document_id: documentId,
                is_active: currentStatus // Inverse the current status
            };
            
            // Execute the mutation
            let response = await toggleUserTraining(payload).unwrap();
            if(response.status){
                toast.success("User Whitelisted!")
            }else{
                toast.error("Something went wrong")
            }
            // Optionally, you could refetch the user data here to reflect the changes
            refetch();
        } catch (error) {
            console.error('Failed to toggle whitelist status:', error);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Whitelist Users</DialogTitle>
            <DialogContent>
                {isLoading ? (
                    <Box display="flex" justifyContent="center" p={2}>
                        <CircularProgress />
                    </Box>
                ) : error ? (
                    <Typography color="error">Error loading users: {error.message}</Typography>
                ) : (
                    <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                    <List>
                        {data?.data?.length > 0 ? (
                            data.data.map((user) => (
                                <ListItem 
                                    key={user.id}
                                    secondaryAction={
                                        user.training_assesment_attempted && (
                                            <MDButton
                                                variant="contained" 
                                                color="primary"
                                                disabled={isToggling}
                                                onClick={() => handleToggleWhitelist(user.id, user.training_assesment_attempted)}
                                            >
                                                {isToggling ? 'Processing...' : 'Toggle Whitelist'}
                                            </MDButton>
                                        )
                                    }
                                >
                                    <ListItemText 
                                        primary={user.username} 
                                        secondary={`Assessment Attempted: ${user.training_assesment_attempted ? 'Yes' : 'No'}`} 
                                    />
                                </ListItem>
                            ))
                        ) : (
                            <Typography align="center">No users found</Typography>
                        )}
                    </List>
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="primary">Close</Button>
            </DialogActions>
        </Dialog>
    );
}

// Add PropTypes validation
WhiteListDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    documentId: PropTypes.number.isRequired, // documentId is required and should be a number
};

export default WhiteListDialog;