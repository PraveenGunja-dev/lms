import React, { useState, useEffect } from "react";
import {
  Card,
  Checkbox,
  IconButton,
  List,
  ListItem,
  FormControlLabel,
  Divider,
  Paper,
  Box,
  Typography,
  Chip
} from "@mui/material";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDInput from "components/MDInput";
import MDButton from "components/MDButton";
import BasicLayout from "layouts/authentication/components/BasicLayout";
import bgImage from "assets/images/bg-sign-in-basic.jpeg";
import DeleteIcon from "@mui/icons-material/Delete";
import { useClassroomQuestionsGetQuery, useClassroomQuizPostMutation } from "apilms/classtestApi";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function CreateClassQuiz() {
  const location = useLocation();
  const classroom_id = (location?.state?.classroom_id || "").toString();
  const navigate = useNavigate();
  
  // Form states
  const [quizName, setQuizName] = useState("");
  const [passCriteria, setPassCriteria] = useState("");
  const [quizTime, setQuizTime] = useState("");
  const [totalMarks, setTotalMarks] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  
  // Question states
  const [availableQuestions, setAvailableQuestions] = useState([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState([]);
  
  // Form validation errors
  const [errors, setErrors] = useState({
    quizName: "",
    quizTime: "",
    questions: ""
  });

  // API hooks
  const { data, isLoading, isError } = useClassroomQuestionsGetQuery(classroom_id);
  const [createClassQuiz, { isLoading: isQuizLoading }] = useClassroomQuizPostMutation();

  // Set available questions from API response
  useEffect(() => {
    if (data && data.status) {
      setAvailableQuestions(data.data);
    }
  }, [data]);

  // Calculate total marks, questions, and passing criteria whenever selected questions change
  useEffect(() => {
    const selectedQuestions = availableQuestions.filter(q => selectedQuestionIds.includes(q.id));
    const calculatedTotalMarks = selectedQuestions.reduce((sum, question) => sum + question.marks, 0);
    setTotalMarks(calculatedTotalMarks);
    setTotalQuestions(selectedQuestions.length);
    
    // Clear questions error if questions are selected
    if (selectedQuestionIds.length > 0) {
      setErrors(prev => ({ ...prev, questions: "" }));
    }
    
    // Auto-calculate pass criteria (80% of total marks, rounded to nearest whole number)
    if (calculatedTotalMarks > 0) {
      const calculatedPassCriteria = Math.round(calculatedTotalMarks * 0.8);
      setPassCriteria(calculatedPassCriteria.toString());
    } else {
      setPassCriteria("");
    }
  }, [selectedQuestionIds, availableQuestions]);

  // Handle question selection
  const handleQuestionSelection = (questionId) => {
    if (selectedQuestionIds.includes(questionId)) {
      setSelectedQuestionIds(selectedQuestionIds.filter(id => id !== questionId));
    } else {
      setSelectedQuestionIds([...selectedQuestionIds, questionId]);
    }
  };

  // Validate quiz name
  const validateQuizName = (value) => {
    let error = "";
    if (!value.trim()) {
      error = "Quiz name is required";
    }
    setErrors(prev => ({ ...prev, quizName: error }));
    return !error;
  };

  // Validate quiz time
  const validateQuizTime = (value) => {
    let error = "";
    if (!value) {
      error = "Quiz time is required";
    } else if (isNaN(value) || parseInt(value) <= 0) {
      error = "Quiz time must be a positive number";
    }
    setErrors(prev => ({ ...prev, quizTime: error }));
    return !error;
  };

  // Validate questions
  const validateQuestions = () => {
    let error = "";
    if (selectedQuestionIds.length === 0) {
      error = "Please select at least one question";
    }
    setErrors(prev => ({ ...prev, questions: error }));
    return !error;
  };

  // Handle input changes with validation
  const handleInputChange = (setter, validator) => (e) => {
    const value = e.target.value;
    setter(value);
    if (validator) validator(value);
  };

  // Check if form is valid for submission
  const isFormValid = () => {
    const nameValid = validateQuizName(quizName);
    const timeValid = validateQuizTime(quizTime);
    const questionsValid = validateQuestions();
    
    return nameValid && timeValid && questionsValid && totalMarks > 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isFormValid()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    const quizData = {
      classroom_id,
      name: quizName,
      pass_criteria: parseInt(passCriteria),
      quiz_time: parseInt(quizTime),
      total_marks: totalMarks,
      total_questions: totalQuestions,
      selected_questions: selectedQuestionIds,
    };

    try {
      await createClassQuiz(quizData).unwrap();
      toast.success("Quiz created successfully!");
      navigate("/class-room");
    } catch (err) {
      toast.error("Failed to create quiz. Please try again.");
    }
  };

  // Get selected questions
  const getSelectedQuestions = () => {
    return availableQuestions.filter(q => selectedQuestionIds.includes(q.id));
  };

  if (isLoading) return <div>Loading available questions...</div>;
  if (isError) return <div>Error fetching available questions.</div>;

  return (
    <BasicLayout image={bgImage} showNavbarFooter={false}>
      <Card sx={{ width: 800, mx: "auto" }}>
        <MDBox
          borderRadius="lg"
          sx={{
            background: "linear-gradient(212deg, #d5b282, #f5e0c3)",
            borderRadius: "lg",
            mx: 2,
            mt: -3,
            p: 2,
            mb: 1,
            textAlign: "center",
          }}
        >
          <MDTypography variant="h3" fontWeight="medium" color="#344767" mt={1}>
            Create Class Quiz
          </MDTypography>
        </MDBox>

        <MDBox pb={3} px={3}>
          <MDBox component="form" role="form" onSubmit={handleSubmit} sx={{ padding: 3 }}>
            {/* Quiz Information Section */}
            <MDBox mb={4}>
              <MDTypography variant="h5" fontWeight="medium" mb={2}>
                Quiz Information
              </MDTypography>
              
              <MDBox mb={3}>
                <MDInput
                  type="text"
                  label="Quiz Name"
                  fullWidth
                  value={quizName}
                  onChange={handleInputChange(setQuizName, validateQuizName)}
                  onBlur={() => validateQuizName(quizName)}
                  error={!!errors.quizName}
                  helperText={errors.quizName}
                />
              </MDBox>
              
              <MDBox mb={3}>
                <MDInput
                  type="number"
                  label="Quiz Time (in minutes)"
                  fullWidth
                  value={quizTime}
                  onChange={handleInputChange(setQuizTime, validateQuizTime)}
                  onBlur={() => validateQuizTime(quizTime)}
                  error={!!errors.quizTime}
                  helperText={errors.quizTime}
                  inputProps={{ min: 1 }}
                />
              </MDBox>
              
              <MDBox mb={3}>
                <MDInput
                  type="text"
                  label="Passing Marks (80% of total)"
                  fullWidth
                  value={passCriteria}
                  InputProps={{
                    readOnly: true,
                  }}
                  helperText="Automatically calculated as 80% of total marks (rounded to whole number)"
                />
              </MDBox>
              
              <MDBox display="flex" justifyContent="space-between" mb={1} sx={{ backgroundColor: "#f0f8ff", p: 2, borderRadius: 1 }}>
                <MDTypography variant="h6">Total Questions: {totalQuestions}</MDTypography>
                <MDTypography variant="h6">Total Marks: {totalMarks}</MDTypography>
              </MDBox>
            </MDBox>
            
            <Divider sx={{ my: 3 }} />
            
            {/* Question Selection Section */}
            <MDBox mb={3}>
              <MDTypography variant="h5" fontWeight="medium" mb={2}>
                Select Questions
              </MDTypography>
              
              {errors.questions && (
                <MDTypography variant="body2" color="error" mb={2}>
                  {errors.questions}
                </MDTypography>
              )}
              
              <Paper 
                elevation={3} 
                sx={{ 
                  p: 2, 
                  mb: 3, 
                  maxHeight: "300px", 
                  overflow: "auto",
                  backgroundColor: "#f8f9fa"
                }}
              >
                <MDTypography variant="subtitle1" fontWeight="medium" mb={1}>
                  Available Questions
                </MDTypography>
                
                <List disablePadding>
                  {availableQuestions.map((question) => (
                    <ListItem 
                      key={`available-${question.id}`}
                      disablePadding
                      sx={{ 
                        mb: 1, 
                        p: 1, 
                        borderRadius: 1,
                        backgroundColor: "white",
                        border: "1px solid #e0e0e0"
                      }}
                    >
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={selectedQuestionIds.includes(question.id)}
                            onChange={() => handleQuestionSelection(question.id)}
                            color="primary"
                          />
                        }
                        label={
                          <Box>
                            <Typography variant="body1">{question.question_text}</Typography>
                            <Box display="flex" mt={0.5} gap={1}>
                              <Chip 
                                label={`Type: ${question.question_type}`}
                                size="small"
                                variant="outlined"
                              />
                              <Chip 
                                label={`Marks: ${question.marks}`}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            </Box>
                            {question.selected_file && (
                              <Box mt={1}>
                                <Chip 
                                  label={`Has ${question.selected_file_type}`}
                                  size="small"
                                  color="secondary"
                                  variant="outlined"
                                />
                              </Box>
                            )}
                          </Box>
                        }
                        sx={{ width: "100%" }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
              
              {/* Selected Questions */}
              {selectedQuestionIds.length > 0 && (
                <Paper 
                  elevation={3} 
                  sx={{ 
                    p: 2, 
                    backgroundColor: "#edf7ed" 
                  }}
                >
                  <MDTypography variant="subtitle1" fontWeight="medium" mb={1}>
                    Selected Questions ({selectedQuestionIds.length})
                  </MDTypography>
                  
                  <List disablePadding>
                    {getSelectedQuestions().map((question) => (
                      <ListItem 
                        key={`selected-${question.id}`}
                        sx={{ 
                          mb: 1, 
                          p: 1, 
                          backgroundColor: "white",
                          border: "1px solid #c8e6c9",
                          borderRadius: 1,
                          display: "flex",
                          justifyContent: "space-between"
                        }}
                      >
                        <Box>
                          <Typography variant="body1">{question.question_text}</Typography>
                          <Typography variant="body2" color="textSecondary">
                            {question.marks} {question.marks === 1 ? "mark" : "marks"}
                          </Typography>
                        </Box>
                        <IconButton
                          edge="end"
                          aria-label="remove"
                          onClick={() => handleQuestionSelection(question.id)}
                          color="error"
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              )}
            </MDBox>

            <MDBox mt={4} mb={1}>
              <MDButton
                variant="gradient"
                color="info"
                fullWidth
                type="submit"
                disabled={isQuizLoading}
                onClick={handleSubmit}
              >
                {isQuizLoading ? "Creating Quiz..." : "Create Quiz"}
              </MDButton>
            </MDBox>
          </MDBox>
        </MDBox>
      </Card>
    </BasicLayout>
  );
}

export default CreateClassQuiz;