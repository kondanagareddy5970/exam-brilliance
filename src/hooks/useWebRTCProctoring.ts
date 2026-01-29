import { useState, useEffect, useRef } from "react";
import { useWebRTC } from "@/hooks/useWebRTC";
import { supabase } from "@/integrations/supabase/client";

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
  createOffer: (userId: string) => Promise<void>;
  handleOffer: (userId: string, offer: RTCSessionDescriptionInit) => Promise<void>;
  handleAnswer: (userId: string, answer: RTCSessionDescriptionInit) => Promise<void>;
  handleIceCandidate: (userId: string, candidate: RTCIceCandidateInit) => Promise<void>;
}

export const useWebRTCProctoring = (examCode: string, userId: string, isAdmin: boolean = false) => {
  const webrtc = useWebRTC();
  const [connectedUsers, setConnectedUsers] = useState<Set<string>>(new Set());
  const [signalingChannel, setSignalingChannel] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize signaling channel
  useEffect(() => {
    if (!examCode || !userId) return;

    const channel = supabase
      .channel(`webrtc-${examCode}`)
      .on('broadcast', { event: 'signaling' }, (payload) => {
        handleSignalingMessage(payload.payload);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsInitialized(true);
          console.log('WebRTC signaling channel established for exam:', examCode);
        }
      });

    setSignalingChannel(channel);

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [examCode, userId]);

  // Send signaling message through Supabase
  const sendSignalingMessage = (targetUserId: string, message: any) => {
    if (!signalingChannel) return;

    const payload = {
      from: userId,
      to: targetUserId,
      examCode,
      message,
      timestamp: Date.now()
    };

    signalingChannel.send({
      event: 'signaling',
      payload
    });
  };

  // Handle incoming signaling messages
  const handleSignalingMessage = (payload: any) => {
    // Handle messages sent to 'all' or specifically to this user
    if (payload.to !== 'all' && payload.to !== userId) return;

    const { from, message } = payload;
    console.log(`[${isAdmin ? 'Admin' : 'Student'}] Received signaling from ${from}:`, message);

    switch (message.type) {
      case 'offer':
        webrtc.handleOffer(from, message.offer);
        break;
      case 'answer':
        webrtc.handleAnswer(from, message.answer);
        break;
      case 'ice-candidate':
        webrtc.handleIceCandidate(from, message.candidate);
        break;
      case 'user-joined':
        if (isAdmin && from !== userId) {
          // Admin creates offer when student joins
          console.log(`Admin detected student ${from} joined, creating offer...`);
          setTimeout(() => {
            webrtc.createOffer(from);
          }, 1000);
        }
        break;
      case 'user-left':
        console.log(`User ${from} left the session`);
        webrtc.removeRemoteStream(from);
        break;
    }
  };

  // Start streaming and announce presence
  const startStreaming = async () => {
    try {
      console.log(`[${isAdmin ? 'Admin' : 'Student'}] Starting WebRTC setup for exam: ${examCode}, userId: ${userId}`);
      await webrtc.startLocalStream();
      
      // Announce that user has joined
      if (signalingChannel) {
        const joinPayload = {
          from: userId,
          to: 'all',
          examCode,
          message: {
            type: 'user-joined',
            userId,
            isAdmin
          },
          timestamp: Date.now()
        };
        
        console.log(`[${isAdmin ? 'Admin' : 'Student'}] Broadcasting join message:`, joinPayload);
        
        signalingChannel.send({
          event: 'signaling',
          payload: joinPayload
        });
      }

      console.log(`[${isAdmin ? 'Admin' : 'Student'}] Streaming started successfully for exam: ${examCode}`);
    } catch (error) {
      console.error(`[${isAdmin ? 'Admin' : 'Student'}] Failed to start streaming:`, error);
      throw error;
    }
  };

  // Stop streaming and announce departure
  const stopStreaming = () => {
    webrtc.stopLocalStream();
    
    // Announce that user is leaving
    if (signalingChannel) {
      signalingChannel.send({
        event: 'signaling',
        payload: {
          from: userId,
          to: 'all',
          examCode,
          message: {
            type: 'user-left',
            userId,
            isAdmin
          },
          timestamp: Date.now()
        }
      });
    }

    console.log(`${isAdmin ? 'Admin' : 'Student'} stopped streaming for exam:`, examCode);
  };

  // Override WebRTC methods to use Supabase signaling
  const createOffer = async (targetUserId: string) => {
    const pc = webrtc.peerConnections.get(targetUserId) || webrtc.createPeerConnection(targetUserId);
    
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      sendSignalingMessage(targetUserId, {
        type: 'offer',
        offer: offer
      });
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  };

  const handleOffer = async (fromUserId: string, offer: RTCSessionDescriptionInit) => {
    const pc = webrtc.peerConnections.get(fromUserId) || webrtc.createPeerConnection(fromUserId);
    
    try {
      await pc.setRemoteDescription(offer);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      
      sendSignalingMessage(fromUserId, {
        type: 'answer',
        answer: answer
      });
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  };

  const handleAnswer = async (fromUserId: string, answer: RTCSessionDescriptionInit) => {
    const pc = webrtc.peerConnections.get(fromUserId);
    
    if (pc) {
      try {
        await pc.setRemoteDescription(answer);
      } catch (error) {
        console.error('Error handling answer:', error);
      }
    }
  };

  const handleIceCandidate = async (fromUserId: string, candidate: RTCIceCandidateInit) => {
    const pc = webrtc.peerConnections.get(fromUserId);
    
    if (pc) {
      try {
        await pc.addIceCandidate(candidate);
      } catch (error) {
        console.error('Error adding ICE candidate:', error);
      }
    }
  };

  // Update connected users when remote streams change
  useEffect(() => {
    const users = new Set(webrtc.remoteStreams.keys());
    setConnectedUsers(users);
  }, [webrtc.remoteStreams]);

  return {
    ...webrtc,
    connectedUsers,
    isInitialized,
    startStreaming,
    stopStreaming,
    createOffer,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
  };
};
