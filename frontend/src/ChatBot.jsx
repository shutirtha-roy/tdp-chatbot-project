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
import axios from 'axios';
import ChatIcon from "@mui/icons-material/Chat";

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

    // useEffect(() => {
    //     if (chatContainerRef.current) {
    //         chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    //     }
    // }, [chatHistory, isThinking]);

    useEffect(() => {
        const fetchAutoCompleteOptions = async () => {
            try {
                let chatHistoryFromCookie = ""; // Add logic to get chat history from cookie if needed
                const response = await axios.post('http://127.0.0.1:8000/similar-topics', { query: chatHistoryFromCookie });
                setAutoCompleteOptions(response.data.topics);
            } catch (error) {
                console.error("Error fetching autocomplete options:", error);
            }
        };

        fetchAutoCompleteOptions();
    }, []);

    useEffect(() => {
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

    const addTopic = async (topic) => {
        try {
            await fetch('http://127.0.0.1:8000/add-topic', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ topics: [topic] }),
            });
        } catch (error) {
            console.error('Error adding topic:', error);
        }
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
                await addTopic(message);

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
        <Box 
            sx={{ 
                width: "1000px", 
                margin: "0 auto", 
                display: "flex", 
                flexDirection: "column", 
                height: "90vh",
                bgcolor: '#fafafa'
            }}
        >
            <Typography 
                variant="h4" 
                align="center" 
                gutterBottom 
                sx={{ 
                    mt: 3,
                    mb: 4,
                    fontWeight: 'bold',
                    color: '#000000',
              
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 2,
                    padding: '8px 24px',
                    borderRadius: '4px',
                }}
            >
                <ChatIcon sx={{ mr: 1, fontSize: 40 }} color="black" />
                Swinburne Chatbot
            </Typography>
    
            <Paper
                ref={chatContainerRef}
                elevation={3}
                sx={{
                    flexGrow: 1,
                    overflowY: "auto",
                    p: 3,
                    display: "flex",
                    flexDirection: "column",
                    backgroundColor: "#ffffff",
                    borderRadius: 2,
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                }}
            >
                <List sx={{ width: '100%' }}>
                    {chatHistory.map((chat, index) => (
                        <ListItem
                            key={index}
                            sx={{
                                justifyContent: chat.user === "user" ? "flex-end" : "flex-start",
                                mb: 2,
                                px: 0
                            }}
                        >
                            <ListItemText
                                primary={chat.message}
                                sx={{
                                    textAlign: chat.user === "user" ? "right" : "left",
                                    backgroundColor: chat.user === "user" ? '#000' : '#f8f9fa',
                                    color: chat.user === "user" ? '#fff' : '#333333',
                                    borderRadius: 2,
                                    padding: 2,
                                    maxWidth: "70%",
                                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                                    '& .MuiTypography-root': {
                                        fontSize: '0.95rem',
                                        lineHeight: 1.5,
                                    },
                                    
                                }}
                            />
                        </ListItem>
                    ))}
                </List>
                {isThinking && <ThinkingIndicator />}
                {showSimilarQuestions && !isSearching && (
                    <Box sx={{ 
                        display: "flex", 
                        justifyContent: "center", 
                        mt: 3, 
                        flexWrap: "wrap",
                        gap: 1
                    }}>
                        {autoCompleteOptions.map((topic, index) => (
                            <Chip
                                key={index}
                                label={topic}
                                onClick={() => handleChipClick(topic)}
                                sx={{ 
                                    margin: 0.5,
                                    bgcolor: 'rgba(0, 0, 0, 0.1)', // Changed from red to black
                                    color: '#000000', // Changed to black
                                    border: '1px solid #000000', // Changed to black border
                                    '&:hover': {
                                        bgcolor: '#000000', // Changed hover background to black
                                        color: '#ffffff',
                                    },
                                    transition: 'all 0.2s ease-in-out',
                                    fontWeight: 500
                                }}
                            />
                        ))}
                    </Box>
                )}
            </Paper>
    
            <Box sx={{ 
                display: "flex", 
                width: "100%", 
                padding: 2,
                mt: 2
            }}>
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
