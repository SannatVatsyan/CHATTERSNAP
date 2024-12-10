import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import SimplePeer from 'simple-peer';
import '../styles/ChatRoom.css';

const socket = io('http://localhost:5000');

function ChatRoom() {
  const [stream, setStream] = useState(null);
  const [peer, setPeer] = useState(null);
  const [isMatched, setIsMatched] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const videoRef = useRef();
  const remoteVideoRef = useRef();

  useEffect(() => {
    // Check if mediaDevices and getUserMedia are supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMessage('Your browser does not support camera and microphone access.');
      return;
    }

    // Get media stream
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((currentStream) => {
        setStream(currentStream);
        if (videoRef.current) {
          videoRef.current.srcObject = currentStream;
        }
      })
      .catch((err) => {
        console.error("Error accessing media devices:", err.name, err.message);
        setErrorMessage(`Error accessing media devices: ${err.name} - ${err.message}`);
      });

    // Handle matching event
    socket.on('matched', (matchedUserId) => {
      setIsMatched(true);
      const newPeer = createPeer(matchedUserId, socket.id, stream);
      setPeer(newPeer);
    });

    // Handle receiving a call
    socket.on('receive-call', (signal) => {
      const newPeer = addPeer(signal, socket.id, stream);
      setPeer(newPeer);
    });

    // Handle call acceptance
    socket.on('call-accepted', (signal) => {
      if (peer) peer.signal(signal);
    });

    // Cleanup socket listeners on unmount
    return () => {
      socket.off('matched');
      socket.off('receive-call');
      socket.off('call-accepted');
      if (peer) peer.destroy();
    };
  }, [stream, peer]);

  const createPeer = (userToSignal, callerId, stream) => {
    const newPeer = new SimplePeer({
      initiator: true,
      trickle: false,
      stream,
    });

    newPeer.on('signal', (signal) => {
      socket.emit('send-signal', { userToSignal, callerId, signal });
    });

    newPeer.on('stream', (remoteStream) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    });

    return newPeer;
  };

  const addPeer = (incomingSignal, callerId, stream) => {
    const newPeer = new SimplePeer({
      initiator: false,
      trickle: false,
      stream,
    });

    newPeer.on('signal', (signal) => {
      socket.emit('accept-call', { signal, callerId });
    });

    newPeer.signal(incomingSignal);

    newPeer.on('stream', (remoteStream) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    });

    return newPeer;
  };

  return (
    <div className="container mt-5">
      <h2>Chat Room</h2>
      {errorMessage ? (
        <p className="error-message">{errorMessage}</p>
      ) : isMatched ? (
        <div className="video-container">
          <video playsInline muted ref={videoRef} autoPlay className="local-video" />
          <video playsInline ref={remoteVideoRef} autoPlay className="remote-video" />
        </div>
      ) : (
        <p>Waiting for a match...</p>
      )}
    </div>
  );
}

export default ChatRoom;
