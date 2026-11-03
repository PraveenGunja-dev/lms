import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Card,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  OutlinedInput,
  IconButton,
  List,
  ListItem,
  FormControlLabel,
  Radio,
  RadioGroup,
  Checkbox,
} from "@mui/material";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDInput from "components/MDInput";
import MDButton from "components/MDButton";
import BasicLayout from "layouts/authentication/components/BasicLayout";
import bgImage from "assets/images/bg-sign-in-basic.jpeg";
import ESignatureDialog from "layouts/authentication/ESignatureDialog";
import DeleteIcon from "@mui/icons-material/Delete";
import TinyMCEEditorDialog from "../add-questions/question-dialog/index";
import { useUpdateTrainingQuestionMutation } from "apilms/questionApi";
import { toast, ToastContainer } from "react-toastify";

function EditQuestion() {
  const { state } = useLocation(); // Get the passed state from location
  const navigate = useNavigate();
  const documnetId = state.item.fullData.document;
  console.log("++++++++++++++++++++++++++", documnetId);
  const [answers, setAnswers] = useState(() => {
    const optionsArray = state?.item?.fullData?.options?.split(",") || [];
    const correctAnswer = state?.item?.fullData?.correct_answer;
    return optionsArray.map((option) => ({
      text: option,
      isCorrect: option.trim() === correctAnswer.trim(), // Mark correct answer
    }));
  });
  const [questionText, setQuestionText] = useState(state?.item?.fullData?.question_text || "");
  const [questionType, setQuestionType] = useState(state?.item?.question_type || "MCQ");
  const [questionMarks, setQuestionMarks] = useState(state?.item?.fullData?.marks || "");
  const [questionLanguage, setQuestionLanguage] = useState(state?.item?.language || "English");
  const [status, setStatus] = useState(state?.item?.fullData?.status ? "true" : "false");
  const [createdAt, setCreatedAt] = useState(
    state?.question_created_at ? state.question_created_at : new Date().toISOString().slice(0, 10)
  );
  const [createdBy, setCreatedBy] = useState(state?.item?.created_by || "");
  const [openSignatureDialog, setOpenSignatureDialog] = useState(false);
  const [openQuestionDialog, setOpenQuestionDialog] = useState(false);
  const [openAnswerDialog, setOpenAnswerDialog] = useState(false);
  const [currentAnswerIndex, setCurrentAnswerIndex] = useState(null);
  const [mediaFile, setMediaFile] = useState(
    state?.item?.image_file_url ||
      state?.item?.video_file_url ||
      state?.item?.audio_file_url ||
      null
  );

  const [updateTrainingQuestion] = useUpdateTrainingQuestionMutation();
  const QuestionId = state?.item?.fullData?.id;
  const training_id = state?.id;
  // console.log(training_id)
  // console.log(QuestionId)
  useEffect(() => {
    const correctAnswer = state?.item?.fullData?.correct_answer || ""; // Get correct answer safely

    if (questionType === "True/False") {
      setAnswers([
        { text: "True", isCorrect: correctAnswer === "True" },
        { text: "False", isCorrect: correctAnswer === "False" },
      ]);
    } else if (questionType === "MCQ") {
      const optionsArray = state?.item?.fullData?.options?.split(",") || [];
      setAnswers(
        optionsArray.map((option) => ({
          text: option.trim(),
          isCorrect: option.trim() === correctAnswer.trim(),
        }))
      );
    } else if (questionType === "Fill in the blank") {
      setAnswers([{ text: correctAnswer || "", isCorrect: true }]);
    }
  }, [questionType, state?.item?.fullData]);

  const handleSignatureComplete = async (password) => {
    setOpenSignatureDialog(false);

    if (!password) {
      toast.error("E-Signature is required to proceed.");
      return;
    }

    const formData = new FormData();
    formData.append("training_id", training_id);
    formData.append("question_text", questionText);
    formData.append("question_type", questionType);
    formData.append("marks", questionMarks);
    formData.append("status", status);
    formData.append("createdAt", createdAt);
    formData.append("createdBy", createdBy);

    let options = null;
    let correct_answer = null;
    if (questionType === "MCQ") {
      options = answers.map((answer) => answer.text).join(",");
      correct_answer = answers
        .filter((answer) => answer.isCorrect)
        .map((answer) => answer.text)
        .join(",");
    } else if (questionType === "True/False") {
      options = "True,False";
      correct_answer = answers[0]?.text;
    } else if (questionType === "Fill in the blank") {
      options = "";
      correct_answer = answers[0]?.text;
    }
    formData.append("options", options ? JSON.stringify(options) : null);
    formData.append("correct_answer", correct_answer ? correct_answer : "");
    if (mediaFile) {
      formData.append("mediaFile", mediaFile); // Append media file if available
    }

    try {
      const response = await updateTrainingQuestion({
        QuestionId, // Ensure this is correctly assigned
        formData,
      }).unwrap();
      toast.success("Question updated successfully!");
      setTimeout(() => {
        navigate(`/questions/${documnetId}`);
      }, 1500);
    } catch (error) {
      toast.false("Failed to create question. Please try again.");
    } finally {
      setOpenSignatureDialog(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setOpenSignatureDialog(true); // Open signature dialog when submitting the form
  };

  const handleAddAnswer = () => {
    if (answers.length < 6) {
      setAnswers([...answers, { text: "", isCorrect: false }]);
    }
  };

  const handleAnswerChange = (index, value) => {
    const updatedAnswers = [...answers];
    updatedAnswers[index].text = value;
    setAnswers(updatedAnswers);
  };

  const handleRemoveAnswer = (index) => {
    const updatedAnswers = answers.filter((_, i) => i !== index);
    setAnswers(updatedAnswers);
  };

  const handleCorrectAnswerChange = (index) => {
    const updatedAnswers = [...answers];
    updatedAnswers.forEach((answer, i) => (answer.isCorrect = false)); // Reset all answers to incorrect
    updatedAnswers[index].isCorrect = true; // Set the selected answer as correct
    setAnswers(updatedAnswers);
  };

  const handleOpenQuestionDialog = () => {
    setOpenQuestionDialog(true);
  };

  const handleCloseQuestionDialog = () => {
    setOpenQuestionDialog(false);
  };

  const handleOpenAnswerDialog = (index) => {
    setCurrentAnswerIndex(index);
    setOpenAnswerDialog(true);
  };

  const handleCloseAnswerDialog = () => {
    setOpenAnswerDialog(false);
  };

  const handleSaveQuestion = (content) => {
    setQuestionText(content);
  };

  const handleSaveAnswer = (content) => {
    const updatedAnswers = [...answers];
    updatedAnswers[currentAnswerIndex].text = content;
    setAnswers(updatedAnswers);
  };

  // Handle media file change (image/video/audio)
  const handleMediaChange = (e) => {
    const file = e.target.files[0];
    setMediaFile(file);
  };

  return (
    <BasicLayout image={bgImage} showNavbarFooter={false}>
      <Card sx={{ width: 600, mx: "auto", mt: 5, mb: 5 }}>
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
            Edit Question
          </MDTypography>
        </MDBox>

        <MDBox pb={3} px={3}>
          <MDBox component="form" role="form" onSubmit={handleSubmit} sx={{ padding: 3 }}>
            <MDBox mb={3}>
              <MDInput
                type="text"
                label="Edit Question"
                fullWidth
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
              />
            </MDBox>

            <MDBox mb={3}>
              <FormControl fullWidth margin="dense">
                <InputLabel id="select-question-type-label">Question Type</InputLabel>
                <Select
                  labelId="select-question-type-label"
                  id="select-question-type"
                  value={questionType}
                  onChange={(e) => setQuestionType(e.target.value)}
                  input={<OutlinedInput label="Question Type" />}
                  sx={{
                    minWidth: 200,
                    height: "3rem",
                    ".MuiSelect-select": { padding: "0.45rem" },
                  }}
                >
                  {/* <MenuItem value="Fill in the blank">Fill in the blank</MenuItem> */}
                  <MenuItem value="MCQ">MCQ</MenuItem>
                  <MenuItem value="True/False">True/False</MenuItem>
                </Select>
              </FormControl>
            </MDBox>

            {/* Answer Section */}
            <MDBox mb={3}>
              <MDTypography variant="h6" fontWeight="medium">
                Add Options
              </MDTypography>

              {questionType === "Fill in the blank" && (
                <MDInput
                  type="text"
                  placeholder="Answer"
                  value={answers[0]?.text}
                  onChange={(e) => handleAnswerChange(0, e.target.value)}
                  fullWidth
                />
              )}

              {questionType === "MCQ" && (
                <List>
                  {answers.map((answer, index) => (
                    <ListItem key={index}>
                      <MDInput
                        type="text"
                        value={answer.text}
                        onChange={(e) => handleAnswerChange(index, e.target.value)}
                        fullWidth
                        sx={{ flex: 1, marginRight: 2 }}
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={answer.isCorrect}
                            onChange={() => handleCorrectAnswerChange(index)}
                          />
                        }
                      />
                      <IconButton onClick={() => handleRemoveAnswer(index)}>
                        <DeleteIcon />
                      </IconButton>
                    </ListItem>
                  ))}
                </List>
              )}

              {questionType === "True/False" && (
                <RadioGroup>
                  <FormControlLabel
                    value="True"
                    control={<Radio />}
                    label="True"
                    checked={answers[0]?.text === "True"}
                    onChange={() => handleAnswerChange(0, "True")}
                  />
                  <FormControlLabel
                    value="False"
                    control={<Radio />}
                    label="False"
                    checked={answers[0]?.text === "False"}
                    onChange={() => handleAnswerChange(0, "False")}
                  />
                </RadioGroup>
              )}

              {questionType !== "True/False" && (
                <MDButton variant="outlined" color="success" onClick={handleAddAnswer}>
                  Add Answer
                </MDButton>
              )}
            </MDBox>

            <MDBox mb={3}>
              <MDInput
                type="number"
                label="Question Marks"
                fullWidth
                value={questionMarks}
                onChange={(e) => setQuestionMarks(e.target.value)}
              />
            </MDBox>

            <MDBox mb={3}>
              <FormControl fullWidth margin="dense">
                <InputLabel id="select-language-label">Question Language</InputLabel>
                <Select
                  labelId="select-language-label"
                  id="select-language"
                  value={questionLanguage}
                  onChange={(e) => setQuestionLanguage(e.target.value)}
                  input={<OutlinedInput label="Question Language" />}
                  sx={{
                    minWidth: 200,
                    height: "3rem",
                    ".MuiSelect-select": { padding: "0.45rem" },
                  }}
                >
                  <MenuItem value="English">English</MenuItem>
                  <MenuItem value="Gujarati">Gujarati</MenuItem>
                  <MenuItem value="Hindi">Hindi</MenuItem>
                </Select>
              </FormControl>
            </MDBox>

            <MDBox mb={3}>
              <FormControl component="fieldset" fullWidth>
                <MDTypography variant="h6" fontWeight="medium">
                  Status
                </MDTypography>
                <RadioGroup row value={status} onChange={(e) => setStatus(e.target.value)}>
                  <FormControlLabel value="true" control={<Radio />} label="Active" />
                  <FormControlLabel value="false" control={<Radio />} label="Inactive" />
                </RadioGroup>
              </FormControl>
            </MDBox>

            <MDBox mb={3}>
              <MDTypography variant="h6">Upload Media (Image/Video/Audio)</MDTypography>
              <input type="file" accept="image/*,video/*,audio/*" onChange={handleMediaChange} />
              {mediaFile && <MDTypography variant="body2">{mediaFile.name}</MDTypography>}
            </MDBox>

            <MDBox mt={2} mb={1}>
              <MDButton variant="gradient" color="submit" fullWidth type="submit">
                Submit
              </MDButton>
            </MDBox>
          </MDBox>
        </MDBox>
      </Card>

      {/* E-Signature Dialog */}
      <ESignatureDialog
        open={openSignatureDialog}
        onClose={() => setOpenSignatureDialog(false)}
        onConfirm={handleSignatureComplete}
      />
      {/* Question Edit Dialog */}
      <TinyMCEEditorDialog
        open={openQuestionDialog}
        onClose={handleCloseQuestionDialog}
        title="Edit Question"
        content={questionText}
        onSave={handleSaveQuestion}
      />

      <TinyMCEEditorDialog
        open={openAnswerDialog}
        onClose={handleCloseAnswerDialog}
        title="Edit Answer"
        content={answers[currentAnswerIndex]?.text || ""}
        onSave={handleSaveAnswer}
      />
      {/* <ToastContainer position="top-right" autoClose={3000} /> */}
    </BasicLayout>
  );
}

export default EditQuestion;
