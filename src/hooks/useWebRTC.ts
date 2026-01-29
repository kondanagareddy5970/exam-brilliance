import { useState, useEffect, useRef } from "react";

interface WebRTCManager {
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  peerConnections: Map<string, RTCPeerConnection>;
  isStreaming: boolean;
  startLocalStream: () => Promise<void>;
  stopLocalStream: () => void;
  createPeerConnection: (userId: string) => RTCPeerConnection;
  addRemoteStream: (userId: string, stream: MediaStream) => void;
  removeRemoteStream: (userId: string) => void;
  cleanup: () => void;
}

export const useWebRTC = (): WebRTCManager => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [peerConnections, setPeerConnections] = useState<Map<string, RTCPeerConnection>>(new Map());
  const [isStreaming, setIsStreaming] = useState(false);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const configuration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
    ]
  };

  // Start local video stream
  const startLocalStream = async (): Promise<void> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      setLocalStream(stream);
      setIsStreaming(true);

      // Set local video element source if available
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      console.log('Local stream started successfully');
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw new Error('Failed to access camera and microphone. Please ensure permissions are granted.');
    }
  };

  // Stop local video stream
  const stopLocalStream = (): void => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
      setIsStreaming(false);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }

      console.log('Local stream stopped');
    }
  };

  // Create peer connection for a specific user
  const createPeerConnection = (userId: string): RTCPeerConnection => {
    const pc = new RTCPeerConnection(configuration);

    // Add local stream to peer connection
    if (localStream) {
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });
    }

    // Handle incoming streams
    pc.ontrack = (event) => {
      const stream = event.streams[0];
      addRemoteStream(userId, stream);
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        // Send ICE candidate to signaling server
        sendSignalingMessage(userId, {
          type: 'ice-candidate',
          candidate: event.candidate
        });
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log(`Connection state for ${userId}:`, pc.connectionState);
      
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        removeRemoteStream(userId);
        pc.close();
        const newConnections = new Map(peerConnections);
        newConnections.delete(userId);
        setPeerConnections(newConnections);
      }
    };

    // Store peer connection
    const newConnections = new Map(peerConnections);
    newConnections.set(userId, pc);
    setPeerConnections(newConnections);

    return pc;
  };

  // Add remote stream
  const addRemoteStream = (userId: string, stream: MediaStream): void => {
    setRemoteStreams(prev => {
      const newStreams = new Map(prev);
      newStreams.set(userId, stream);
      return newStreams;
    });
  };

  // Remove remote stream
  const removeRemoteStream = (userId: string): void => {
    setRemoteStreams(prev => {
      const newStreams = new Map(prev);
      newStreams.delete(userId);
      return newStreams;
    });
  };

  // Send signaling message (to be implemented with actual signaling server)
  const sendSignalingMessage = (targetUserId: string, message: any): void => {
    // This will be implemented with WebSocket or Supabase real-time
    console.log('Sending signaling message to', targetUserId, ':', message);
    
    // For now, emit a custom event that can be caught by other components
    window.dispatchEvent(new CustomEvent('webrtc-signal', {
      detail: { targetUserId, message }
    }));
  };

  // Create offer for peer connection
  const createOffer = async (userId: string): Promise<void> => {
    const pc = peerConnections.get(userId) || createPeerConnection(userId);
    
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      sendSignalingMessage(userId, {
        type: 'offer',
        offer: offer
      });
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  };

  // Handle incoming offer
  const handleOffer = async (userId: string, offer: RTCSessionDescriptionInit): Promise<void> => {
    const pc = peerConnections.get(userId) || createPeerConnection(userId);
    
    try {
      await pc.setRemoteDescription(offer);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      
      sendSignalingMessage(userId, {
        type: 'answer',
        answer: answer
      });
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  };

  // Handle incoming answer
  const handleAnswer = async (userId: string, answer: RTCSessionDescriptionInit): Promise<void> => {
    const pc = peerConnections.get(userId);
    
    if (pc) {
      try {
        await pc.setRemoteDescription(answer);
      } catch (error) {
        console.error('Error handling answer:', error);
      }
    }
  };

  // Handle incoming ICE candidate
  const handleIceCandidate = async (userId: string, candidate: RTCIceCandidateInit): Promise<void> => {
    const pc = peerConnections.get(userId);
    
    if (pc) {
      try {
        await pc.addIceCandidate(candidate);
      } catch (error) {
        console.error('Error adding ICE candidate:', error);
      }
    }
  };

  // Listen for signaling messages
  useEffect(() => {
    const handleSignalingMessage = (event: CustomEvent) => {
      const { targetUserId, message } = event.detail;
      
      switch (message.type) {
        case 'offer':
          handleOffer(targetUserId, message.offer);
          break;
        case 'answer':
          handleAnswer(targetUserId, message.answer);
          break;
        case 'ice-candidate':
          handleIceCandidate(targetUserId, message.candidate);
          break;
      }
    };

    window.addEventListener('webrtc-signal', handleSignalingMessage as EventListener);
    
    return () => {
      window.removeEventListener('webrtc-signal', handleSignalingMessage as EventListener);
    };
  }, [peerConnections]);

  // Cleanup on unmount
  const cleanup = (): void => {
    stopLocalStream();
    
    // Close all peer connections
    peerConnections.forEach(pc => {
      pc.close();
    });
    setPeerConnections(new Map());
    
    // Clear remote streams
    remoteStreams.forEach(stream => {
      stream.getTracks().forEach(track => track.stop());
    });
    setRemoteStreams(new Map());
  };

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, []);

  return {
    localStream,
    remoteStreams,
    peerConnections,
    isStreaming,
    startLocalStream,
    stopLocalStream,
    createPeerConnection,
    addRemoteStream,
    removeRemoteStream,
    cleanup,
    // Additional methods for signaling
    createOffer,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
  } as WebRTCManager & {
    createOffer: (userId: string) => Promise<void>;
    handleOffer: (userId: string, offer: RTCSessionDescriptionInit) => Promise<void>;
    handleAnswer: (userId: string, answer: RTCSessionDescriptionInit) => Promise<void>;
    handleIceCandidate: (userId: string, candidate: RTCIceCandidateInit) => Promise<void>;
  };
};
