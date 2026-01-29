import { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const SIGNALING_SERVER_URL = "http://localhost:5000"; // Change if needed

const AdminStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [showLive, setShowLive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const socketRef = useRef<any>(null);
  const peerRef = useRef<any>(null);

  useEffect(() => {
    const fetchStudents = async () => {
      const { data, error } = await supabase.from("exam_sessions").select();
      // Group by user_id and get last exam
      const grouped = {};
      (data || []).forEach(row => {
        if (!grouped[row.user_id] || new Date(row.start_time) > new Date(grouped[row.user_id].start_time)) {
          grouped[row.user_id] = row;
        }
      });
      setStudents(Object.values(grouped));
      setLoading(false);
    };
    fetchStudents();
  }, []);

  // WebRTC logic for admin to view student
  useEffect(() => {
    if (!showLive || !selectedStudent) return;
    // Connect to signaling server
    if (!socketRef.current) {
      socketRef.current = io(SIGNALING_SERVER_URL);
    }
    // Join the student's exam room
    const room = `exam-${selectedStudent.exam_id}`;
    socketRef.current.emit('join', room);
    // Listen for offer from student
    socketRef.current.on('signal', async ({ from, data }) => {
      if (data.sdp && data.sdp.type === 'offer') {
        // Create peer connection
        const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
        peerRef.current = pc;
        pc.ontrack = (event) => {
          if (videoRef.current) {
            videoRef.current.srcObject = event.streams[0];
          }
        };
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            socketRef.current.emit('signal', { room, data: { candidate: event.candidate }, to: from });
          }
        };
        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socketRef.current.emit('signal', { room, data: { sdp: answer }, to: from });
      }
      if (data.candidate && peerRef.current) {
        peerRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    });
    return () => {
      if (peerRef.current) peerRef.current.close();
      if (socketRef.current) socketRef.current.disconnect();
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, [showLive, selectedStudent]);

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-card rounded shadow">
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest student submissions</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading...</div>
          ) : (
            <div className="space-y-4">
              {students.map((student, idx) => (
                <div key={idx} className="p-4 bg-muted rounded-lg flex justify-between items-center">
                  <div>
                    <div className="font-medium">{student.user_id}</div>
                    <div className="text-sm text-muted-foreground">{student.exam_title}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-xs text-muted-foreground">{student.score ?? "-"}%</div>
                    <button
                      className="ml-2 px-3 py-1 bg-primary text-white rounded hover:bg-primary/80"
                      onClick={() => { setSelectedStudent(student); setShowLive(true); }}
                    >
                      View Live
                    </button>
                  </div>
                </div>
              ))}
              {students.length === 0 && <div>No student activity found.</div>}
            </div>
          )}
          {showLive && selectedStudent && (
            <div className="mt-8">
              <div className="font-semibold mb-2">Live Video for {selectedStudent.user_id}</div>
              <video ref={videoRef} autoPlay playsInline controls={false} className="w-full max-w-md aspect-video bg-black rounded shadow" />
              <button
                className="mt-2 px-3 py-1 bg-destructive text-white rounded hover:bg-destructive/80"
                onClick={() => { setShowLive(false); setSelectedStudent(null); }}
              >
                Close
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminStudents;
