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
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";

const ChatBot = () => {
    const [chatHistory, setChatHistory] = useState([
        { user: "bot", message: "Hi! How can I help you today?" },
    ]);
    const [inputValue, setInputValue] = useState("");
    const [autoCompleteOptions, setAutoCompleteOptions] = useState([]);

    const chatContainerRef = useRef(null);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatHistory]);

    const handleSend = async () => {
        if (inputValue.trim() !== "") {
            const messageToSend = inputValue;
            setInputValue("");

            setChatHistory((prevHistory) => [
                ...prevHistory,
                { user: "user", message: messageToSend },
            ]);

            try {
                const response = await fetch('http://127.0.0.1:8000/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ query: messageToSend }),
                });

                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }

                const data = await response.json();

                setChatHistory((prevHistory) => [
                    ...prevHistory,
                    { user: "bot", message: data.answer },
                ]);

                // Update autoCompleteOptions with similar questions
                if (data.similar_questions) {
                    const newOptions = data.similar_questions.split('-').filter(q => q.trim() !== '');
                    setAutoCompleteOptions(newOptions);
                }
            } catch (error) {
                console.error('Error:', error);
                setChatHistory((prevHistory) => [
                    ...prevHistory,
                    { user: "bot", message: "Sorry, I encountered an error. Please try again later." },
                ]);
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
        handleSend();
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
            </Paper>

            <Box sx={{ display: "flex", width: "100%", padding: 0 }}>
                <Autocomplete
                    freeSolo
                    options={autoCompleteOptions}
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
                                        <IconButton onClick={handleSend}>
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