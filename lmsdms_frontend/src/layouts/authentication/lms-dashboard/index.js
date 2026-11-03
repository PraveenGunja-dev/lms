import React from "react";
import { Grid, Card, CardContent, Typography, LinearProgress, Box, Stack } from "@mui/material";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import MDBox from "components/MDBox";
import { CheckCircle as CheckCircleIcon, Assignment as AssignmentIcon } from "@mui/icons-material";
import PropTypes from "prop-types";
import { useAuth } from "hooks/use-auth";
import { useGetDashboardDocumentQuery } from "api/auth/dashboardApi";

const StatCard = ({ title, value, icon, color }) => {
  return (
    <Card sx={{ height: "100%", position: "relative" }}>
      <CardContent>
        <Stack spacing={2}>
          <Box display="flex" alignItems="center" gap={1}>
            {icon}
            <Typography variant="h6" color="text.secondary">
              {title}
            </Typography>
          </Box>
          <Typography variant="h3" component="div">
            {value}
          </Typography>
          <Box>
            <LinearProgress
              variant="determinate"
              value={100}
              color={color}
              sx={{ height: 10, borderRadius: 5 }}
            />
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

const ProgressChart = ({ completed, assigned }) => {
  const percentage = assigned ? ((completed / assigned) * 100).toFixed(0) : 0;
  const remaining = assigned - completed;

  return (
    <Card>
      <CardContent>
        <Typography variant="h4" gutterBottom>
          SOP Completion Progress
        </Typography>
        <Box sx={{ position: "relative", pt: 2 }}>
          <Box sx={{ position: "relative", display: "inline-flex", justifyContent: "center" }}>
            <Box
              sx={{
                position: "relative",
                display: "inline-flex",
                borderRadius: "50%",
                background: `conic-gradient(#2e7d32 ${percentage}%, #e0e0e0 ${percentage}% 100%)`,
                width: 300,
                height: 300,
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: "10%",
                  left: "10%",
                  right: "10%",
                  bottom: "10%",
                  borderRadius: "50%",
                  background: "white",
                },
              }}
            />
            <Box
              sx={{
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
                position: "absolute",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography variant="h2" component="div" color="text.primary">
                {percentage}%
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                {completed} of {assigned} SOPs
              </Typography>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

function LMSDashboard() {
  const { user } = useAuth();
  const { data, isLoading } = useGetDashboardDocumentQuery(user.id);
 
  if (isLoading) return <Typography>Loading...</Typography>;

  const assignedSOPs = data?.totalAssignDocument || 0;
  const completedSOPs = data?.passedDocument || 0;
  const failedSOPs = data?.failedDocument || 0;
  const remainingSOPs = assignedSOPs - completedSOPs - failedSOPs;
  const completionPercentage = assignedSOPs ? ((completedSOPs / assignedSOPs) * 100).toFixed(0) : 0;

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={7}>
            <ProgressChart completed={completedSOPs} assigned={assignedSOPs} />
          </Grid>
          <Grid item xs={12} md={5}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={12}>
                <StatCard
                  title="Completed SOPs"
                  value={completedSOPs}
                  icon={<CheckCircleIcon sx={{ color: "success.main" }} />}
                  color="success"
                />
              </Grid>
              <Grid item xs={12} md={12}>
                <StatCard
                  title="Assigned SOPs"
                  value={assignedSOPs}
                  icon={<AssignmentIcon sx={{ color: "warning.main" }} />}
                  color="warning"
                />
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </MDBox>
    </DashboardLayout>
  );
}

StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  icon: PropTypes.node.isRequired,
  color: PropTypes.string.isRequired,
};

ProgressChart.propTypes = {
  completed: PropTypes.number.isRequired,
  assigned: PropTypes.number.isRequired,
};

export default LMSDashboard;
