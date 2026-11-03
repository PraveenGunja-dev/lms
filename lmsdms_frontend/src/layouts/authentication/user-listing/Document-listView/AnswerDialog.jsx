import React from "react";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Box,
  Paper,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemText,
  Alert,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import MDButton from "components/MDButton";
import MDTypography from "components/MDTypography";
import { useUserIdWiseResultQuery } from "api/auth/userApi";

const AnswerSection = ({ title, questions, icon: Icon, color }) => {
  // If questions is undefined, null, or empty array, return null
  if (!questions?.length) return null;

  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <Icon sx={{ color, mr: 1 }} />
        <Typography variant="h6" color={color}>
          {title} ({questions.length})
        </Typography>
      </Box>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <List disablePadding>
          {questions.map((question, index) => (
            <React.Fragment key={question?.id || index}>
              {index > 0 && <Divider sx={{ my: 2 }} />}
              <ListItem disablePadding>
                <ListItemText
                  primary={
                    <Typography variant="subtitle1" sx={{ fontWeight: "medium" }}>
                      {question?.question_text || "Question text not available"}
                    </Typography>
                  }
                  secondary={
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Your Answer: {question?.user_answer || "No answer provided"}
                      </Typography>
                      {question?.correct_answer && (
                        <Typography variant="body2" color="success.main">
                          Correct Answer: {question.correct_answer}
                        </Typography>
                      )}
                      <Typography variant="caption" color="text.secondary">
                        Question ID: {question?.question_id || "N/A"} | 
                        Attempt ID: {question?.attempted_quiz || "N/A"}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
            </React.Fragment>
          ))}
        </List>
      </Paper>
    </Box>
  );
};

const NoDataMessage = () => (
  <Box sx={{ py: 4, textAlign: "center" }}>
    <Typography variant="body1" color="text.secondary">
      No answers available for this quiz attempt.
    </Typography>
  </Box>
);

const AnswerDialog = ({ open, onClose, userId, documentId }) => {
  const { data, isLoading, isError } = useUserIdWiseResultQuery({ userId, documentId });
  // console.log(userId,documentId)
  // console.log("DADADADDA",data)
  // Handle missing userId or documentId
  if (!userId || !documentId) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography variant="h5">Quiz Answers</Typography>
        </DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mt: 2 }}>
            Missing required information to fetch answers.
          </Alert>
        </DialogContent>
        <DialogActions>
          <MDButton onClick={onClose} color="primary">
            Close
          </MDButton>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h5">Quiz Answers</Typography>
      </DialogTitle>
      
      <DialogContent>
        {isLoading && (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress />
          </Box>
        )}
        
        {isError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            Failed to fetch answers. Please try again later.
          </Alert>
        )}
        
        {data && (
          <>
            {(!data.incorrect_questions?.length && !data.correct_questions?.length) ? (
              <NoDataMessage />
            ) : (
              <Box sx={{ mt: 2 }}>
                <AnswerSection
                  title="Incorrect Answers"
                  questions={data.incorrect_questions || []}
                  icon={CancelIcon}
                  color="error.main"
                />
                
                <AnswerSection
                  title="Correct Answers"
                  questions={data.correct_questions || []}
                  icon={CheckCircleIcon}
                  color="success.main"
                />
              </Box>
            )}
          </>
        )}
      </DialogContent>
      
      <DialogActions>
        <MDButton onClick={onClose} color="primary">
          Close
        </MDButton>
      </DialogActions>
    </Dialog>
  );
};

AnswerSection.propTypes = {
  title: PropTypes.string.isRequired,
  questions: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number,
    attempted_quiz: PropTypes.number,
    question_id: PropTypes.string,
    question_text: PropTypes.string,
    user_answer: PropTypes.string,
  })),
  icon: PropTypes.elementType.isRequired,
  color: PropTypes.string.isRequired,
};

AnswerDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  userId: PropTypes.number,
  documentId: PropTypes.number,
};

export default AnswerDialog;