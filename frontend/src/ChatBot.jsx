import React, { useState, useRef, useEffect } from "react";
import {
    Box,
    List,
    ListItem,
    ListItemText,
    Paper,
    TextField,
    IconButton,
    InputAdornment,
    Autocomplete,
    Chip,
    Typography,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import MicIcon from "@mui/icons-material/Mic";
import { keyframes } from "@mui/system";

const pulseAnimation = keyframes`
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
`;

const ThinkingIndicator = () => (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', my: 2 }}>
        <Typography variant="body1" sx={{ mr: 1 }}>
            Swinburne Chatbot is thinking
        </Typography>
        {[0, 1, 2].map((i) => (
            <Typography
                key={i}
                variant="body1"
                component="span"
                sx={{
                    animation: `${pulseAnimation} 1.4s ease-in-out ${i * 0.2}s infinite`,
                    display: 'inline-block',
                    width: '4px',
                    height: '4px',
                    borderRadius: '50%',
                    backgroundColor: 'primary.main',
                    mx: 0.5,
                }}
            >
                .
            </Typography>
        ))}
    </Box>
);

const ChatBot = () => {
    const [chatHistory, setChatHistory] = useState([
        { user: "bot", message: "Welcome to Swinburne University! What information or assistance can I provide you with today?" },
    ]);
    const [inputValue, setInputValue] = useState("");
    const [autoCompleteOptions, setAutoCompleteOptions] = useState([]);
    const [showSimilarQuestions, setShowSimilarQuestions] = useState(true);
    const [isThinking, setIsThinking] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isSearching, setIsSearching] = useState(false);

    const chatContainerRef = useRef(null);
    const recognitionRef = useRef(null);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatHistory, isThinking]);

    useEffect(() => {
        // Initialize speech recognition
        if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setInputValue(transcript);
                handleSend(transcript);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
                setIsSearching(false);
            };
        }
    }, []);

    const cleanString = (str) => {
        let cleaned = str.replace(/^[^a-zA-Z0-9]+/, '');
        cleaned = cleaned.replace(/[^a-zA-Z0-9]+$/, '');
        if (str.trim().endsWith('?')) {
            cleaned += '?';
        }
        return cleaned.trim();
    };

    const handleSend = async (message = inputValue) => {
        if (message.trim() !== "") {
            setInputValue("");
            setShowSimilarQuestions(false);
            setIsThinking(true);
            setIsSearching(true);

            setChatHistory((prevHistory) => [
                ...prevHistory,
                { user: "user", message: message },
            ]);

            try {
                const response = await fetch('http://127.0.0.1:8000/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ query: message }),
                });

                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }

                const data = await response.json();

                setChatHistory((prevHistory) => [
                    ...prevHistory,
                    { user: "bot", message: data.answer },
                ]);

                if (data.similar_questions) {
                    const newOptions = data.similar_questions
                        .split('*')
                        .map(q => cleanString(q))
                        .filter(q => q.trim() !== '');
                    setAutoCompleteOptions(newOptions);
                    setShowSimilarQuestions(true);
                }
            } catch (error) {
                console.error('Error:', error);
                setChatHistory((prevHistory) => [
                    ...prevHistory,
                    { user: "bot", message: "Sorry, I encountered an error. Please try again later." },
                ]);
            } finally {
                setIsThinking(false);
                setIsSearching(false);
            }
        }
    };

    const handleKeyPress = (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            handleSend();
        }
    };

    const handleChipClick = (topic) => {
        setInputValue(topic);
        setShowSimilarQuestions(false);
        handleSend(topic);
    };

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current.stop();
        } else {
            recognitionRef.current.start();
            setIsListening(true);
            setIsSearching(true);
        }
    };

    return (
        <Box sx={{ width: "1000px", margin: "0 auto", display: "flex", flexDirection: "column", height: "90vh" }}>
            <Paper
                ref={chatContainerRef}
                sx={{
                    flexGrow: 1,
                    overflowY: "auto",
                    p: 2,
                    display: "flex",
                    flexDirection: "column",
                    backgroundColor: "#f5f5f5",
                }}
            >
                <List>
                    {chatHistory.map((chat, index) => (
                        <ListItem
                            key={index}
                            sx={{
                                justifyContent: chat.user === "user" ? "flex-end" : "flex-start",
                            }}
                        >
                            <ListItemText
                                primary={chat.message}
                                sx={{
                                    textAlign: chat.user === "user" ? "right" : "left",
                                    backgroundColor: chat.user === "user" ? "#e0f7fa" : "#eeeeee",
                                    borderRadius: 1,
                                    padding: 1,
                                    maxWidth: "80%",
                                }}
                            />
                        </ListItem>
                    ))}
                </List>
                {isThinking && <ThinkingIndicator />}
                {showSimilarQuestions && !isSearching && (
                    <Box sx={{ display: "flex", justifyContent: "center", mt: 2, flexWrap: "wrap" }}>
                        {autoCompleteOptions.map((topic, index) => (
                            <Chip
                                key={index}
                                label={topic}
                                onClick={() => handleChipClick(topic)}
                                sx={{ margin: 1 }}
                            />
                        ))}
                    </Box>
                )}
            </Paper>

            <Box sx={{ display: "flex", width: "100%", padding: 0 }}>
                <Autocomplete
                    freeSolo
                    options={isSearching ? [] : autoCompleteOptions}
                    inputValue={inputValue}
                    onInputChange={(event, newInputValue) => setInputValue(newInputValue)}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Type a message..."
                            variant="outlined"
                            fullWidth
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyPress={handleKeyPress}
                            InputProps={{
                                ...params.InputProps,
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton 
                                            onClick={toggleListening} 
                                            color={isListening ? "secondary" : "default"}
                                            disabled={isSearching && !isListening}
                                        >
                                            <MicIcon />
                                        </IconButton>
                                        <IconButton 
                                            onClick={() => handleSend()}
                                            disabled={isSearching}
                                        >
                                            <SendIcon />
                                        </IconButton>
                                    </InputAdornment>
                                ),
                                sx: {
                                    width: "100%",
                                },
                            }}
                        />
                    )}
                    sx={{
                        flexGrow: 1,
                    }}
                />
            </Box>
        </Box>
    );
};

export default ChatBot;