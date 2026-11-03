// TrainingProgressReport.js
import React, { useState } from "react";
import {
  Card,
  MenuItem,
  TextField,
  Button,
  Typography,
  Grid,
  Box,
} from "@mui/material";
import BasicLayout from "layouts/authentication/components/BasicLayout";
import bgImage from "assets/images/bg-sign-in-basic.jpeg";
import MDButton from "components/MDButton";

const TrainingProgressReport = () => {
  const [employee, setEmployee] = useState("");
  const [sop, setSop] = useState("");
  const [completionStatus, setCompletionStatus] = useState("");
  const [score, setScore] = useState("");
  const [dateGenerated, setDateGenerated] = useState(null);

  const handleGenerateReport = () => {
    const currentDate = new Date().toLocaleDateString();
    setDateGenerated(currentDate);
    // Logic to generate and fetch report data can be added here
    alert("Report generated successfully!");
  };

  return (
    <BasicLayout image={bgImage} showNavbarFooter={false}>
      <Card sx={{ width: 600, mx: "auto", padding: 3 }}>
        <Typography variant="h4" align="center" gutterBottom>
          Training Progress Report
        </Typography>

        <Box mb={2}>
          <TextField
            select
            label="Employee"
            fullWidth
            value={employee}
            onChange={(e) => setEmployee(e.target.value)}
            required
            sx={{
              height: "40px", // Set desired height here
              "& .MuiInputBase-root": {
                minHeight: "2.4265em",
                height: "100%", // Ensures the inner select aligns with the specified height
              },
            }}
          >
            <MenuItem value="Employee 1">Employee 1</MenuItem>
            <MenuItem value="Employee 2">Employee 2</MenuItem>
            <MenuItem value="Employee 3">Employee 3</MenuItem>
          </TextField>
        </Box>

        <Box mb={2}>
          <TextField
            select
            label="SOP"
            fullWidth
            value={sop}
            onChange={(e) => setSop(e.target.value)}
            required
            sx={{
              height: "40px", // Set desired height here
              "& .MuiInputBase-root": {
                minHeight: "2.4265em",
                height: "100%", // Ensures the inner select aligns with the specified height
              },
            }}
          >
            <MenuItem value="SOP 1">SOP 1</MenuItem>
            <MenuItem value="SOP 2">SOP 2</MenuItem>
          </TextField>
        </Box>

        <Box mb={2}>
          <TextField
            select
            label="Completion Status"
            fullWidth
            value={completionStatus}
            onChange={(e) => setCompletionStatus(e.target.value)}
            required
            sx={{
              height: "40px", // Set desired height here
              "& .MuiInputBase-root": {
                minHeight: "2.4265em",
                height: "100%", // Ensures the inner select aligns with the specified height
              },
            }}
          >
            <MenuItem value="Completed">Completed</MenuItem>
            <MenuItem value="Not Completed">Not Completed</MenuItem>
          </TextField>
        </Box>

        <Box mb={2}>
          <TextField
            label="Score"
            fullWidth
            type="number"
            value={score}
            onChange={(e) => setScore(e.target.value)}
            required
          />
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <MDButton
              variant="gradient" color="submit"
              fullWidth
              onClick={handleGenerateReport}
            >
              Generate Report
            </MDButton>
          </Grid>

          {dateGenerated && (
            <Grid item xs={12}>
              <Typography variant="h6" align="center">
                Date Generated: {dateGenerated}
              </Typography>
            </Grid>
          )}
        </Grid>
      </Card>
    </BasicLayout>
  );
};

export default TrainingProgressReport;
