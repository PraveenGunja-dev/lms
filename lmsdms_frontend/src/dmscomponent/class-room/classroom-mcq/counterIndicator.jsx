import React, { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { Box, Typography } from "@mui/material";

function CounterIndicator({ counter, setCounter, timerLimit, handleSubmit }) {
    const timerRef = useRef(null);

    useEffect(() => {
        if (counter <= 0) {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
            handleSubmit();
            return;
        }

        timerRef.current = setInterval(() => {
            setCounter(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [counter, setCounter, handleSubmit]);

    const formatTime = (seconds) => {
        const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
        const secs = String(seconds % 60).padStart(2, "0");
        return `${minutes}:${secs}`;
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Typography variant="body2">
                Time Remaining
            </Typography>
            <Box
                sx={{
                    width: 100,
                    height: 36,
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24,
                    fontWeight: 600,
                    bgcolor: counter === 0 ? 'error.main' : 'background.paper',
                    color: counter === 0 ? 'white' : 'text.primary',
                    border: 1,
                    borderColor: 'divider'
                }}
            >
                {formatTime(counter)}
            </Box>
        </Box>
    );
}

CounterIndicator.propTypes = {
    counter: PropTypes.number.isRequired,
    setCounter: PropTypes.func.isRequired,
    timerLimit: PropTypes.number.isRequired,
    handleSubmit: PropTypes.func.isRequired,
};

export default CounterIndicator;