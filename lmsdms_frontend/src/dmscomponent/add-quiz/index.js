import React, { useState, useEffect } from "react";
import {
  Card,
  MenuItem,
  TextField,
  IconButton,
  List,
  ListItem,
  Select,
  OutlinedInput,
  Checkbox,
  ListItemText,
  Divider,
  FormHelperText,
  Box,
  Paper,
  Chip,
} from "@mui/material";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDInput from "components/MDInput";
import MDButton from "components/MDButton";
import BasicLayout from "layouts/authentication/components/BasicLayout";
import bgImage from "assets/images/bg-sign-in-basic.jpeg";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import { useCreateTrainingQuizMutation } from "apilms/quizapi";
import { useFetchTrainingWiseQuestionsQuery } from "apilms/questionApi";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { FormControl, InputLabel } from "@mui/material";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function CreateQuiz() {
  const location = useLocation();
  const { DataQuiz } = location.state || {};
  const navigate = useNavigate();
  const {id} = useParams()
  // Form state
  const [quizName, setQuizName] = useState("");
  const [quizTime, setQuizTime] = useState("");
  const [totalMarks, setTotalMarks] = useState("");
  const [totalQuestions, setTotalQuestions] = useState("");
  const [quizType, setQuizType] = useState("auto");
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [markBreakdown, setMarkBreakdown] = useState([]);
  const [availableQuestions, setAvailableQuestions] = useState([]);
  const [errors, setErrors] = useState({});

  // Calculate 80% of total marks for pass criteria (automatically)
  const passCriteria = totalMarks ? (parseFloat(totalMarks) * 0.8).toFixed(0) : "";

  // Fetch questions data
  const { data, isLoading, isError } = useFetchTrainingWiseQuestionsQuery(id);
  const [createQuiz, { isLoading: isQuizLoading }] = useCreateTrainingQuizMutation();

  // Set available questions from API response
  // useEffect(() => {
  //   if (data?.status && data?.data) {
  //     setAvailableQuestions(data.data);
  //   }
  // }, [data]);
  useEffect(() => {
    if (data?.status && data?.data) {
      const filteredQuestions = data.data.filter(question => question.status);
      setAvailableQuestions(filteredQuestions);
    }
  }, [data]);

  // Validate form on change
  useEffect(() => {
    validateForm();
  }, [totalMarks, markBreakdown, quizType, selectedQuestions, totalQuestions]);

  // Form validation
  const validateForm = () => {
    const newErrors = {};
    
    // Basic validation for negative values
    if (parseInt(totalQuestions) < 0) {
      newErrors.totalQuestions = "Total questions cannot be negative";
    }
    
    if (parseInt(totalMarks) < 0) {
      newErrors.totalMarks = "Total marks cannot be negative";
    }
    
    if (parseInt(quizTime) < 0) {
      newErrors.quizTime = "Quiz time cannot be negative";
    }
    
    // Mark breakdown validation for auto quiz
    if (quizType === "auto" && markBreakdown.length > 0) {
      // Check for negative values in mark breakdown
      markBreakdown.forEach((entry, index) => {
        if (parseInt(entry.mark) < 0) {
          newErrors[`markBreakdown_${index}_mark`] = "Mark value cannot be negative";
        }
        if (parseInt(entry.count) < 0) {
          newErrors[`markBreakdown_${index}_count`] = "Number of questions cannot be negative";
        }
      });
      
      // Calculate total questions from breakdown
      const totalQuestionsFromBreakdown = markBreakdown.reduce(
        (sum, entry) => sum + (parseInt(entry.count) || 0), 0
      );
      
      // Calculate total marks from breakdown
      const totalMarksFromBreakdown = markBreakdown.reduce(
        (sum, entry) => sum + ((parseInt(entry.mark) || 0) * (parseInt(entry.count) || 0)), 0
      );
      
      // Check if we have enough questions of each mark value
      markBreakdown.forEach((entry) => {
        const { mark, count } = entry;
        if (!mark || !count) return;
        
        const availableForMark = availableQuestions.filter(
          (q) => parseInt(q.marks) === parseInt(mark)
        );
        
        if (availableForMark.length < parseInt(count)) {
          newErrors.markBreakdown = `Not enough ${mark}-mark questions available. Need ${count}, have ${availableForMark.length}.`;
        }
      });
      
      // Check for duplicate mark values
      const markValues = markBreakdown.map(entry => entry.mark);
      const uniqueMarkValues = new Set(markValues.filter(Boolean));
      if (markValues.filter(Boolean).length !== uniqueMarkValues.size) {
        newErrors.duplicateMarks = "Duplicate mark values found. Please combine them into a single entry.";
      }
      
      // Verify total questions matches
      if (totalQuestions && totalQuestionsFromBreakdown !== parseInt(totalQuestions)) {
        newErrors.totalQuestions = `Total questions (${totalQuestions}) doesn't match the sum from mark breakdown (${totalQuestionsFromBreakdown})`;
      }
      
      // Verify total marks matches
      if (totalMarks && totalMarksFromBreakdown !== parseInt(totalMarks)) {
        newErrors.totalMarks = `Total marks (${totalMarks}) doesn't match the sum from mark breakdown (${totalMarksFromBreakdown})`;
      }
    }
    
    // Manual quiz validation
    if (quizType === "manual") {
      // Verify selected questions match total questions
      if (totalQuestions && selectedQuestions.length !== parseInt(totalQuestions)) {
        newErrors.totalQuestions = `You've selected ${selectedQuestions.length} questions, but specified ${totalQuestions} total questions`;
      }
      
      // Verify selected questions match total marks
      const selectedMarksTotal = selectedQuestions.reduce(
        (sum, q) => sum + parseInt(q.marks || 0), 0
      );
      
      if (totalMarks && selectedMarksTotal !== parseInt(totalMarks)) {
        newErrors.totalMarks = `Selected questions total ${selectedMarksTotal} marks, but specified ${totalMarks} total marks`;
      }
    }
    
    setErrors(newErrors);
  };

  // Handle adding a new mark breakdown entry
  const handleAddMarkBreakdown = () => {
    setMarkBreakdown([...markBreakdown, { mark: "", count: "" }]);
  };

  // Handle updating a mark breakdown entry
  const handleMarkBreakdownChange = (index, field, value) => {
    // Prevent negative values
    if (parseInt(value) < 0) {
      value = "0";
    }

    if(field === "mark" && parseInt(value) === 0 && parseInt(markBreakdown[index].count) > 0){
      toast.error("Mark value cannot be 0");
      return;
  }
    
    const updatedBreakdown = [...markBreakdown];
    updatedBreakdown[index][field] = value;
    
    // Check for duplicate mark values when changing mark field
    if (field === "mark" && value) {
      const existingIndex = markBreakdown.findIndex(
        (entry, i) => i !== index && entry.mark === value
      );
      
      if (existingIndex !== -1) {
        // Found a duplicate - combine them
        toast.info(`Combined with existing ${value}-mark entry`);
        
        // Add counts if the existing entry has a count
        if (updatedBreakdown[existingIndex].count && updatedBreakdown[index].count) {
          updatedBreakdown[existingIndex].count = (
            parseInt(updatedBreakdown[existingIndex].count) + 
            parseInt(updatedBreakdown[index].count)
          ).toString();
        } else if (updatedBreakdown[index].count) {
          updatedBreakdown[existingIndex].count = updatedBreakdown[index].count;
        }
        
        // Remove the current entry
        updatedBreakdown.splice(index, 1);
        setMarkBreakdown(updatedBreakdown);
        return;
      }
    }
    
    setMarkBreakdown(updatedBreakdown);
    
    // Auto-update total questions and marks if all entries are filled
    if (quizType === "auto") {
      const allFilled = updatedBreakdown.every(entry => 
        entry.mark && entry.count
      );
      
      if (allFilled) {
        // Calculate total questions from breakdown
        const calculatedTotalQuestions = updatedBreakdown.reduce(
          (sum, entry) => sum + (parseInt(entry.count) || 0), 0
        );
        
        // Calculate total marks from breakdown
        const calculatedTotalMarks = updatedBreakdown.reduce(
          (sum, entry) => sum + ((parseInt(entry.mark) || 0) * (parseInt(entry.count) || 0)), 0
        );
        
        setTotalQuestions(calculatedTotalQuestions.toString());
        setTotalMarks(calculatedTotalMarks.toString());
      }
    }
  };

  // Handle removing a mark breakdown entry
  const handleRemoveMarkBreakdown = (index) => {
    const updatedBreakdown = markBreakdown.filter((_, i) => i !== index);
    setMarkBreakdown(updatedBreakdown);
  };

  // Toggle question selection
  const handleToggleQuestion = (question) => {
    const isSelected = selectedQuestions.some(q => q.id === question.id);
    
    if (isSelected) {
      setSelectedQuestions(selectedQuestions.filter(q => q.id !== question.id));
    } else {
      setSelectedQuestions([...selectedQuestions, question]);
    }
    
    // Auto-update total marks and questions when selection changes
    if (quizType === "manual") {
      let newSelectedQuestions;
      
      if (isSelected) {
        newSelectedQuestions = selectedQuestions.filter(q => q.id !== question.id);
      } else {
        newSelectedQuestions = [...selectedQuestions, question];
      }
      
      // Update total questions
      setTotalQuestions(newSelectedQuestions.length.toString());
      
      // Update total marks
      const newTotalMarks = newSelectedQuestions.reduce(
        (sum, q) => sum + parseInt(q.marks || 0), 0
      );
      setTotalMarks(newTotalMarks.toString());
    }
  };

  // Handle quiz type change
  const handleQuizTypeChange = (e) => {
    const newType = e.target.value;
    setQuizType(newType);
    
    // Reset selections and totals when changing quiz type
    setSelectedQuestions([]);
    setMarkBreakdown([]);
    setTotalMarks("");
    setTotalQuestions("");
  };

  // Check if form can be submitted
  const isSubmitDisabled = () => {
    // Check if required fields are filled
    if (!quizName || !quizTime || !totalMarks || !totalQuestions) {
      return true;
    }
    
    // Check if there are any validation errors
    if (Object.keys(errors).length > 0) {
      return true;
    }
    
    // Type-specific validation
    if (quizType === "auto" && markBreakdown.length === 0) {
      return true;
    }
    
    if (quizType === "manual" && selectedQuestions.length === 0) {
      return true;
    }
    
    return false;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Final validation
    if (isSubmitDisabled()) {
      toast.error("Please fix all errors before submitting.");
      return;
    }

    // Transform mark breakdown for API
    const transformedMarksBreakdown = markBreakdown.reduce((acc, item) => {
      acc[item.mark] = item.count;
      return acc;
    }, {});
    
    // Prepare quiz data
    const quizData = {
      document_id:id,
      name: quizName,
      pass_criteria: parseFloat(totalMarks) * 0.8, // 80% of total marks
      quiz_time: quizTime,
      quiz_type: quizType,
      total_marks: totalMarks,
      selected_questions: quizType === "auto" ? [] : selectedQuestions.map(q => q.id),
      marks_breakdown: quizType === "auto" ? transformedMarksBreakdown : {},
    };

    try {
      await createQuiz(quizData).unwrap();
      toast.success("Quiz created successfully!");
      
      // Reset the form
      setQuizName("");
      setQuizTime("");
      setTotalMarks("");
      setTotalQuestions("");
      setSelectedQuestions([]);
      setMarkBreakdown([]);
      
      // Navigate away
      navigate("/trainingListing");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to create quiz. Please try again.");
    }
  };

  // Loading and error states
  if (isLoading) return <div>Loading available questions...</div>;
  if (isError) return <div>Error fetching available questions.</div>;

  return (
    <BasicLayout image={bgImage} showNavbarFooter={false}>
      <Card sx={{ width: 600, mx: "auto", mb: 3 }}>
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
            Create Quiz
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
            
            {/* Quiz Type */}
            <MDBox mb={3}>
              <FormControl fullWidth margin="dense">
                <InputLabel id="select-quiz-type-label">Quiz Type *</InputLabel>
                <Select
                  labelId="select-quiz-type-label"
                  id="select-quiz-type"
                  value={quizType}
                  onChange={handleQuizTypeChange}
                  input={<OutlinedInput label="Quiz Type" />}
                  sx={{
                    minWidth: 200,
                    height: "3rem",
                    ".MuiSelect-select": {
                      padding: "0.45rem",
                    },
                  }}
                >
                  <MenuItem value="auto">Auto (System selects questions)</MenuItem>
                  <MenuItem value="manual">Manual (You select questions)</MenuItem>
                </Select>
              </FormControl>
            </MDBox>
            
            {/* Quiz Time */}
            <MDBox mb={3}>
              <MDInput
                type="number"
                label="Quiz Time (in minutes) *"
                fullWidth
                value={quizTime}
                onChange={(e) => {
                  // Prevent negative values
                  const value = parseInt(e.target.value) < 0 ? "0" : e.target.value;
                  setQuizTime(value);
                }}
                error={!!errors.quizTime}
                helperText={errors.quizTime}
                inputProps={{ min: "0" }}  // HTML5 validation
              />
            </MDBox>

            {/* Auto Quiz - Mark Breakdown Section */}
            {quizType === "auto" && (
              <MDBox mb={3}>
                <MDTypography variant="h6" fontWeight="medium" mb={2}>
                  Mark Breakdown
                </MDTypography>
                <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
                  {markBreakdown.map((entry, index) => (
                    <MDBox
                      key={index}
                      display="flex"
                      flexDirection="row"
                      alignItems="center"
                      gap={2}
                      mb={2}
                    >
                      <TextField
                        label="Mark Value"
                        type="number"
                        size="small"
                        value={entry.mark}
                        onChange={(e) => handleMarkBreakdownChange(index, "mark", e.target.value)}
                        error={!!errors[`markBreakdown_${index}_mark`]}
                        helperText={errors[`markBreakdown_${index}_mark`]}
                        inputProps={{ min: "0" }}  // HTML5 validation
                      />
                      <TextField
                        label="Number of Questions"
                        type="number"
                        size="small"
                        value={entry.count}
                        onChange={(e) => handleMarkBreakdownChange(index, "count", e.target.value)}
                        error={!!errors[`markBreakdown_${index}_count`]}
                        helperText={errors[`markBreakdown_${index}_count`]}
                        inputProps={{ min: "0" }}  // HTML5 validation
                      />
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => handleRemoveMarkBreakdown(index)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </MDBox>
                  ))}
                  
                  {/* Mark Breakdown info and validation */}
                  {markBreakdown.map((entry, index) => {
                    const { mark, count } = entry;
                    if (!mark || !count) return null;
                    
                    const available = availableQuestions.filter(
                      (q) => parseInt(q.marks) === parseInt(mark)
                    );
                    
                    const hasEnough = available.length >= parseInt(count);
                    
                    return (
                      <MDTypography
                        key={`info-${index}`}
                        variant="body2"
                        color={hasEnough ? "success" : "error"}
                        mb={1}
                      >
                        {mark}-mark questions: {available.length} available, {count} needed
                        {!hasEnough && " (NOT ENOUGH)"}
                      </MDTypography>
                    );
                  })}
                  
                  <MDButton
                    variant="outlined"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={handleAddMarkBreakdown}
                    fullWidth
                    sx={{ mt: 2 }}
                  >
                    Add Mark Breakdown
                  </MDButton>
                </Paper>
                
                {errors.markBreakdown && (
                  <FormHelperText error>{errors.markBreakdown}</FormHelperText>
                )}
                
                {errors.duplicateMarks && (
                  <FormHelperText error>{errors.duplicateMarks}</FormHelperText>
                )}
              </MDBox>
            )}

            {/* Manual Quiz - Question Selection */}
            {quizType === "manual" && (
              <MDBox mb={3}>
                <MDTypography variant="h6" fontWeight="medium" mb={2}>
                  Select Questions
                </MDTypography>
                <Paper elevation={1} sx={{ p: 2, maxHeight: 300, overflow: 'auto' }}>
                  <List>
                    {availableQuestions.map((question) => (
                      <React.Fragment key={question.id}>
                        <ListItem
                          secondaryAction={
                            <Checkbox
                              edge="end"
                              checked={selectedQuestions.some(q => q.id === question.id)}
                              onChange={() => handleToggleQuestion(question)}
                            />
                          }
                        >
                          <ListItemText
                            primary={question.question_text}
                            secondary={
                              <>
                                <span>Type: {question.question_type}</span>
                                <Chip 
                                  label={`${question.marks} ${question.marks === 1 ? 'mark' : 'marks'}`}
                                  size="small"
                                  color="primary"
                                  sx={{ ml: 1 }}
                                />
                              </>
                            }
                          />
                        </ListItem>
                        <Divider />
                      </React.Fragment>
                    ))}
                  </List>
                </Paper>
                
                {/* Selected Questions Summary */}
                <Box mt={2}>
                  <MDTypography variant="body2">
                    Selected: {selectedQuestions.length} questions, 
                    Total: {selectedQuestions.reduce((sum, q) => sum + parseInt(q.marks || 0), 0)} marks
                  </MDTypography>
                </Box>
              </MDBox>
            )}
            
            {/* Quiz Totals */}
            <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
              <MDBox mb={2}>
                <MDInput
                  type="number"
                  label="Total Questions *"
                  fullWidth
                  value={totalQuestions}
                  onChange={(e) => {
                    // Prevent negative values
                    const value = parseInt(e.target.value) < 0 ? "0" : e.target.value;
                    setTotalQuestions(value);
                  }}
                  error={!!errors.totalQuestions}
                  helperText={errors.totalQuestions}
                  disabled={
                    (quizType === "manual" && selectedQuestions.length > 0) || 
                    (quizType === "auto" && markBreakdown.every(entry => entry.mark && entry.count))
                  }
                  inputProps={{ min: "0" }}  // HTML5 validation
                />
              </MDBox>
              
              <MDBox mb={2}>
                <MDInput
                  type="number"
                  label="Total Marks *"
                  fullWidth
                  value={totalMarks}
                  onChange={(e) => {
                    // Prevent negative values
                    const value = parseInt(e.target.value) < 0 ? "0" : e.target.value;
                    setTotalMarks(value);
                  }}
                  error={!!errors.totalMarks}
                  helperText={errors.totalMarks}
                  disabled={
                    (quizType === "manual" && selectedQuestions.length > 0) || 
                    (quizType === "auto" && markBreakdown.every(entry => entry.mark && entry.count))
                  }
                  inputProps={{ min: "0" }}  // HTML5 validation
                />
              </MDBox>
              
              <MDBox mb={2}>
                <MDInput
                  type="text"
                  label="Pass Criteria (80% of Total Marks)"
                  fullWidth
                  value={passCriteria}
                  disabled
                />
              </MDBox>
            </Paper>

            {/* Submit Button */}
            <MDBox mt={2} mb={1}>
              <MDButton
                variant="gradient"
                color="info"
                fullWidth
                type="submit"
                disabled={isQuizLoading || isSubmitDisabled()}
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

export default CreateQuiz;