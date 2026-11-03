import React, { useState, useEffect } from 'react';
import { 
  Paper, Typography, Divider, Card, CardHeader, CardContent, 
  FormControl, InputLabel, Select, MenuItem, Box, 
  List, ListItem, ListItemIcon, ListItemText, 
  Checkbox, Button, Alert, CircularProgress, 
  IconButton, Chip, Tooltip 
} from '@mui/material';
import {
  ArrowForward as ArrowForwardIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Info as InfoIcon,
} from "@mui/icons-material";
import { toast } from "react-toastify";

// Assuming these hooks are imported from your API slice
import { useFetchTrainingWithQuizQuery } from "apilms/trainingApi";
import { useGetJobRoleQuery } from "apilms/jobRoleApi";
import { 
  useTrainingAssignJobroleMutationMutation, 
  useTrainingAssignJobroleQuery 
} from "apilms/MappingApi";
import MDButton from 'components/MDButton';

const JobRoleMapping = () => {
  const [selectedJobRole, setSelectedJobRole] = useState("");
  const [selectedTrainings, setSelectedTrainings] = useState([]);
  const [assignedTrainings, setAssignedTrainings] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch queries
  const { 
    data: trainingData, 
    isLoading: trainingLoading, 
    refetch: refetchTrainings 
  } = useFetchTrainingWithQuizQuery();

  const { 
    data: jobRoleData, 
    isLoading: jobRoleLoading, 
    refetch: refetchJobRoles 
  } = useGetJobRoleQuery();

  const { 
    data: assignedTrainingData, 
    isLoading: assignedTrainingIsLoading,
    refetch: refetchAssignedTrainings 
  } = useTrainingAssignJobroleQuery(selectedJobRole, { 
    skip: !selectedJobRole 
  });

  const [assignTrainings] = useTrainingAssignJobroleMutationMutation();

  // Initial data fetching
  useEffect(() => {
    refetchTrainings();
    refetchJobRoles();
  }, []);

  // Refetch assigned trainings when job role changes
  useEffect(() => {
    if (selectedJobRole) {
      refetchAssignedTrainings();
    }
  }, [selectedJobRole]);

  // Update assigned trainings based on API data
  useEffect(() => {
    if (selectedJobRole && assignedTrainingData?.documents) {
      const existingAssignments = assignedTrainingData.documents.map(doc => doc.id);
      setAssignedTrainings(existingAssignments);
    } else if (selectedJobRole && !assignedTrainingIsLoading) {
      setAssignedTrainings([]);
    }
  }, [selectedJobRole, assignedTrainingData, assignedTrainingIsLoading]);

  // Reset selections when training data changes
  useEffect(() => {
    if (trainingData) {
      setSelectedTrainings([]);
    }
  }, [trainingData]);

  // Event Handlers
  const handleJobRoleChange = (e) => {
    const newJobRole = e.target.value;
    setSelectedJobRole(newJobRole);
    setSelectedTrainings([]);
  };

  const handleAssign = () => {
    setAssignedTrainings(prev => [...new Set([...prev, ...selectedTrainings])]);
    setSelectedTrainings([]);
  };

  const handleUnassign = (trainingId) => {
    setAssignedTrainings(prev => prev.filter(id => id !== trainingId));
  };

  const handleToggleSelect = (trainingId) => {
    setSelectedTrainings(prev => 
      prev.includes(trainingId)
        ? prev.filter(id => id !== trainingId)
        : [...prev, trainingId]
    );
  };

  const handleSelectAll = () => {
    const availableIds = getAvailableTrainings().map(training => training.id);
    
    setSelectedTrainings(
      availableIds.length === selectedTrainings.length 
        ? [] 
        : availableIds
    );
  };

  const handleSubmit = async () => {
    if (!selectedJobRole) {
      toast.warning("Please select a job role first");
      return;
    }
    if(assignedTrainings.length<1){
      toast.warning("Please select atleast one training to assign.");
      return
    }
    setIsSubmitting(true);
    try {
      await assignTrainings({ 
        job_role_id: selectedJobRole, 
        document_ids: assignedTrainings 
      });
      toast.success("Training assigned successfully!");
      refetchTrainings();
      refetchAssignedTrainings();
    } catch (err) {
      toast.error("Error assigning training");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Utility Functions
  const getJobRoleName = () => {
    if (!selectedJobRole || !jobRoleData?.data) return "";
    const jobRole = jobRoleData.data.find(job => job.id === selectedJobRole);
    return jobRole?.job_role_name || "";
  };

  const getAvailableTrainings = () => {
    if (!trainingData?.document_data?.documents) return [];
    
    return trainingData.document_data.documents.filter(training => 
      !assignedTrainings.includes(training.id)
    );
  };

  const getAssignedTrainingObjects = () => {
    if (!trainingData?.document_data?.documents) return [];
    
    return assignedTrainings.map(id => 
      trainingData.document_data.documents.find(t => t.id === id)
    ).filter(Boolean);
  };

  const normalizeTraining = (training) => ({
    id: training.id,
    title: training.document_title,
    type: training.document_type || 'SOP',
    status: training.document_current_status_name || null,
    version: training.version
  });

  return (
    <Paper elevation={3} sx={{ maxWidth: 900, mx: "auto", my: 4, p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center" color="primary">
        Job Role Training Mapping
      </Typography>
      <Divider sx={{ mb: 4 }} />
      
      {/* Job Role Selection */}
      <Card elevation={2} sx={{ mb: 4 }}>
        <CardHeader 
          title="Select Job Role" 
          subheader="Choose a job role to assign training to"
          avatar={
            <Tooltip title="First select a job role before assigning trainings">
              <InfoIcon color="info" />
            </Tooltip>
          }
        />
        <CardContent>
          <FormControl fullWidth variant="outlined">
            <InputLabel
             id="job-role-label">Job Role</InputLabel>
            <Select
              labelId="job-role-label"
              value={selectedJobRole}
              onChange={handleJobRoleChange}
              label="Job Role"
              disabled={jobRoleLoading}
              sx={
                {
                  p:2
                }
              }
            >
              {jobRoleData?.data?.map((job) => (
                <MenuItem key={job.id} value={job.id}>
                  {job.job_role_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          {selectedJobRole && (
            <Chip 
              label={`Selected: ${getJobRoleName()}`} 
              color="primary" 
              sx={{ mt: 2 }}
            />
          )}
        </CardContent>
      </Card>
      
      {/* Training Assignment Section */}
      <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={3}>
        {/* Available Training */}
        <Card elevation={2} sx={{ flex: 1 }}>
          <CardHeader 
            title="Available Training" 
            subheader="Select trainings to assign"
            action={
              <Button 
                size="small" 
                onClick={handleSelectAll}
                disabled={trainingLoading || getAvailableTrainings().length === 0}
              >
                {selectedTrainings.length === getAvailableTrainings().length 
                  ? 'Deselect All' 
                  : 'Select All'}
              </Button>
            }
          />
          <Divider />
          <CardContent sx={{ maxHeight: 400, overflow: 'auto' }}>
            {trainingLoading ? (
              <Box display="flex" justifyContent="center" p={2}>
                <CircularProgress size={24} />
                <Typography ml={2}>Loading trainings...</Typography>
              </Box>
            ) : getAvailableTrainings().length === 0 ? (
              <Alert severity="info">
                No available trainings to assign
              </Alert>
            ) : (
              <List dense>
                {getAvailableTrainings().map((training) => {
                  const normalizedTraining = normalizeTraining(training);
                  return (
                    <ListItem 
                      key={normalizedTraining.id} 
                      button 
                      onClick={() => handleToggleSelect(normalizedTraining.id)}
                      sx={{ 
                        borderRadius: 1,
                        mb: 0.5,
                        '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' }
                      }}
                    >
                      <ListItemIcon>
                        <Checkbox 
                          edge="start"
                          checked={selectedTrainings.includes(normalizedTraining.id)} 
                          color="primary"
                        />
                      </ListItemIcon>
                      <ListItemText 
                        primary={`${normalizedTraining.title} (v${normalizedTraining.version})`} 
                        secondary={normalizedTraining.type}
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
              disabled={selectedTrainings.length === 0}
            >
              Assign Selected
            </MDButton>
          </Box>
        </Card>
        
        {/* Assigned Training */}
        <Card elevation={2} sx={{ flex: 1 }}>
          <CardHeader 
            title="Assigned Training" 
            subheader={
              selectedJobRole 
                ? `Trainings assigned to ${getJobRoleName()}`
                : "Select a job role first"
            }
          />
          <Divider />
          <CardContent sx={{ maxHeight: 400, overflow: 'auto' }}>
            {!selectedJobRole ? (
              <Alert severity="info">
                Select a job role to see assigned trainings
              </Alert>
            ) : assignedTrainingIsLoading ? (
              <Box display="flex" justifyContent="center" p={2}>
                <CircularProgress size={24} />
                <Typography ml={2}>Loading assigned trainings...</Typography>
              </Box>
            ) : assignedTrainings.length === 0 ? (
              <Alert severity="info">
                No trainings assigned to this job role
              </Alert>
            ) : (
              <List dense>
                {getAssignedTrainingObjects().map((training) => {
                  const normalizedTraining = normalizeTraining(training);
                  return (
                    <ListItem 
                      key={normalizedTraining.id}
                      sx={{ 
                        borderRadius: 1,
                        mb: 0.5,
                        backgroundColor: 'rgba(0, 0, 0, 0.02)',
                        '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' }
                      }}
                    >
                      <ListItemText 
                        primary={`${normalizedTraining.title} (v${normalizedTraining.version})`}
                        secondary={normalizedTraining.type}
                      />
                      <Chip 
                        size="small" 
                        label={normalizedTraining.status || 'No Status'} 
                        color="info" 
                        variant="outlined"
                        sx={{ mr: 1 }}
                      />
                      <IconButton
                        edge="end"
                        aria-label="remove"
                        onClick={() => handleUnassign(normalizedTraining.id)}
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
          variant="contained"
          color="primary"
          size="large"
          startIcon={<SaveIcon />}
          onClick={handleSubmit}
          disabled={!selectedJobRole || isSubmitting}
          sx={{ px: 4, py: 1 }}
        >
          {isSubmitting ? "Saving..." : "Save Mappings"}
        </MDButton>
      </Box>
    </Paper>
  );
};

export default JobRoleMapping;