import React, { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
  Box,
  Typography,
  Paper,
  Divider,
  IconButton,
  Chip,
  Alert,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import {
  ArrowForward as ArrowForwardIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Info as InfoIcon,
} from "@mui/icons-material";
import { useUserListQuery } from "api/auth/userApi";
import { useGetJobRoleQuery } from "apilms/jobRoleApi";
import { useJobroleAssignTrainingMutation, useJobroleAssignTrainingListQuery } from "apilms/MappingApi";
import { toast } from "react-toastify";


import MDButton from "components/MDButton";


const TrainingMapping = () => {
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedJobRoles, setSelectedJobRoles] = useState([]);
  const [assignedJobRoles, setAssignedJobRoles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: userData, isLoading: userLoading } = useUserListQuery();
  const { data: jobRoleData, isLoading: jobRoleLoading } = useGetJobRoleQuery();
  const [assignJobRoles] = useJobroleAssignTrainingMutation();
  
  // Fetch already assigned job roles when user is selected
  const { 
    data: assignedJobRoleData, 
    isLoading: assignedJobRoleIsLoading 
  } = useJobroleAssignTrainingListQuery(selectedUser, { 
    skip: !selectedUser 
  });

  // Initialize assigned job roles when user changes or when fetching completes
  useEffect(() => {
    if (selectedUser && assignedJobRoleData?.data?.[0]?.job_roles) {
      // Extract job role IDs from assigned data
      const existingAssignments = assignedJobRoleData.data[0].job_roles.map(role => role.id);
      setAssignedJobRoles(existingAssignments);
    } else if (selectedUser && !assignedJobRoleIsLoading) {
      // Clear assignments if no data is found
      setAssignedJobRoles([]);
    }
  }, [selectedUser, assignedJobRoleData, assignedJobRoleIsLoading]);

  // Reset selections when job role data changes
  useEffect(() => {
    if (jobRoleData) {
      setSelectedJobRoles([]);
    }
  }, [jobRoleData]);

  const handleUserChange = (e) => {
    const newUser = e.target.value;
    setSelectedUser(newUser);
    // Reset selections when user changes
    setSelectedJobRoles([]);
  };

  const handleAssign = () => {
    setAssignedJobRoles((prev) => [...prev, ...selectedJobRoles]);
    setSelectedJobRoles([]);
  };

  const handleUnassign = (jobRoleId) => {
    setAssignedJobRoles((prev) => prev.filter((id) => id !== jobRoleId));
  };

  const handleToggleSelect = (jobRoleId) => {
    setSelectedJobRoles((prev) => 
      prev.includes(jobRoleId)
        ? prev.filter(id => id !== jobRoleId)
        : [...prev, jobRoleId]
    );
  };
  
  const handleSelectAll = () => {
    const availableJobRoles = getAvailableJobRoles();
    const availableIds = availableJobRoles.map(role => role.id);
    
    if (availableIds.length === selectedJobRoles.length) {
      setSelectedJobRoles([]);
    } else {
      setSelectedJobRoles(availableIds);
    }
  };

  const handleSubmit = async () => {
    if (!selectedUser) {
      toast.warning("Please select a user first");
      return;
    }
    
    // if (assignedJobRoles.length === 0) {
    //   toast.warning("Please assign at least one job role");
    //   return;
    // }
    
    setIsSubmitting(true);
    try {
      await assignJobRoles({ 
        user_id: selectedUser, 
        job_role_ids: assignedJobRoles 
      });
      toast.success("Job roles assigned successfully!");
      // Don't reset assigned job roles as they're now persisted
    } catch (err) {
      toast.error("Error assigning job roles");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get the user name for display
  const getUserName = () => {
    if (!selectedUser || !userData?.data) return "";
    const user = userData.data.find(user => user.id === selectedUser);
    return user?.full_name || "";
  };

  // Filter out already assigned job roles from available list
  const getAvailableJobRoles = () => {
    if (!jobRoleData?.data) return [];
    
    return jobRoleData.data.filter(role => {
      return !assignedJobRoles.includes(role.id);
    });
  };

  // Get job role objects for assigned IDs
  const getAssignedJobRoleObjects = () => {
    if (!jobRoleData?.data) return [];
    console.log("Check..",assignedJobRoles);
    return assignedJobRoles.map(id => {
      const role = jobRoleData.data.find(r => r.id === id);
      return role;
    }).filter(Boolean);
  };

  // Normalize job role object structure
  const normalizeJobRole = (role) => {
    return {
      id: role.id,
      title: role.job_role_name || role.name,
      description: role.description || 'Job Role'
    };
  };

  return (
    <Paper elevation={3} sx={{ maxWidth: 900, mx: "auto", my: 4, p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center" color="primary">
        Job Role Mapping
      </Typography>
      <Divider sx={{ mb: 4 }} />
      
      {/* User Selection */}
      <Card elevation={2} sx={{ mb: 4 }}>
        <CardHeader 
          title="Select User" 
          subheader="Choose a user to assign job roles to"
          avatar={
            <Tooltip title="First select a user before assigning job roles">
              <InfoIcon color="info" />
            </Tooltip>
          }
        />
        <CardContent>
          <FormControl fullWidth variant="outlined">
            <InputLabel id="user-label">User</InputLabel>
            <Select
              labelId="user-label"
              value={selectedUser}
              onChange={handleUserChange}
              label="User"
              disabled={userLoading}


              sx={{
                padding:'10px'
              }}

            >
              {userData?.data?.filter(user => user.is_jr_approve).map((user) => (
                <MenuItem key={user.id} value={user.id}>
                  {user.full_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          {selectedUser && (
            <Chip 
              label={`Selected: ${getUserName()}`} 
              color="primary" 
              sx={{ mt: 2 }}
            />
          )}
        </CardContent>
      </Card>
      
      {/* Job Role Assignment Section */}
      <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={3}>
        {/* Available Job Roles */}
        <Card elevation={2} sx={{ flex: 1 }}>
          <CardHeader 
            title="Available Job Roles" 
            subheader="Select job roles to assign"
            action={
              <Button 
                size="small" 
                onClick={handleSelectAll}
                disabled={jobRoleLoading || getAvailableJobRoles().length === 0}
              >
                {selectedJobRoles.length === getAvailableJobRoles().length ? 'Deselect All' : 'Select All'}
              </Button>
            }
          />
          <Divider />
          <CardContent sx={{ maxHeight: 400, overflow: 'auto' }}>
            {jobRoleLoading ? (
              <Box display="flex" justifyContent="center" p={2}>
                <CircularProgress size={24} />
                <Typography ml={2}>Loading job roles...</Typography>
              </Box>
            ) : getAvailableJobRoles().length === 0 ? (
              <Alert severity="info">
                No available job roles to assign
              </Alert>
            ) : (
              <List dense>
                {getAvailableJobRoles().map((role) => {
                  const normalizedRole = normalizeJobRole(role);
                  return (
                    <ListItem 
                      key={normalizedRole.id} 
                      button 
                      onClick={() => handleToggleSelect(normalizedRole.id)}
                      sx={{ 
                        borderRadius: 1,
                        mb: 0.5,
                        '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' }
                      }}
                    >
                      <ListItemIcon>
                        <Checkbox 
                          edge="start"
                          checked={selectedJobRoles.includes(normalizedRole.id)} 
                          color="primary"
                        />
                      </ListItemIcon>
                      <ListItemText 
                        primary={normalizedRole.title} 
                        secondary={normalizedRole.description}
                      />
                    </ListItem>
                  );
                })}
              </List>
            )}
          </CardContent>
          <Divider />
          <Box p={2} display="flex" justifyContent="flex-end">

            

            <MDButton 

              variant="contained"
              color="primary"
              startIcon={<ArrowForwardIcon />}
              onClick={handleAssign}
              disabled={selectedJobRoles.length === 0}
            >
              Assign Selected
            </MDButton>

          </Box>
        </Card>
        
        {/* Assigned Job Roles */}
        <Card elevation={2} sx={{ flex: 1 }}>
          <CardHeader 
            title="Assigned Job Roles" 
            subheader={
              selectedUser 
                ? `Job roles assigned to ${getUserName()}`
                : "Select a user first"
            }
          />
          <Divider />
          <CardContent sx={{ maxHeight: 400, overflow: 'auto' }}>
            {!selectedUser ? (
              <Alert severity="info">
                Select a user to see assigned job roles
              </Alert>
            ) : assignedJobRoleIsLoading ? (
              <Box display="flex" justifyContent="center" p={2}>
                <CircularProgress size={24} />
                <Typography ml={2}>Loading assigned job roles...</Typography>
              </Box>
            ) : assignedJobRoles.length === 0 ? (
              <Alert severity="info">
                No job roles assigned to this user
              </Alert>
            ) : (
              <List dense>
                {getAssignedJobRoleObjects().map((role) => {
                  const normalizedRole = normalizeJobRole(role);
                  return (
                    <ListItem 
                      key={normalizedRole.id}
                      sx={{ 
                        borderRadius: 1,
                        mb: 0.5,
                        backgroundColor: 'rgba(0, 0, 0, 0.02)',
                        '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' }
                      }}
                    >
                      <ListItemText 
                        primary={normalizedRole.title}
                        sx={{
                          padding:'10px'
                        }}
                        secondary={normalizedRole.description}
                      />

                      {/* <IconButton */}

                      <IconButton

                        edge="end"
                        aria-label="remove"
                        onClick={() => handleUnassign(normalizedRole.id)}
                        color="error"
                        size="small"
                      >
                        <DeleteIcon />

                      </IconButton>

                    </ListItem>
                  );
                })}
              </List>
            )}
          </CardContent>
        </Card>
      </Box>
      
      {/* Submit Button */}
      <Box display="flex" justifyContent="center" mt={4}>


        <MDButton
          variant="gradient"
          color="submit"

          size="large"
          startIcon={<SaveIcon />}
          onClick={handleSubmit}
          disabled={!selectedUser  || isSubmitting}
          sx={{ px: 4, py: 1 }}
        >
          {isSubmitting ? "Saving..." : "Save Mappings"}

        </MDButton>

      </Box>
      
      {/* Summary */}
      {/* {selectedUser && (
        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="body2">
            {assignedJobRoles.length > 0 ? (
              <>Ready to assign {assignedJobRoles.length} job role{assignedJobRoles.length !== 1 ? 's' : ''} to {getUserName()}</>
            ) : (
              <>No job roles currently assigned to {getUserName()}</>
            )}
          </Typography>   
        </Alert>
      )} */}
    </Paper>
  );
};

export default TrainingMapping;
