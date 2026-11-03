import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Card from "@mui/material/Card";
import IconButton from "@mui/material/IconButton";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import { CountdownCircleTimer } from "react-countdown-circle-timer";

const ExamModule = () => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // Track user answers
  const [timeLeft, setTimeLeft] = useState(600); // Example: 10-minute exam

  const navigate = useNavigate();

  const questions = [
    {
      id: 1,
      question: "What is the capital of France?",
      options: ["Paris", "Berlin", "Madrid", "Rome"],
    },
    {
      id: 2,
      question: "Which planet is known as the Red Planet?",
      options: ["Mars", "Venus", "Jupiter", "Saturn"],
    },
    {
      id: 3,
      question: "Who wrote 'Hamlet'?",
      options: ["Shakespeare", "Hemingway", "Fitzgerald", "Orwell"],
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          alert("Time's up!");
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleAnswerChange = (questionId, answer) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleNext = () => {
    setCurrentQuestionIndex((prev) => Math.min(prev + 1, questions.length - 1));
  };

  const handlePrevious = () => {
    setCurrentQuestionIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = () => {
    const attempted = Object.keys(answers).length;
    const remaining = questions.length - attempted;
    alert(`Exam Submitted! Attempted: ${attempted}, Remaining: ${remaining}`);
    navigate("/results", { state: { answers, attempted, remaining } });
  };

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <MDBox p={3}>
    <Card sx={{ maxWidth: "80%", mx: "auto", mt: 3, marginLeft: "auto", marginRight: 0}}>
        <MDBox p={3}>
          <MDTypography variant="h4" fontWeight="medium" textAlign="center">
            Exam Module
          </MDTypography>
          <MDBox display="flex" justifyContent="space-between" alignItems="center" mt={2}>
            <MDTypography>Time Left: {Math.floor(timeLeft / 60)}:{timeLeft % 60}</MDTypography>
            <CountdownCircleTimer
              isPlaying
              duration={600}
              colors={[["#004777", 0.33], ["#F7B801", 0.33], ["#A30000", 0.33]]}
              size={50}
              strokeWidth={6}
            />
          </MDBox>
          <MDBox mt={3}>
            <MDTypography variant="h6" fontWeight="medium">
              Question {currentQuestionIndex + 1} of {questions.length}
            </MDTypography>
            <MDTypography variant="body1" mt={1}>
              {currentQuestion.question}
            </MDTypography>
            <RadioGroup
              value={answers[currentQuestion.id] || ""}
              onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
            >
              {currentQuestion.options.map((option, index) => (
                <FormControlLabel
                  key={index}
                  value={option}
                  control={<Radio />}
                  label={option}
                />
              ))}
            </RadioGroup>
          </MDBox>
          <MDBox mt={3} display="flex" justifyContent="space-between">
            <MDButton
              variant="contained"
              color="primary"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
            >
              Previous
            </MDButton>
            {currentQuestionIndex < questions.length - 1 ? (
              <MDButton
                variant="contained"
                color="primary"
                onClick={handleNext}
              >
                Next
              </MDButton>
            ) : (
              <MDButton
                variant="contained"
                color="success"
                onClick={handleSubmit}
              >
                Submit
              </MDButton>
            )}
          </MDBox>
        </MDBox>
      </Card>
    </MDBox>
  );
};

export default ExamModule;
