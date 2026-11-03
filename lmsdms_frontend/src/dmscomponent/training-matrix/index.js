// TrainingMatrix.js
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

function TrainingMatrix() {
  const [readMaterialDuration, setReadMaterialDuration] = useState("");
  const [selectedSOP, setSelectedSOP] = useState("");
  const [evaluationStatus, setEvaluationStatus] = useState("");
  const [isPassed, setIsPassed] = useState(false);
  const [result, setResult] = useState(null); // result can be an object { score, passPercentage }
  const [showAnswers, setShowAnswers] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [maxAttempts] = useState(3); // Assuming 3 attempts before mandatory classroom training

  const handleExamStart = () => {
    // Logic to start the exam and randomly select questions
    const randomScore = Math.random() * 100; // Random score for demonstration
    const passPercentage = 50; // Set your pass percentage
    setResult({ score: randomScore, passPercentage });
    setEvaluationStatus("Completed");
    setAttempts(attempts + 1);

    // Determine if the user passed
    if (randomScore >= passPercentage) {
      setIsPassed(true);
      setShowAnswers(true);
    } else {
      setIsPassed(false);
      if (attempts + 1 >= maxAttempts) {
        alert("You have failed all attempts. You must attend classroom training before retaking the exam.");
      }
    }
  };

  const handleViewAnswers = () => {
    if (isPassed) {
      // Show correct answers logic
      alert("Showing correct answers...");
    } else {
      alert("You need to pass the exam to view correct answers.");
    }
  };

  return (
    <BasicLayout image={bgImage} showNavbarFooter={false}>
      <Card sx={{ width: 600, mx: "auto", padding: 3 }}>
        <Typography variant="h4" align="center" gutterBottom>
          Training Matrix
        </Typography>
        
        <Box mb={2}>
          <TextField
            label="Read Material Duration (Minutes)"
            fullWidth
            type="number"
            value={readMaterialDuration}
            onChange={(e) => setReadMaterialDuration(e.target.value)}
            required
          />
        </Box>

        <Box mb={2}>
          <TextField
            select
            label="Select SOP"
            fullWidth
            value={selectedSOP}
            onChange={(e) => setSelectedSOP(e.target.value)}
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

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="h6">Evaluation Status: {evaluationStatus}</Typography>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h6">Your Score: {result ? result.score.toFixed(2) : "N/A"}</Typography>
            <Typography variant="h6">
              Pass Percentage: {result ? result.passPercentage : "N/A"}
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <MDButton
              variant="gradient" color="submit"
              fullWidth
              onClick={handleExamStart}
              disabled={evaluationStatus === "Completed"}
            >
              Start Exam
            </MDButton>
          </Grid>

          <Grid item xs={12}>
            <Button
              variant="outlined"
              color="secondary"
              fullWidth
              onClick={handleViewAnswers}
              disabled={!showAnswers}
            >
              View Correct Answers
            </Button>
          </Grid>
        </Grid>
      </Card>
    </BasicLayout>
  );
}

export default TrainingMatrix;
