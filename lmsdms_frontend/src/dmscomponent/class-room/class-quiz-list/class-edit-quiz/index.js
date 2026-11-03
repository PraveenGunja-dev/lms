import React, { useState, useEffect } from "react";
import {
  Card,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  Divider,
  Paper,
  Chip,
  Box,
  FormHelperText,
} from "@mui/material";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDInput from "components/MDInput";
import MDButton from "components/MDButton";
import BasicLayout from "layouts/authentication/components/BasicLayout";
import bgImage from "assets/images/bg-sign-in-basic.jpeg";
import DeleteIcon from "@mui/icons-material/Delete";
import { useClassroomQuestionsGetQuery, useClassroomQuizEditMutation } from "apilms/classtestApi";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function EditClassQuiz() {
  const location = useLocation();
  const navigate = useNavigate();
  const { quiz } = location.state || {}; 
  const { classroom_id } = location.state || {};
  console.log("QUIZZZZZZ", quiz);

  // Form state
  const [quizName, setQuizName] = useState(quiz?.quiz_name || "");
  const [quizTime, setQuizTime] = useState(quiz?.quiz_time?.split(" ")[0] || "");
  const [totalMarks, setTotalMarks] = useState("");
  const [selectedQuestionIds, setSelectedQuestionIds] = useState([]); // Start with empty array
  const [availableQuestions, setAvailableQuestions] = useState([]);
  const [errors, setErrors] = useState({});
  
  // Calculate pass criteria (80% of total marks, no decimals)
  const passCriteria = totalMarks ? Math.floor(parseInt(totalMarks) * 0.8) : "";

  // Fetch available questions
  const { data, isLoading, isError } = useClassroomQuestionsGetQuery(classroom_id);
  const [updateClassQuiz, { isLoading: isUpdating }] = useClassroomQuizEditMutation();

  // Set available questions from API response and match the initial selections
  useEffect(() => {
    if (data && data.status) {
      setAvailableQuestions(data.data);
      
      // Only set initial selections after we have available questions
      // This ensures we can properly match IDs
      if (quiz && quiz.questions && Array.isArray(quiz.questions)) {
        // Clear any previously set selections
        setSelectedQuestionIds([]);
        
        // Match visible checkboxes to initial quiz data
        const visibleQuestions = data.data.filter(availableQ => 
          quiz.questions.some(quizQ => quizQ.id === availableQ.id)
        );
        
        if (visibleQuestions.length > 0) {
          setSelectedQuestionIds(visibleQuestions.map(q => q.id));
        }
      }
    }
  }, [data, quiz]);

  // Update total marks whenever selection changes
  useEffect(() => {
    updateTotalMarks();
  }, [selectedQuestionIds, availableQuestions]);

  // Get full question objects from IDs
  const getSelectedQuestions = () => {
    return availableQuestions.filter(q => selectedQuestionIds.includes(q.id));
  };

  // Calculate total marks from selected questions
  const updateTotalMarks = () => {
    const selectedQuestions = getSelectedQuestions();
    const calculatedMarks = selectedQuestions.reduce(
      (sum, q) => sum + parseInt(q.marks || 0), 0
    );
    setTotalMarks(calculatedMarks.toString());
  };

  // Toggle question selection
  const handleToggleQuestion = (question) => {
    // Check if question is already selected by ID
    const isSelected = selectedQuestionIds.includes(question.id);
    
    if (isSelected) {
      // Remove question ID
      setSelectedQuestionIds(selectedQuestionIds.filter(id => id !== question.id));
    } else {
      // Add question ID
      setSelectedQuestionIds([...selectedQuestionIds, question.id]);
    }
  };

  // Reset all selections
  const handleResetSelections = () => {
    setSelectedQuestionIds([]);
  };

  // Check if form can be submitted
  const isSubmitDisabled = () => {
    // Check if required fields are filled
    if (!quizName || !quizTime || selectedQuestionIds.length === 0) {
      return true;
    }
    
    // Check if there are any validation errors
    if (Object.keys(errors).length > 0) {
      return true;
    }
    
    return false;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSubmitDisabled()) {
      toast.error("Please fix all errors before submitting.");
      return;
    }

    // Prepare quiz data for submission - using ONLY the currently selected IDs
    const quizData = {
      id: quiz.id,
      classroom_id,
      name: quizName,
      pass_criteria: passCriteria,
      quiz_time: quizTime,
      quiz_type: "manual",
      total_marks: totalMarks,
      selected_questions: [...selectedQuestionIds], // Create a new array to avoid reference issues
    };

    console.log("Submitting quiz data:", quizData);

    try {
      const response = await updateClassQuiz(quizData).unwrap();
      if (response && response.status) {
        toast.success("Quiz updated successfully!");
        navigate("/class-room");
      } else {
        toast.error(response?.message || "Failed to update quiz.");
      }
    } catch (err) {
      console.error("API Error:", err);
      toast.error(err?.data?.message || "Failed to update quiz. Please try again.");
    }
  };

  // Get selected questions for display
  const selectedQuestions = getSelectedQuestions();

  // Loading and error states
  if (isLoading) return <div>Loading available questions...</div>;
  if (isError) return <div>Error fetching available questions.</div>;
  if (!quiz) return <div>No quiz data provided.</div>;

  return (
    <BasicLayout image={bgImage} showNavbarFooter={false}>
      <Card sx={{ width: 600, mx: "auto", mb: 3, mt: 7 }}>
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
            Edit Class Quiz
          </MDTypography>
        </MDBox>

        <MDBox pb={3} px={3}>
          <MDBox component="form" role="form" onSubmit={handleSubmit} sx={{ padding: 3 }}>
            {/* Quiz Name */}
            <MDBox mb={3}>
              <MDInput
                type="text"
                label="Quiz Name *"
                fullWidth
                value={quizName}
                onChange={(e) => setQuizName(e.target.value)}
                error={!quizName && quizName !== ""}
              />
            </MDBox>
            
            {/* Quiz Time */}
            <MDBox mb={3}>
              <MDInput
                type="number"
                label="Quiz Time (in minutes) *"
                fullWidth
                value={quizTime}
                onChange={(e) => setQuizTime(e.target.value)}
                error={!quizTime && quizTime !== ""}
              />
            </MDBox>
            
            {/* Question Selection Section */}
            <MDBox mb={3}>
              <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <MDTypography variant="h6" fontWeight="medium">
                  Select Questions
                </MDTypography>
                <MDButton 
                  variant="text" 
                  color="error" 
                  size="small"
                  onClick={handleResetSelections}
                >
                  Clear Selections
                </MDButton>
              </MDBox>
              
              <Paper elevation={1} sx={{ p: 2, maxHeight: 300, overflow: 'auto' }}>
                <List>
                  {availableQuestions.map((question) => {
                    // Check if question is already selected by ID
                    const isSelected = selectedQuestionIds.includes(question.id);
                    
                    return (
                      <React.Fragment key={question.id}>
                        <ListItem
                          secondaryAction={
                            <Checkbox
                              edge="end"
                              checked={isSelected}
                              onChange={() => handleToggleQuestion(question)}
                            />
                          }
                        >
                          <ListItemText
                            primary={
                              <Box display="flex" alignItems="center">
                                <span>{question.question_text}</span>
                                <Box component="span" ml={1} fontWeight="bold" color="text.secondary">
                                  {/* (ID: {question.id}) */}
                                </Box>
                              </Box>
                            }
                            secondary={
                              <Chip 
                                label={`${question.marks} ${question.marks === 1 ? 'mark' : 'marks'}`}
                                size="small"
                                color="primary"
                                sx={{ ml: 1 }}
                              />
                            }
                          />
                        </ListItem>
                        <Divider />
                      </React.Fragment>
                    );
                  })}
                </List>
              </Paper>
              
              {/* Selected Questions Summary */}
              <Box mt={2}>
                <MDTypography variant="body2">
                  Selected: {selectedQuestionIds.length} questions, 
                  Total: {totalMarks} marks
                </MDTypography>
              </Box>
            </MDBox>
            
            {/* Debug Information - Only during development */}
            {/* <Paper elevation={1} sx={{ p: 2, mb: 3, bgcolor: '#f5f5f5' }}>
              <MDTypography variant="subtitle2" color="info">
                Selected Question IDs:
              </MDTypography>
              <MDTypography variant="caption" component="pre" sx={{ overflowX: 'auto' }}>
                {JSON.stringify(selectedQuestionIds, null, 2)}
              </MDTypography>
            </Paper> */}
            
            {/* Quiz Totals */}
            <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
              <MDBox mb={2}>
                <MDInput
                  type="number"
                  label="Total Marks *"
                  fullWidth
                  value={totalMarks}
                  disabled={true} // Always disabled as it's calculated automatically
                  error={!!errors.totalMarks}
                  helperText={errors.totalMarks}
                />
                <FormHelperText>
                  Total marks is automatically calculated based on selected questions
                </FormHelperText>
              </MDBox>
              
              <MDBox mb={2}>
                <MDInput
                  type="text"
                  label="Pass Criteria (80% of Total Marks)"
                  fullWidth
                  value={passCriteria}
                  disabled
                />
                <FormHelperText>
                  Pass criteria is fixed at 80% of total marks
                </FormHelperText>
              </MDBox>
            </Paper>

            {/* Action Buttons */}
            <MDBox mt={2} mb={1} display="flex" gap={2}>
              <MDButton
                variant="outlined"
                color="error"
                fullWidth
                onClick={() => navigate("/class-room")}
              >
                Cancel
              </MDButton>
              
              <MDButton
                variant="gradient"
                color="info"
                fullWidth
                type="submit"
                disabled={isUpdating || isSubmitDisabled()}
              >
                {isUpdating ? "Updating Quiz..." : "Update Quiz"}
              </MDButton>
            </MDBox>
          </MDBox>
        </MDBox>
      </Card>
    </BasicLayout>
  );
}

export default EditClassQuiz;