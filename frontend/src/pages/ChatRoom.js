import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import '../styles/ChatRoom.css';
import SimplePeer from 'simple-peer';

const socket = io('http://localhost:5000'); // Backend URL

function ChatRoom() {
  const [stream, setStream] = useState(null);
  const [peer, setPeer] = useState(null);
  const videoRef = useRef();
  const remoteVideoRef = useRef();

  useEffect(() => {
    // Get user's video/audio stream
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((currentStream) => {
        setStream(currentStream);
        videoRef.current.srcObject = currentStream;
      });

    socket.on('user-connected', (userId) => {
      const newPeer = createPeer(userId, socket.id, stream);
      setPeer(newPeer);
    });

    socket.on('receive-call', (signal) => {
      const newPeer = addPeer(signal, socket.id, stream);
      setPeer(newPeer);
    });

    socket.on('call-accepted', (signal) => {
      peer.signal(signal);
    });
  }, [stream]);

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
      remoteVideoRef.current.srcObject = remoteStream;
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
      remoteVideoRef.current.srcObject = remoteStream;
    });

    return newPeer;
  };

  return (
    <div className="container mt-5">
      <h2>Chat Room</h2>
      <div className="video-container">
        <video
          playsInline
          muted
          ref={videoRef}
          autoPlay
          className="local-video"
          onError={(e) => console.error("Local video error:", e)} // Error handling
        />
        <video
          playsInline
          ref={remoteVideoRef}
          autoPlay
          className="remote-video"
          onError={(e) => console.error("Remote video error:", e)} // Error handling
        />
      </div>
    </div>
  );
}

export default ChatRoom;