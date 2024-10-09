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
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import axios from "axios"; // Import Axios

const ChatBot = () => {
    const [chatHistory, setChatHistory] = useState([
        { user: "bot", message: "Hi! How can I help you today?" },
    ]);
    const [inputValue, setInputValue] = useState("");
    const [autoCompleteOptions, setAutoCompleteOptions] = useState([]);

    const chatContainerRef = useRef(null);

    // Fetch autocomplete options from the API when the component mounts
    useEffect(() => {
        fetchAutocompleteOptions();
    }, []);

    // Automatically scroll to the bottom when a new message is added
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatHistory]);

    // Fetch the autocomplete options from an API
    const fetchAutocompleteOptions = async () => {
        try {
            const response = await axios.get("https://example.com/api/autocomplete-options");
            setAutoCompleteOptions(response.data.options); // Assuming the response is { options: [...] }
        } catch (error) {
            console.error("Error fetching autocomplete options:", error);
        }
    };

    // Send the message to an API and get the bot response
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

            // Send the user message to the API and get the bot response
            try {
                const response = await axios.post("https://example.com/api/send-message", {
                    message: messageToSend,
                });

                const botResponse = response.data.response; // Assuming the API returns { response: "..." }

                // Add bot response to chat history
                setChatHistory((prevHistory) => [
                    ...prevHistory,
                    { user: "bot", message: botResponse },
                ]);
            } catch (error) {
                console.error("Error sending message:", error);
            }
        }
    };

    // Handle key press events
    const handleKeyPress = (event) => {
        if (event.key === "Enter") {
            event.preventDefault(); // Prevent form submission
            handleSend(); // Call the send function
        }
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
