import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import './ChatRoom.css';

const socket = io('http://localhost:5000'); // Placeholder backend URL

function ChatRoom() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    socket.on('message', (message) => {
      setMessages((prev) => [...prev, message]);
    });
  }, []);

  const sendMessage = () => {
    socket.emit('message', input);
    setInput('');
  };

  return (
    <div className="container mt-5">
      <h2>Chat Room</h2>
      <div className="chat-box">
        {messages.map((msg, index) => (
          <p key={index}>{msg}</p>
        ))}
      </div>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type a message..."
        className="form-control"
      />
      <button className="btn btn-success mt-2" onClick={sendMessage}>
        Send
      </button>
    </div>
  );
}

export default ChatRoom;
