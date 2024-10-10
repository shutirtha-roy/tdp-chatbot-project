import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import axios from 'axios';
function App() {
  const [message, setMessage] = useState(0)
  useEffect(() => {
    const fetchMessage = async () => {
      const response = await axios.get('http://127.0.0.1:8000/');
      setMessage(response.data.message);
    };
    fetchMessage();
  }, []);
  return (
    <>
      <div>
        <h1>React</h1>
        <p>{message}</p>
      </div>
    </>
  )
}

export default App
