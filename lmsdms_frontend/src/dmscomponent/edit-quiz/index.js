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
import { useUpdateTrainingQuizMutation } from "apilms/quizapi";
import { useFetchTrainingWiseQuestionsQuery } from "apilms/questionApi";
import { useLocation, useNavigate } from "react-router-dom";
import { FormControl, InputLabel } from "@mui/material";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useFetchTrainingsQuery } from "apilms/trainingApi";
import { useGetTrainingQuizzesQuery } from "apilms/quizapi";

function EditQuiz() {
  const location = useLocation();
  const { quiz } = location.state || {};
  const navigate = useNavigate();
  // const {refetch} = useFetchTrainingsQuery()
  const {refetch}= useGetTrainingQuizzesQuery(quiz.document)
  // console.log(quiz)
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
  const [initialLoad, setInitialLoad] = useState(true);

  // Calculate 80% of total marks for pass criteria (automatically)
  const passCriteria = totalMarks ? (parseFloat(totalMarks) * 0.8).toFixed(0) : "";

  // Fetch questions data
  const { data, isLoading, isError } = useFetchTrainingWiseQuestionsQuery(quiz?.document);
  const [updateQuiz, { isLoading: isUpdateLoading }] = useUpdateTrainingQuizMutation();

  // Initialize form with quiz data
  useEffect(() => {
    if (quiz && initialLoad) {
      // Set basic quiz information
      setQuizName(quiz.quiz_name || "");
      
      // Parse quiz time (remove " mins" if present)
      const timeValue = quiz.quiz_time?.replace(" mins", "") || "";
      setQuizTime(timeValue);
      
      setTotalMarks(quiz.total_marks?.toString() || "");
      setTotalQuestions(quiz.total_questions?.toString() || "");
      setQuizType(quiz.quiz_type || "auto");
      
      // If it's a manual quiz, set the selected questions
      if (quiz.quiz_type === "manual" && quiz.questions) {
        setSelectedQuestions(quiz.questions);
      }
      
      // For auto quiz, try to reconstruct the mark breakdown
      if (quiz.quiz_type === "auto" && quiz.questions) {
        // Group questions by marks to recreate the breakdown
        const markCounts = {};
        quiz.questions.forEach(q => {
          const mark = q.marks.toString();
          markCounts[mark] = (markCounts[mark] || 0) + 1;
        });
        
        // Convert to array format for state
        const breakdown = Object.entries(markCounts).map(([mark, count]) => ({
          mark,
          count: count.toString()
        }));
        
        setMarkBreakdown(breakdown);
      }
      
      setInitialLoad(false);
    }
  }, [quiz, initialLoad]);

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
    if (!initialLoad) {
      validateForm();
    }
  }, [totalMarks, markBreakdown, quizType, selectedQuestions, totalQuestions, initialLoad]);

  // Form validation
  const validateForm = () => {
    const newErrors = {};
    
    // Mark breakdown validation for auto quiz
    if (quizType === "auto" && markBreakdown.length > 0) {
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
  // const handleAddMarkBreakdown = () => {
  //   setMarkBreakdown([...markBreakdown, { mark: "", count: "" }]);
  // };
  const handleAddMarkBreakdown = () => {
    // First, check if any mark values are already fully utilized
    const availableMarkValues = new Set();
    const usedQuestionCounts = {};
    
    // Calculate which mark values are currently being used
    markBreakdown.forEach(entry => {
      if (entry.mark && entry.count) {
        usedQuestionCounts[entry.mark] = (usedQuestionCounts[entry.mark] || 0) + parseInt(entry.count);
      }
    });
    
    // Determine which mark values still have available questions
    availableQuestions.forEach(question => {
      const mark = question.marks.toString();
      const totalAvailable = availableQuestions.filter(q => q.marks.toString() === mark).length;
      const totalUsed = usedQuestionCounts[mark] || 0;
      
      if (totalAvailable > totalUsed) {
        availableMarkValues.add(mark);
      }
    });
    
    // If there are no mark values with available questions, show an error
    if (availableMarkValues.size === 0) {
      toast.warning("You've used all available questions in your mark breakdown.");
      return;
    }
    
    // Otherwise, add a new breakdown entry
    setMarkBreakdown([...markBreakdown, { mark: "", count: "" }]);
  };

  // Handle updating a mark breakdown entry
  // const handleMarkBreakdownChange = (index, field, value) => {
  //   const updatedBreakdown = [...markBreakdown];
  //   updatedBreakdown[index][field] = value;
  //   setMarkBreakdown(updatedBreakdown);
    
  //   // Auto-update total questions and marks if all entries are filled
  //   if (quizType === "auto") {
  //     const allFilled = updatedBreakdown.every(entry => 
  //       entry.mark && entry.count
  //     );
      
  //     if (allFilled) {
  //       // Calculate total questions from breakdown
  //       const calculatedTotalQuestions = updatedBreakdown.reduce(
  //         (sum, entry) => sum + (parseInt(entry.count) || 0), 0
  //       );
        
  //       // Calculate total marks from breakdown
  //       const calculatedTotalMarks = updatedBreakdown.reduce(
  //         (sum, entry) => sum + ((parseInt(entry.mark) || 0) * (parseInt(entry.count) || 0)), 0
  //       );
        
  //       setTotalQuestions(calculatedTotalQuestions.toString());
  //       setTotalMarks(calculatedTotalMarks.toString());
  //     }
  //   }
  // };
  const handleMarkBreakdownChange = (index, field, value) => {
    const updatedBreakdown = [...markBreakdown];
    updatedBreakdown[index][field] = value;
    
    // If both mark and count are filled, validate against available questions
    if (field === "count" && updatedBreakdown[index].mark) {
      const mark = updatedBreakdown[index].mark;
      const count = parseInt(value) || 0;
      
      // Count how many questions of this mark value are being used in other entries
      const otherEntriesCount = updatedBreakdown.reduce((sum, entry, i) => {
        if (i !== index && entry.mark === mark && entry.count) {
          return sum + parseInt(entry.count);
        }
        return sum;
      }, 0);
      
      // Count available questions of this mark value
      const availableForMark = availableQuestions.filter(
        q => q.marks.toString() === mark
      ).length;
      
      // If trying to use more questions than available, limit the count
      if (count + otherEntriesCount > availableForMark) {
        const maxAllowed = Math.max(0, availableForMark - otherEntriesCount);
        updatedBreakdown[index].count = maxAllowed.toString();
        toast.warning(`Only ${maxAllowed} more ${mark}-mark questions available.`);
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
    // Find if the question is already selected
    const isSelected = selectedQuestions.some(q => 
      q.id === question.id || q.question === question.id
    );
    
    if (isSelected) {
      // Remove the question using the same conditions used to check if it's selected
      setSelectedQuestions(selectedQuestions.filter(q => 
        !(q.id === question.id || q.question === question.id)
      ));
    } else {
      setSelectedQuestions([...selectedQuestions, question]);
    }
    
    // Auto-update total marks and questions when selection changes
    if (quizType === "manual") {
      let newSelectedQuestions;
      
      if (isSelected) {
        newSelectedQuestions = selectedQuestions.filter(q => 
          !(q.id === question.id || q.question === question.id)
        );
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
  // const handleQuizTypeChange = (e) => {
  //   const newType = e.target.value;
  //   setQuizType(newType);
    
  //   // Reset selections and totals when changing quiz type
  //   setSelectedQuestions([]);
  //   setMarkBreakdown([]);
  //   setTotalMarks("");
  //   setTotalQuestions("");
  // };
  const handleQuizTypeChange = (e) => {
    const newType = e.target.value;
    const oldType = quizType;
    
    // Show confirmation dialog for changing quiz type
    if (window.confirm(
      "Changing quiz type will reset your current selections. Are you sure you want to continue?"
    )) {
      setQuizType(newType);
      
      if (newType === "auto") {
        // Convert from manual to auto
        setSelectedQuestions([]);
        
        // Optional: try to create an initial mark breakdown based on current selections
        if (oldType === "manual" && selectedQuestions.length > 0) {
          // Group questions by marks to create a breakdown
          const markCounts = {};
          selectedQuestions.forEach(q => {
            const mark = q.marks.toString();
            markCounts[mark] = (markCounts[mark] || 0) + 1;
          });
          
          // Convert to array format for state
          const initialBreakdown = Object.entries(markCounts).map(([mark, count]) => ({
            mark,
            count: count.toString()
          }));
          
          setMarkBreakdown(initialBreakdown);
        } else {
          setMarkBreakdown([]);
        }
      } else {
        // Convert from auto to manual
        setMarkBreakdown([]);
        setSelectedQuestions([]);
      }
    }
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
      quiz_id: quiz.id,
      name: quizName,
      pass_criteria: parseFloat(totalMarks) * 0.8, // 80% of total marks
      quiz_time: quizTime,
      quiz_type: quizType,
      total_marks: totalMarks,
      selected_questions: quizType === "auto" ? [] : selectedQuestions.map(q => q.id),
      marks_breakdown: quizType === "auto" ? transformedMarksBreakdown : {},
    };

    try {
      let response = await updateQuiz(quizData).unwrap();
      if(response.status){
        toast.success("Quiz updated successfully!");
        // Navigate back to list view
        refetch();
        navigate("/trainingListing");
      }else{
        toast.error(response.message);
        // navigate("/trainingListing");
      }

    } catch (err) {
      toast.error(err?.data?.message || "Failed to update quiz. Please try again.");
    }
  };

  // Loading and error states
  if (isLoading) return <div>Loading available questions...</div>;
  if (isError) return <div>Error fetching available questions.</div>;
  if (!quiz) return <div>No quiz data provided.</div>;

  return (
    <BasicLayout image={bgImage} showNavbarFooter={false}>
      <Card sx={{ width: 600, mx: "auto", mb: 3,mt:7 }}>
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
            Edit Quiz
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
            
            {/* Quiz Type - Disabled for editing to avoid complexity */}
            <MDBox mb={3}>
              <FormControl fullWidth margin="dense">
                <InputLabel id="select-quiz-type-label">Quiz Type *</InputLabel>
                <Select
                  labelId="select-quiz-type-label"
                  id="select-quiz-type"
                  value={quizType}
                  onChange={handleQuizTypeChange}
                  input={<OutlinedInput label="Quiz Type" />}
                   // Disabling type change to avoid complications
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
                <FormHelperText>Quiz type cannot be changed after creation</FormHelperText>
              </FormControl>
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
                        inputProps={{ min: 0 }} 
                      />
                      <TextField
                        label="Number of Questions"
                        type="number"
                        size="small"
                        value={entry.count}
                        onChange={(e) => handleMarkBreakdownChange(index, "count", e.target.value)}
                          inputProps={{ min: 0 }}
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
                    {availableQuestions.map((question) => {
                      // Check if question is already selected (by id or question id)
                      const isSelected = selectedQuestions.some(
                        q => q.id === question.id || q.question === question.id
                      );
                      
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
                      );
                    })}
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
                  onChange={(e) => setTotalQuestions(e.target.value)}
                  error={!!errors.totalQuestions}
                  helperText={errors.totalQuestions}
                  disabled={
                    (quizType === "manual" && selectedQuestions.length > 0) || 
                    (quizType === "auto" && markBreakdown.every(entry => entry.mark && entry.count))
                  }
                />
              </MDBox>
              
              <MDBox mb={2}>
                <MDInput
                  type="number"
                  label="Total Marks *"
                  fullWidth
                  value={totalMarks}
                  onChange={(e) => setTotalMarks(e.target.value)}
                  error={!!errors.totalMarks}
                  helperText={errors.totalMarks}
                  disabled={
                    (quizType === "manual" && selectedQuestions.length > 0) || 
                    (quizType === "auto" && markBreakdown.every(entry => entry.mark && entry.count))
                  }
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

            {/* Action Buttons */}
            <MDBox mt={2} mb={1} display="flex" gap={2}>
              <MDButton
                variant="outlined"
                color="error"
                fullWidth
                onClick={() => navigate("/trainingListing")}
              >
                Cancel
              </MDButton>
              
              <MDButton
                variant="gradient"
                color="info"
                fullWidth
                type="submit"
                disabled={isUpdateLoading || isSubmitDisabled()}
              >
                {isUpdateLoading ? "Updating Quiz..." : "Update Quiz"}
              </MDButton>
            </MDBox>
          </MDBox>
        </MDBox>
      </Card>
    </BasicLayout>
  );
}

export default EditQuiz;