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
import axios from 'axios'; // Import Axios

const ChatBot = () => {
    const [chatHistory, setChatHistory] = useState([
        { user: "bot", message: "Hi! How can I help you today?" },
    ]);
    const [inputValue, setInputValue] = useState("");
    const [autoCompleteOptions, setAutoCompleteOptions] = useState([]);

    const chatContainerRef = useRef(null);

    // Automatically scroll to the bottom when a new message is added
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatHistory]);

    // Fetch autocomplete options on component mount
    useEffect(() => {
        const fetchAutoCompleteOptions = async () => {
            try {
                const response = await axios.get('/api/autocomplete'); // Replace with your API endpoint
                setAutoCompleteOptions(response.data); // Assuming response.data is an array of options
            } catch (error) {
                console.error("Error fetching autocomplete options:", error);
            }
        };

        fetchAutoCompleteOptions();
    }, []);

    const handleSend = async () => {
        if (inputValue.trim() !== "") {
            const messageToSend = inputValue; // Store the message to send
            // Clear the input value immediately
            setInputValue("");

            // Add user message to chat history
            setChatHistory((prevHistory) => [
                ...prevHistory,
                { user: "user", message: messageToSend },
            ]);

            try {
                const response = await axios.post('/api/send-message', { message: messageToSend }); // Replace with your API endpoint
                const botResponse = response.data.reply; // Assuming response.data contains the bot's reply
                setChatHistory((prevHistory) => [
                    ...prevHistory,
                    { user: "bot", message: botResponse },
                ]);
            } catch (error) {
                console.error("Error sending message:", error);
                // Optionally add error handling in the chat history
            }
        }
    };

    const handleSendFromRecommendation = async (topic) => {
        const messageToSend = topic; // Store the message to send
        console.log(messageToSend);
        // Clear the input value immediately
        setInputValue("");

        // Add user message to chat history
        setChatHistory((prevHistory) => [
            ...prevHistory,
            { user: "user", message: messageToSend },
        ]);

        try {
            const response = await axios.post('/api/send-message', { message: messageToSend }); // Replace with your API endpoint
            const botResponse = response.data.reply; // Assuming response.data contains the bot's reply
            setChatHistory((prevHistory) => [
                ...prevHistory,
                { user: "bot", message: botResponse },
            ]);
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    const handleKeyPress = (event) => {
        if (event.key === "Enter") {
            event.preventDefault(); // Prevent form submission
            handleSend(); // Call the send function
        }
    };

    // Function to handle chip click
    const handleChipClick = (topic) => {
        handleSendFromRecommendation(topic);
    };

    return (
        <Box sx={{ width: "1000px", margin: "0 auto", display: "flex", flexDirection: "column", height: "100vh" }}>
            {/* Chat history (auto-scroll to the bottom) */}
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
                {/* Recommendation Chips */}
                <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                    {autoCompleteOptions.map((topic) => (
                        <Chip
                            key={topic}
                            label={topic}
                            onClick={() => handleChipClick(topic)}
                            sx={{ margin: 1 }}
                        />
                    ))}
                </Box>
            </Paper>

            {/* Input section with Autocomplete and Send Button */}
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
                            onChange={(e) => setInputValue(e.target.value)} // Control the input change
                            onKeyPress={handleKeyPress} // Handle Enter key press
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
                                    width: "100%", // Ensure the TextField takes full width
                                },
                            }}
                        />
                    )}
                    sx={{
                        flexGrow: 1, // Makes sure the Autocomplete component takes up the remaining space
                    }}
                />
            </Box>
        </Box>
    );
};

export default ChatBot;
