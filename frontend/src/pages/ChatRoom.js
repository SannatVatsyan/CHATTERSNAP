import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import SimplePeer from 'simple-peer';
import '../styles/ChatRoom.css';

const socket = io('https://7a28-49-177-17-48.ngrok-free.app');

function ChatRoom() {
  const [stream, setStream] = useState(null);
  const [peer, setPeer] = useState(null);
  const [isMatched, setIsMatched] = useState(false);
  const videoRef = useRef();
  const remoteVideoRef = useRef();

  useEffect(() => {
    // Request camera and microphone access
    const getMedia = async () => {
      try {
        const currentStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setStream(currentStream);

        // Assign the local video stream
        if (videoRef.current) {
          videoRef.current.srcObject = currentStream;
        }
      } catch (error) {
        console.error('Error accessing media devices:', error);
        alert('Unable to access your camera or microphone. Please check your browser settings.');
      }
    };

    getMedia();

    // Handle matching event
    socket.on('matched', (matchedUserId) => {
        console.log('Matched with:', matchedUserId);
        setIsMatched(true);
        const newPeer = createPeer(matchedUserId, socket.id, stream);
        setPeer(newPeer);
      });
      
      socket.on('receive-call', ({ signal, callerId }) => {
        console.log('Receiving call from:', callerId);
        const newPeer = addPeer(signal, callerId, stream);
        setPeer(newPeer);
      });
      
      socket.on('call-accepted', (signal) => {
        console.log('Call accepted, signaling peer');
        if (peer) peer.signal(signal);
      });

    // Cleanup on unmount
    return () => {
      console.log('Cleaning up socket listeners and peer');
      socket.off('matched');
      socket.off('receive-call');
      socket.off('call-accepted');
      if (peer) peer.destroy();
    };
  }, [stream, peer]); 

  const createPeer = (userToSignal, callerId, stream) => {
    console.log('Creating peer for user:', userToSignal);
    const newPeer = new SimplePeer({
      initiator: true,
      trickle: false,
      stream,
    });
  
    newPeer.on('signal', (signal) => {
      console.log('Sending signal to:', userToSignal, signal);
      socket.emit('send-signal', { userToSignal, callerId, signal });
    });
  
    newPeer.on('stream', (remoteStream) => {
      console.log('Receiving remote stream:', remoteStream);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    });
  
    return newPeer;
  };
  
  const addPeer = (incomingSignal, callerId, stream) => {
    console.log('Adding peer for caller:', callerId);
    const newPeer = new SimplePeer({
      initiator: false,
      trickle: false,
      stream,
    });
  
    newPeer.on('signal', (signal) => {
      console.log('Responding with signal to caller:', callerId, signal);
      socket.emit('accept-call', { signal, callerId });
    });
  
    newPeer.signal(incomingSignal);
  
    newPeer.on('stream', (remoteStream) => {
      console.log('Receiving remote stream:', remoteStream);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    });
  
    return newPeer;
  };
  

  return (
    <div className="container mt-5">
      <h2>Chat Room</h2>
      {isMatched ? (
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
