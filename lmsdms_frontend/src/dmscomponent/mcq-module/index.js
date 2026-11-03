import React, { useEffect, useRef, useState } from "react";
import { getErrorMessage } from "services/baseQuery";
import CounterIndicator from "./counterIndicator";
import MDButton from "components/MDButton";
import QuestionSection from "./questionSection";
import { 
  Pagination, 
  Stack, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  CircularProgress,
  Box,
  Container,
  Typography,
} from "@mui/material";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useGetTrainingQuizzesQuery } from "apilms/quizapi";
import { useAttemptQuizMutation } from "apilms/quizapi";
import { useStartAttemptQuizMutation } from "apilms/quizapi";

function MultiChoiceQuestionsSection() {
  const navigate = useNavigate();
  const location = useLocation();
    const { trainingQuizId } = useParams();
  // const id = location?.state?.rowData;
  const id = trainingQuizId;
  const { data: questionsData, isLoading, isError } = useGetTrainingQuizzesQuery(id, {
    skip: !id,
  });
  console.log("QUESSS>>>>>",questionsData)
  const [startAttemptQuiz]=useStartAttemptQuizMutation();
  const quiz_id = questionsData?.data[0]?.id || 0;
  const [attemptQuiz] = useAttemptQuizMutation();
  const [questions, setQuestions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [answers, setAnswers] = useState({});
  const [correctAnswers, setCorrectAnswers] = useState({});
  const [startError, setStartError] = useState(null);
  const [attemptInfo, setAttemptInfo] = useState(null);
  const [pageCount, setPageCount] = useState(1);
  const [counter, setCounter] = useState(0);
  const [openModal, setOpenModal] = useState(false);
  const [resultMessage, setResultMessage] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [openConfirmModal, setOpenConfirmModal] = useState(false);
  
  // This is the most important part - disabling the back button
  useEffect(() => {
    // Force replace current history entry
    window.history.replaceState(null, "", window.location.pathname);

    // Push additional state to create new history entry
    window.history.pushState(null, "", window.location.pathname);
    window.history.pushState(null, "", window.location.pathname);
    
    // Function to handle popstate (when back/forward buttons are clicked)
    const blockNavigation = (e) => {
      // This will stop the navigation from happening
      window.history.pushState(null, "", window.location.pathname);
      
      // Push one more state to ensure we have enough history entries
      window.history.pushState(null, "", window.location.pathname);
    };
    
    // Block Ctrl+W, Alt+F4, and other ways to close the window/tab
    const blockBeforeUnload = (e) => {
      if (!hasSubmitted) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };
    
    // Block keyboard shortcuts
    const blockKeys = (e) => {
      // Block Alt+Left, Alt+Right (browser navigation keys)
      if (e.altKey && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      
      // Block Backspace outside of input fields (which triggers back navigation)
      if (e.key === "Backspace" && 
          e.target.tagName !== "INPUT" && 
          e.target.tagName !== "TEXTAREA" && 
          !e.target.isContentEditable) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };
    
    // Register all event listeners
    window.addEventListener("popstate", blockNavigation);
    window.addEventListener("beforeunload", blockBeforeUnload);
    window.addEventListener("keydown", blockKeys, true);
    
    // Periodically push state to ensure back button is always disabled
    const intervalId = setInterval(() => {
      window.history.pushState(null, "", window.location.pathname);
    }, 300);
    
    return () => {
      // Clean up all event listeners when component unmounts
      window.removeEventListener("popstate", blockNavigation);
      window.removeEventListener("beforeunload", blockBeforeUnload);
      window.removeEventListener("keydown", blockKeys, true);
      clearInterval(intervalId);
    };
  }, [hasSubmitted]);

    // Register the attempt on the server before the exam can be taken. The server
    // enforces the attempt limit and blocks users with an unsubmitted attempt.
    const startedQuizRef = useRef(null);
    useEffect(() => {
      const quizId = questionsData?.data?.[0]?.id;
      if (!quizId || startedQuizRef.current === quizId) return;
      startedQuizRef.current = quizId;
      startAttemptQuiz({ document_id: id, quiz_id: quizId })
        .unwrap()
        .then((response) => setAttemptInfo(response?.data || null))
        .catch((error) => setStartError(getErrorMessage(error, "This assessment cannot be started right now.")));
    }, [questionsData]);
  const handleConfirmExit = () => {
    setOpenConfirmModal(false);
    navigate("/trainingListing", { replace: true });
  };

  const handleCancelExit = () => {
    setOpenConfirmModal(false);
  };

  // useEffect(() => {
  //   if (questionsData?.data?.[0]) {
  //     console.log("Questions>>>>",questionsData)
  //     const quizData = questionsData.data[0];
      

  //     const shuffleArray = (array) => {
  //       let shuffled = [...array];
  //       for (let i = shuffled.length - 1; i > 0; i--) {
  //         const j = Math.floor(Math.random() * (i + 1));
  //         [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  //       }
  //       return shuffled;
  //     };

  //     const shuffledQuestions = shuffleArray(quizData.questions || []);
  
  //     setQuestions(shuffledQuestions);
  //     setPageCount(shuffledQuestions.length);
  //     setCounter(quizData.quiz_time * 60);
  
  //     const initialCorrectAnswers = shuffledQuestions.reduce((acc, item) => {
  //       acc[item.id] = (item.correct_answer || "").toLowerCase();
  //       return acc;
  //     }, {});
  //     setCorrectAnswers(initialCorrectAnswers);
  //     // const shuffledQuestions = shuffleArray(quizData.questions || []);

  //     // setQuestions(quizData.questions || []);
  //     // setPageCount(quizData.questions?.length || 0);
  //     // setCounter(quizData.quiz_time * 60);
      
  //     // const initialCorrectAnswers = (quizData.questions || []).reduce((acc, item) => {
  //     //   acc[item.id] = (item.correct_answer || "").toLowerCase();
  //     //   return acc;
  //     // }, {});

  //     // setCorrectAnswers(initialCorrectAnswers);
  //   }
  // }, [questionsData]);

  useEffect(() => {
    if (questionsData?.data?.[0]) {
      // console.log("Questions>>>>",questionsData)
      const quizData = questionsData.data[0];
      
      // Function to shuffle array
      const shuffleArray = (array) => {
        let shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
      };

      const getRandomQuestions = (allQuestions, numToSelect) => {
        // Make a copy to avoid modifying the original array
        const questionsCopy = [...allQuestions];
        
        // Shuffle the copy to randomize the order
        const shuffled = shuffleArray(questionsCopy);
        
        // Take the first numToSelect items
        return shuffled.slice(0, numToSelect);
      };
      const getQuestionsByMarks = (allQuestions, marksBreakdown) => {
      let selectedQuestions = [];
      
      // Process each mark category from the marks_breakdown
      for (const [mark, count] of Object.entries(marksBreakdown)) {
        const markValue = parseInt(mark);
        const requiredCount = parseInt(count);
        
        // Filter questions with the current mark value
        const questionsWithThisMark = allQuestions.filter(q => q.marks === markValue);
        
        // Shuffle these questions to randomize selection
        const shuffledQuestions = shuffleArray(questionsWithThisMark);
        
        // Take only the required number of questions (or all available if less than required)
        const availableCount = Math.min(requiredCount, shuffledQuestions.length);
        const selectedQuestionsForMark = shuffledQuestions.slice(0, availableCount);
        
        // Add to our selected questions array
        selectedQuestions = [...selectedQuestions, ...selectedQuestionsForMark];
        
        console.log(`Selected ${selectedQuestionsForMark.length} questions with ${markValue} mark(s) (requested: ${requiredCount})`);
      }
      
      return selectedQuestions;
    };
      // Determine the questions to display based on quiz_type
      let questionsToDisplay;
            
      if (quizData.quiz_type === "auto" && quizData.total_questions) {
        // For 'auto' type, select random questions based on total_questions count
        const allQuestions = quizData.questions || [];
        const numQuestionsToSelect = Math.min(quizData.total_questions, allQuestions.length);
        // Get random questions
        // questionsToDisplay = getRandomQuestions(allQuestions, numQuestionsToSelect);
        questionsToDisplay = getQuestionsByMarks(quizData.questions || [],quizData.marks_breakdown);
        
        console.log(`Selected ${questionsToDisplay.length} random questions out of ${allQuestions.length}`);
      } else {
        // For 'manual' type or any other case, use all questions but shuffle them
        questionsToDisplay = shuffleArray(quizData.questions || []);
      }
      
      setQuestions(questionsToDisplay);
      setPageCount(questionsToDisplay.length);
      setCounter(quizData.quiz_time * 60);
  
      const initialCorrectAnswers = questionsToDisplay.reduce((acc, item) => {
        acc[item.id] = (item.correct_answer || "").toLowerCase();
        return acc;
      }, {});
      setCorrectAnswers(initialCorrectAnswers);
    }
  }, [questionsData]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes} minutes, ${secs} seconds`;
  };

  const handlePageChange = (event, page) => {
    setCurrentPage(page);
  };

  const handleAnswerChange = (questionId, answer) => {
    if (!hasSubmitted) {
      setAnswers(prev => ({
        ...prev,
        [questionId]: answer.toLowerCase(),
      }));
    }
  };

  const calculateResults = () => {
    let totalMarks = 0;
    let marksObtained = 0;
    const userResponseList = [];
    const incorrectList = [];
    const correctList = [];
    questions.forEach((question) => {
      totalMarks += question.marks;
      const userAnswer = (answers[question.id] || "").toLowerCase();
      const correctAnswer = correctAnswers[question.id] || "";
      userResponseList.push({
        question_id: question.id,
        question_text: question.question_text,
        user_answer: userAnswer || "No Answer",
        correct_answer: correctAnswer || "none"
      });

      if (userAnswer === correctAnswer) {
        marksObtained += question.marks;
        correctList.push({
          question_id: question.id,
          question_text: question.question_text,
          user_answer: userAnswer || "No Answer",
          correct_answer: correctAnswer || "none"
        })
      } else {
        incorrectList.push({
          question_id: question.id,
          question_text: question.question_text,
          user_answer: userAnswer || "No Answer",
          correct_answer: correctAnswer || "none"
        })
      }
    });
    
    return {
      totalMarks,
      marksObtained,
      userResponseList,
      timeTaken: questionsData.data[0].quiz_time * 60 - counter,
      incorrectList,
      correctList
    };
  };

  const handleSubmit = async() => {
    if (hasSubmitted) return;

    const results = calculateResults();

    const quizPayload = {
      document_id: id,
      quiz_id: quiz_id,
      // Marks and pass/fail are computed by the server from the answer key.
      questions: results.userResponseList,
      total_taken_time: results.timeTaken,
    };
    setHasSubmitted(true);

    try {
      const response = await attemptQuiz(quizPayload).unwrap();
      const result = response?.data || {};
      const statusMessage = result.is_pass
        ? "Congratulations! You have passed."
        : "Unfortunately, you have not passed this attempt.";
      const attemptsLine = result.max_attempts ? `\nAttempt ${result.attempt} of ${result.max_attempts}.` : "";
      setResultMessage(
        `${statusMessage} You scored ${result.obtained_marks} out of ${result.total_marks} marks.\nTime taken: ${formatTime(results.timeTaken)}${attemptsLine}`
      );
    } catch (error) {
      setResultMessage(getErrorMessage(error, "Your answers could not be submitted. Please contact the administrator."));
    }
    setOpenModal(true);
  };

  const handleModalClose = () => {
    setOpenModal(false);
    navigate("/trainingListing", { replace: true });
  };

  if (isLoading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (startError) {
    return (
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="100vh" gap={2}>
        <p>{startError}</p>
        <MDButton variant="gradient" color="info" onClick={() => navigate("/trainingListing", { replace: true })}>
          Back to trainings
        </MDButton>
      </Box>
    );
  }

  if (isError || !id || questions.length === 0) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
      >
        <p>No questions available or an error occurred.</p>
      </Box>
    );
  }

  const isQuizComplete = Object.keys(answers).length === questions.length;

  return (
    <Container maxWidth="md" sx={{ mt: 12, mb: 4 }}>
      <Box 
        sx={{ 
          bgcolor: 'background.paper',
          borderRadius: 1,
          p: 2.5,
          boxShadow: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 2
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <CounterIndicator
            counter={counter}
            setCounter={setCounter}
            timerLimit={questionsData.data[0].quiz_time * 60}
            handleSubmit={handleSubmit}
          />
          {attemptInfo?.max_attempts && (
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Attempt {attemptInfo.attempt} of {attemptInfo.max_attempts}
            </Typography>
          )}
          <MDButton
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            sx={{ height: "30px" }}
            disabled={!isQuizComplete || hasSubmitted}
          >
            {hasSubmitted ? 'Submitted' : 'Submit'}
          </MDButton>
        </Box>

        {questions[currentPage - 1] && (
          <QuestionSection
            question={questions[currentPage - 1]}
            questionIndex={currentPage}
            pageCount={pageCount}
            onAnswerChange={handleAnswerChange}
            answers={answers}
            disabled={hasSubmitted}
          />
        )}

        <Box sx={{ display: 'flex', justifyContent: 'center', my: 2.5 }}>
          <Stack spacing={2}>
            <Pagination
              onChange={handlePageChange}
              count={pageCount}
              page={currentPage}
              variant="outlined"
              size="large"
              color="primary"
              shape="rounded"
            />
          </Stack>
        </Box>

        {/* Results Modal */}
        <Dialog open={openModal} onClose={handleModalClose}>
          <DialogTitle>Quiz Results</DialogTitle>
          <DialogContent>
            <p>{resultMessage}</p>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleModalClose} color="primary">
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* Exit Confirmation Modal */}
        <Dialog open={openConfirmModal} onClose={handleCancelExit}>
          <DialogTitle>Are you sure you want to exit?</DialogTitle>
          <DialogContent>
            <p>Your progress will be lost and your answers won&apos;t be saved.</p>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCancelExit} color="primary">
              Continue Quiz
            </Button>
            <Button onClick={handleConfirmExit} color="error">
              Exit Quiz
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
}

// Add this to ensure back button is disabled immediately
// when the file is loaded, before the component mounts
if (typeof window !== 'undefined') {
  window.history.pushState(null, "", window.location.pathname);
  window.history.pushState(null, "", window.location.pathname);
  window.addEventListener("popstate", function() {
    window.history.pushState(null, "", window.location.pathname);
  });
}

export default MultiChoiceQuestionsSection;