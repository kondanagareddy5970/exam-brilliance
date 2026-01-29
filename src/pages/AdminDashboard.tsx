import React, { useRef, useEffect, useState } from 'react';
import io from 'socket.io-client';

const SIGNALING_URL = 'http://localhost:5000';
const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  // { urls: 'turn:your-turn-server.com', username: 'user', credential: 'pass' },
];

interface AdminDashboardProps {
  jwt: string;
  roomId: string;
}

export default function AdminDashboard({ jwt, roomId }: AdminDashboardProps) {
  const [students, setStudents] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const socketRef = useRef<any>();
  const pcRef = useRef<any>();
  const remotePcRef = useRef<any>();

  useEffect(() => {
    socketRef.current = io(SIGNALING_URL, { auth: { token: jwt } });
    socketRef.current.emit('join-room', { roomId, role: 'admin' });

    socketRef.current.on('user-joined', ({ userId, role }: any) => {
      if (role === 'student') setStudents(prev => prev.includes(userId) ? prev : [...prev, userId]);
    });
    socketRef.current.on('user-left', ({ userId }: any) => {
      setStudents(prev => prev.filter(id => id !== userId));
      if (selected === userId) setSelected(null);
    });

    // Listen for offer from student (receive student's stream)
    socketRef.current.on('signal', async ({ from, data }: any) => {
      if (selected !== from) return;
      if (data.sdp && data.sdp.type === 'offer') {
        pcRef.current = new RTCPeerConnection({ iceServers: ICE_SERVERS });
        pcRef.current.ontrack = (e: any) => { if (videoRef.current) videoRef.current.srcObject = e.streams[0]; };
        pcRef.current.onicecandidate = ({ candidate }: any) => {
          if (candidate) socketRef.current.emit('signal', { roomId, data: { candidate }, to: from });
        };
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(data.sdp));
        const answer = await pcRef.current.createAnswer();
        await pcRef.current.setLocalDescription(answer);
        socketRef.current.emit('signal', { roomId, data: { sdp: answer }, to: from });
      }
      if (data.candidate && pcRef.current) pcRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
    });

    // Two-way: send admin's stream to student
    if (selected) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
        remotePcRef.current = new RTCPeerConnection({ iceServers: ICE_SERVERS });
        stream.getTracks().forEach(track => remotePcRef.current.addTrack(track, stream));
        remotePcRef.current.onicecandidate = (event: any) => {
          if (event.candidate) socketRef.current.emit('signal', { roomId, data: { candidate: event.candidate }, to: selected });
        };
        remotePcRef.current.createOffer().then((offer: any) => {
          remotePcRef.current.setLocalDescription(offer);
          socketRef.current.emit('signal', { roomId, data: { sdp: offer }, to: selected });
        });
        socketRef.current.on('signal', ({ from, data }: any) => {
          if (from !== selected) return;
          if (data.sdp && data.sdp.type === 'answer') remotePcRef.current.setRemoteDescription(new RTCSessionDescription(data.sdp));
          if (data.candidate) remotePcRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        });
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = stream;
      });
    }

    return () => {
      socketRef.current.disconnect();
      if (pcRef.current) pcRef.current.close();
      if (remotePcRef.current) remotePcRef.current.close();
    };
  }, [jwt, roomId, selected]);

  const handleProctorAction = (action: string) => {
    if (selected) socketRef.current.emit('proctor-action', { roomId, action, targetId: selected });
  };

  return (
    <div>
      <ul>
        {students.map(id => (
          <li key={id}>
            {id}
            <button onClick={() => setSelected(id)}>View</button>
          </li>
        ))}
      </ul>
      <div>Student Camera/Audio:</div>
      <video ref={videoRef} autoPlay playsInline className="w-64 h-48 bg-black" />
      <div>Proctor Camera/Audio (You):</div>
      <video ref={remoteVideoRef} autoPlay playsInline muted className="w-64 h-48 bg-black" />
      <button onClick={() => handleProctorAction('mute')}>Mute</button>
      <button onClick={() => handleProctorAction('unmute')}>Unmute</button>
      <button onClick={() => handleProctorAction('pause')}>Pause Video</button>
      <button onClick={() => handleProctorAction('resume')}>Resume Video</button>
      <button onClick={() => handleProctorAction('remove')}>Remove Student</button>
    </div>
  );
}
