import React from 'react';
import { useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();

  const handleStartChat = () => {
    navigate('/chat');
  };

  return (
    <div className="container text-center mt-5">
      <h1>Welcome to ChatterSnap!</h1>
      <p>Click below to start a random chat.</p>
      <button className="btn btn-primary" onClick={handleStartChat}>
        Start Chatting
      </button>
    </div>
  );
}

export default Home;
