import React, { useEffect, useRef } from 'react';
import io from 'socket.io-client';

const SIGNALING_URL = 'http://localhost:5000';
const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  // { urls: 'turn:your-turn-server.com', username: 'user', credential: 'pass' },
];

interface StudentExamProps {
  jwt: string;
  roomId: string;
}

export default function StudentExam({ jwt, roomId }: StudentExamProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const socketRef = useRef<any>();
  const pcRef = useRef<any>();
  const remotePcRef = useRef<any>();

  useEffect(() => {
    socketRef.current = io(SIGNALING_URL, { auth: { token: jwt } });
    socketRef.current.emit('join-room', { roomId, role: 'student' });

    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
      if (videoRef.current) videoRef.current.srcObject = stream;
      pcRef.current = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      stream.getTracks().forEach(track => pcRef.current.addTrack(track, stream));

      pcRef.current.onicecandidate = ({ candidate }: any) => {
        if (candidate) socketRef.current.emit('signal', { roomId, data: { candidate } });
      };
      pcRef.current.createOffer().then((offer: any) => {
        pcRef.current.setLocalDescription(offer);
        socketRef.current.emit('signal', { roomId, data: { sdp: offer } });
      });

      socketRef.current.on('signal', ({ data }: any) => {
        if (data.sdp && data.sdp.type === 'answer') pcRef.current.setRemoteDescription(new RTCSessionDescription(data.sdp));
        if (data.candidate) pcRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
      });

      // Two-way: Listen for admin's offer
      socketRef.current.on('signal', async ({ from, data }: any) => {
        if (data.sdp && data.sdp.type === 'offer') {
          remotePcRef.current = new RTCPeerConnection({ iceServers: ICE_SERVERS });
          remotePcRef.current.ontrack = (event: any) => {
            if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
          };
          remotePcRef.current.onicecandidate = (event: any) => {
            if (event.candidate) socketRef.current.emit('signal', { roomId, data: { candidate: event.candidate }, to: from });
          };
          await remotePcRef.current.setRemoteDescription(new RTCSessionDescription(data.sdp));
          const answer = await remotePcRef.current.createAnswer();
          await remotePcRef.current.setLocalDescription(answer);
          socketRef.current.emit('signal', { roomId, data: { sdp: answer }, to: from });
        }
        if (data.candidate && remotePcRef.current) remotePcRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
      });

      // Proctor controls
      socketRef.current.on('proctor-action', ({ action }: any) => {
        if (action === 'mute') stream.getAudioTracks().forEach(t => t.enabled = false);
        if (action === 'unmute') stream.getAudioTracks().forEach(t => t.enabled = true);
        if (action === 'pause') stream.getVideoTracks().forEach(t => t.enabled = false);
        if (action === 'resume') stream.getVideoTracks().forEach(t => t.enabled = true);
        if (action === 'remove') window.location.href = '/removed';
      });
    });

    return () => {
      socketRef.current.disconnect();
      if (pcRef.current) pcRef.current.close();
      if (remotePcRef.current) remotePcRef.current.close();
    };
  }, [jwt, roomId]);

  return (
    <div>
      <div>Student Camera/Audio (You):</div>
      <video ref={videoRef} autoPlay playsInline muted className="w-64 h-48 bg-black" />
      <div>Proctor Camera/Audio:</div>
      <video ref={remoteVideoRef} autoPlay playsInline className="w-64 h-48 bg-black" />
    </div>
  );
}
