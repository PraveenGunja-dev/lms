import React from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, Paper, TextField } from '@mui/material';

function QuestionSection({ question, questionIndex, pageCount, onAnswerChange, answers, disabled }) {
    if (!question) return null;

    const { id, question_text, options, question_type, selected_file_type, selected_file } = question;

    const handleOptionClick = (option) => {
        if (!disabled) {
            onAnswerChange(id, option.trim());
        }
    };

    const renderQuestionMedia = () => {
        if (selected_file_type === "image" && selected_file) {
            return (
                <Box sx={{ my: 2, textAlign: 'center' }}>
                    <img 
                        src={selected_file} 
                        alt="Question media" 
                        style={{ 
                            maxWidth: '100%', 
                            maxHeight: '500px',
                            borderRadius: '8px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }} 
                    />
                </Box>
            );
        }
        return null;
    };

    const renderOptions = () => {
        if (question_type === 'MCQ' || question_type === 'True/False' || !question_type) {
            // Safely parse options and handle potential empty strings
            const parsedOptions = options
                ? options.split(',').map(opt => opt.trim()).filter(opt => opt)
                : [];

            return (
                <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: 2,
                    p: 1.5
                }}>
                    {parsedOptions.map((option, index) => {
                        const isSelected = answers[id]?.toLowerCase() === option.toLowerCase();
                        
                        return (
                            <Paper
                                key={`${id}-${index}`}
                                elevation={isSelected ? 2 : 1}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1.5,
                                    p: 1,
                                    cursor: disabled ? 'default' : 'pointer',
                                    bgcolor: isSelected ? 'primary.light' : 'background.paper',
                                    color: isSelected ? 'primary.contrastText' : 'text.primary',
                                    '&:hover': {
                                        bgcolor: disabled ? 
                                            (isSelected ? 'primary.light' : 'background.paper') 
                                            : (isSelected ? 'primary.light' : 'action.hover')
                                    },
                                    transition: 'background-color 0.2s',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                                onClick={() => handleOptionClick(option)}
                            >
                                <Typography 
                                    sx={{ 
                                        fontWeight: isSelected ? 600 : 400,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1
                                    }}
                                >
                                    <span style={{ minWidth: '24px' }}>
                                        {String.fromCharCode(65 + index)}.
                                    </span>
                                    {option}
                                </Typography>
                            </Paper>
                        );
                    })}
                </Box>
            );
        } else if (question_type === 'Fill in the blank') {
            return (
                <TextField
                    fullWidth
                    placeholder="Your answer"
                    value={answers[id] || ''}
                    onChange={(e) => onAnswerChange(id, e.target.value)}
                    disabled={disabled}
                    variant="outlined"
                    sx={{ mt: 2 }}
                />
            );
        }
        return null;
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>
                <Typography 
                    variant="subtitle1" 
                    color="text.secondary"
                    fontWeight={600}
                    gutterBottom
                >
                    Question {questionIndex} of {pageCount}
                </Typography>
                <Typography 
                    variant="h5" 
                    color="text.primary"
                    fontWeight={500}
                >
                    {question_text}
                </Typography>
                {renderQuestionMedia()}
            </Box>
            {renderOptions()}
        </Box>
    );
}

QuestionSection.propTypes = {
    question: PropTypes.shape({
        id: PropTypes.number.isRequired,
        question_text: PropTypes.string.isRequired,
        options: PropTypes.string,
        question_type: PropTypes.string,
        selected_file_type: PropTypes.string,
        selected_file: PropTypes.string
    }),
    questionIndex: PropTypes.number.isRequired,
    pageCount: PropTypes.number.isRequired,
    onAnswerChange: PropTypes.func.isRequired,
    answers: PropTypes.object.isRequired,
    disabled: PropTypes.bool
};

QuestionSection.defaultProps = {
    disabled: false
};

export default QuestionSection;