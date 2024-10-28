import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import axios from 'axios';
import ChatBot from './Chatbot';
function App() {
    // const [message, setMessage] = useState(0)
    // useEffect(() => {
    //         const fetchMessage = async () => {
    //         const response = await axios.get('http://127.0.0.1:8000/');
    //         setMessage(response.data.message);
    //         };
    //         fetchMessage();
    // }, []);
return (
        <>
            <div className="App">
                <ChatBot />
            </div>
        </>
    )
}

export default App
