import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Camera, 
  Users, 
  AlertTriangle, 
  Shield, 
  Activity,
  Eye,
  EyeOff,
  Maximize2,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  Clock,
  CheckCircle,
  XCircle,
  LogOut,
  RefreshCw,
  Lock,
  Unlock,
  Monitor,
  User
} from "lucide-react";
import { AdminVideoFeed } from "@/components/admin/AdminVideoFeed";
import { useWebRTCProctoring } from "@/hooks/useWebRTCProctoring";

interface ProctoringSession {
  id: string;
  student_id: string;
  exam_id: string;
  exam_code: string;
  started_at: string;
  ended_at?: string;
  status: "active" | "completed" | "terminated";
  violation_count: number;
  last_activity: string;
}

interface ProctoringLog {
  id: string;
  session_id: string;
  student_id: string;
  event_type: "info" | "warning" | "violation";
  message: string;
  metadata?: Record<string, any>;
  created_at: string;
}

const AdminProctoringWithLiveVideo = () => {
  const [examCode, setExamCode] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessions, setSessions] = useState<ProctoringSession[]>([]);
  const [logs, setLogs] = useState<ProctoringLog[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fullscreenStudent, setFullscreenStudent] = useState<string | null>(null);

  // WebRTC proctoring hook
  const {
    remoteStreams,
    connectedUsers,
    isInitialized,
    startStreaming,
    stopStreaming,
    cleanup
  } = useWebRTCProctoring(examCode, `admin-${Date.now()}`, true);

  // Update connected users when remote streams change
  useEffect(() => {
    console.log(`[Admin] Connected users updated:`, Array.from(connectedUsers));
    console.log(`[Admin] Remote streams:`, Array.from(remoteStreams.keys()));
  }, [connectedUsers, remoteStreams]);

  // Fetch sessions and logs for a specific exam code
  const fetchProctoringData = async (code: string) => {
    try {
      setLoading(true);
      setError("");

      // Fetch exam sessions with the specific code
      const { data: sessionsData, error: sessionsError } = await supabase
        .from("exam_sessions")
        .select("*")
        .eq("exam_id", code)
        .order("start_time", { ascending: false });

      if (sessionsError) throw sessionsError;

      // Fetch security activity logs for this exam
      const { data: logsData, error: logsError } = await supabase
        .from("security_activity_logs")
        .select("*")
        .eq("exam_session_id", code)
        .order("occurred_at", { ascending: false })
        .limit(50);

      if (logsError) throw logsError;

      // Transform sessions data
      const transformedSessions: ProctoringSession[] = (sessionsData || []).map(session => ({
        id: session.id,
        student_id: session.user_id || "unknown",
        exam_id: session.exam_id,
        exam_code: code,
        started_at: session.start_time,
        ended_at: session.end_time,
        status: session.submission_status === "in_progress" ? "active" : 
                session.submission_status === "submitted" ? "completed" : "terminated",
        violation_count: session.violations_count || 0,
        last_activity: session.start_time,
      }));

      // Transform logs data
      const transformedLogs: ProctoringLog[] = (logsData || []).map(log => ({
        id: log.id,
        session_id: log.exam_session_id || "unknown",
        student_id: log.exam_session_id || "unknown",
        event_type: log.activity_type === "tab_switch" || log.activity_type === "window_focus_lost" 
          ? "warning" 
          : log.activity_type === "multiple_faces" 
          ? "violation" 
          : "info",
        message: log.details || log.activity_type,
        metadata: (log as any).metadata || {},
        created_at: log.occurred_at,
      }));

      setSessions(transformedSessions);
      setLogs(transformedLogs);

    } catch (err) {
      console.error("Error fetching proctoring data:", err);
      setError("Failed to load proctoring data. Please check the exam code.");
    } finally {
      setLoading(false);
    }
  };

  // Handle exam code authentication
  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examCode.trim()) {
      setError("Please enter an exam code");
      return;
    }

    // Simple validation - in production, verify against database
    const validCodes = ["workday", "math", "physics", "exam123", "test456"];
    if (!validCodes.includes(examCode.toLowerCase())) {
      setError("Invalid exam code. Please check and try again.");
      return;
    }

    setIsAuthenticated(true);
    await fetchProctoringData(examCode);
    
    // Start admin streaming
    try {
      await startStreaming();
      console.log(`[Admin] Admin streaming started for exam: ${examCode}`);
    } catch (err) {
      console.error(`[Admin] Failed to start admin streaming:`, err);
    }
  };

  // Real-time updates
  useEffect(() => {
    if (!isAuthenticated || !examCode) return;

    // Set up real-time subscription for exam sessions
    const sessionsChannel = supabase
      .channel(`proctoring-sessions-${examCode}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "exam_sessions",
        filter: `exam_id=eq.${examCode}`,
      }, () => {
        fetchProctoringData(examCode);
      })
      .subscribe();

    // Set up real-time subscription for activities
    const activitiesChannel = supabase
      .channel(`proctoring-activities-${examCode}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "security_activity_logs",
        filter: `exam_session_id=eq.${examCode}`,
      }, () => {
        fetchProctoringData(examCode);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(sessionsChannel);
      supabase.removeChannel(activitiesChannel);
    };
  }, [isAuthenticated, examCode]);

  const getLogIcon = (type: ProctoringLog["event_type"]) => {
    switch (type) {
      case "info":
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "violation":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
  };

  const formatTime = (date: string) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(new Date(date));
  };

  const getStudentName = (studentId: string) => {
    const names: Record<string, string> = {
      "student1": "John Doe",
      "student2": "Jane Smith",
      "student3": "Mike Johnson",
      "unknown": "Unknown Student",
    };
    return names[studentId] || `Student ${studentId}`;
  };

  const getExamName = (examId: string) => {
    const names: Record<string, string> = {
      "workday": "Workday Exam",
      "math": "Mathematics Final",
      "physics": "Physics Mid-Term",
      "exam123": "Advanced Programming",
      "test456": "Database Systems",
    };
    return names[examId] || examId.toUpperCase();
  };

  // Create student info for video feeds - prioritize WebRTC streams over database sessions
  const getStudentInfo = (studentId: string, stream?: MediaStream) => {
    // First try to find in database sessions
    const dbSession = sessions.find(s => s.student_id === studentId);
    
    // If found in database, use that info
    if (dbSession) {
      return {
        id: dbSession.student_id,
        name: getStudentName(dbSession.student_id),
        examTitle: getExamName(dbSession.exam_id),
        status: dbSession.status,
        violations: dbSession.violation_count,
        lastSeen: formatTime(dbSession.last_activity),
      };
    }
    
    // If not in database but has active stream, create basic info
    if (stream) {
      return {
        id: studentId,
        name: getStudentName(studentId),
        examTitle: getExamName(examCode),
        status: 'active' as const,
        violations: 0,
        lastSeen: formatTime(new Date().toISOString()),
      };
    }
    
    // Fallback
    return {
      id: studentId,
      name: getStudentName(studentId),
      examTitle: getExamName(examCode),
      status: 'active' as const,
      violations: 0,
      lastSeen: formatTime(new Date().toISOString()),
    };
  };

  // Get all active students (combine database sessions with WebRTC streams)
  const getActiveStudents = () => {
    const activeStudents = new Map();
    
    // Add students from WebRTC streams (highest priority)
    remoteStreams.forEach((stream, studentId) => {
      activeStudents.set(studentId, getStudentInfo(studentId, stream));
    });
    
    // Add students from database sessions
    sessions.forEach(session => {
      if (session.status === 'active' && !activeStudents.has(session.student_id)) {
        activeStudents.set(session.student_id, getStudentInfo(session.student_id));
      }
    });
    
    return Array.from(activeStudents.values());
  };

  // If not authenticated, show code entry screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mb-4">
              <Lock className="h-8 w-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl font-display">Enter Exam Code</CardTitle>
            <CardDescription>
              Enter the exam code to access live video proctoring
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCodeSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Exam Code</label>
                <input
                  type="text"
                  value={examCode}
                  onChange={(e) => setExamCode(e.target.value)}
                  placeholder="e.g., workday, math, physics"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Use the same code as the student exam
                </p>
              </div>
              
              {error && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                ) : (
                  <>
                    <Unlock className="h-4 w-4 mr-2" />
                    Access Live Proctoring
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Available Exam Codes:</h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div>• workday - Workday Exam</div>
                <div>• math - Mathematics Final</div>
                <div>• physics - Physics Mid-Term</div>
                <div>• exam123 - Advanced Programming</div>
                <div>• test456 - Database Systems</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Header with Profile */}
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Monitor className="h-6 w-6 text-primary" />
            <div className="font-display font-bold text-xl">Live Video Proctoring</div>
            <Badge variant="outline" className="border-primary/20">
              {getExamName(examCode)}
            </Badge>
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${isMonitoring ? "bg-success animate-pulse" : "bg-muted"}`} />
              <span className="text-sm text-muted-foreground">
                {isMonitoring ? "Monitoring" : "Paused"}
              </span>
            </div>
            {connectedUsers.size > 0 && (
              <Badge className="bg-success text-success-foreground">
                {connectedUsers.size} Active
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <Button
              variant={isMonitoring ? "default" : "outline"}
              onClick={() => setIsMonitoring(!isMonitoring)}
            >
              {isMonitoring ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
              {isMonitoring ? "Monitoring" : "Paused"}
            </Button>
            
            <Button variant="outline" onClick={() => {
              setIsAuthenticated(false);
              setExamCode("");
              setSessions([]);
              setLogs([]);
              cleanup();
            }}>
              <Lock className="h-4 w-4 mr-2" />
              Change Exam
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>AD</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">Admin User</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      admin@examportal.com
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="container py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Video Feeds */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Live Student Feeds ({getActiveStudents().length})</h2>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Secure Monitoring</span>
              </div>
            </div>

            {loading ? (
              <div className="grid md:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="aspect-video bg-muted rounded-lg mb-4"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-muted rounded"></div>
                        <div className="h-3 bg-muted rounded w-3/4"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {getActiveStudents().map((studentInfo) => {
                  const studentStream = remoteStreams.get(studentInfo.id);
                  return (
                    <AdminVideoFeed
                      key={studentInfo.id}
                      examCode={examCode}
                      studentInfo={studentInfo}
                      studentStream={studentStream}
                      isSelected={selectedSession === studentInfo.id}
                      onSelect={setSelectedSession}
                      onFullscreen={setFullscreenStudent}
                    />
                  );
                })}
                
                {getActiveStudents().length === 0 && (
                  <div className="col-span-2 text-center py-12">
                    <Camera className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">No Active Streams</h3>
                    <p className="text-muted-foreground">
                      Waiting for students to start streaming...
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Connected Users: {Array.from(connectedUsers).join(', ') || 'None'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Live Logs */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Live Activity Logs
                </CardTitle>
                <CardDescription>Real-time proctoring events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {logs.map((log) => (
                    <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      {getLogIcon(log.event_type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{getStudentName(log.student_id)}</p>
                          <span className="text-xs text-muted-foreground">
                            {formatTime(log.created_at)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{log.message}</p>
                      </div>
                    </div>
                  ))}
                  {logs.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No recent activity</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Session Details */}
            {selectedSession && (
              <Card>
                <CardHeader>
                  <CardTitle>Session Details</CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const session = sessions.find(s => s.id === selectedSession);
                    if (!session) return null;
                    const studentInfo = getStudentInfo(session.student_id);
                    return (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>{studentInfo.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{studentInfo.name}</p>
                            <p className="text-sm text-muted-foreground">{studentInfo.examTitle}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Status:</span>
                            <div className="mt-1">
                              {session.status === "active" && <Badge className="bg-success text-success-foreground">Active</Badge>}
                              {session.status === "completed" && <Badge className="bg-primary text-primary-foreground">Completed</Badge>}
                              {session.status === "terminated" && <Badge className="bg-destructive text-destructive-foreground">Terminated</Badge>}
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Violations:</span>
                            <div className="mt-1 font-medium">{session.violation_count}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Last Seen:</span>
                            <div className="mt-1 font-medium">{formatTime(session.last_activity)}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Session ID:</span>
                            <div className="mt-1 font-mono text-xs">{session.id}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Fullscreen Modal */}
      {fullscreenStudent && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
          <div className="relative w-full h-full">
            <Button
              variant="ghost"
              className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
              onClick={() => setFullscreenStudent(null)}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
            {(() => {
              const session = sessions.find(s => s.student_id === fullscreenStudent);
              if (!session) return null;
              const studentInfo = getStudentInfo(session.student_id);
              const studentStream = remoteStreams.get(session.student_id);
              return (
                <AdminVideoFeed
                  examCode={examCode}
                  studentInfo={studentInfo}
                  studentStream={studentStream}
                  isSelected={true}
                  onSelect={() => {}}
                  onFullscreen={() => setFullscreenStudent(null)}
                />
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProctoringWithLiveVideo;
