import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
  Video, 
  VideoOff, 
  AlertTriangle, 
  CheckCircle, 
  Eye, 
  EyeOff, 
  LogOut, 
  User,
  Monitor,
  Clock,
  Camera,
  Wifi,
  WifiOff,
  Lock,
  Unlock,
  Shield
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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

const AdminProctoring = () => {
  const [examCode, setExamCode] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessions, setSessions] = useState<ProctoringSession[]>([]);
  const [logs, setLogs] = useState<ProctoringLog[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  const getStatusBadge = (status: ProctoringSession["status"]) => {
    switch (status) {
      case "active":
        return <Badge className="bg-success text-success-foreground">Active</Badge>;
      case "completed":
        return <Badge className="bg-primary text-primary-foreground">Completed</Badge>;
      case "terminated":
        return <Badge className="bg-destructive text-destructive-foreground">Terminated</Badge>;
    }
  };

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

  const getInitials = (studentId: string) => {
    return studentId
      .replace("student", "S")
      .toUpperCase()
      .slice(0, 2);
  };

  const getStudentName = (studentId: string) => {
    const names: Record<string, string> = {
      "student1": "John Doe",
      "student2": "Jane Smith",
      "student3": "Mike Johnson",
      "unknown": "Unknown Student",
    };
    return names[studentId] || studentId;
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
              Enter the exam code to access live proctoring
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
                    Access Proctoring
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
            <div className="font-display font-bold text-xl">Live Proctoring</div>
            <Badge variant="outline" className="border-primary/20">
              {getExamName(examCode)}
            </Badge>
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${isMonitoring ? "bg-success animate-pulse" : "bg-muted"}`} />
              <span className="text-sm text-muted-foreground">
                {isMonitoring ? "Monitoring" : "Paused"}
              </span>
            </div>
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
            }}>
              <Lock className="h-4 w-4 mr-2" />
              Change Exam
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/avatars/admin.png" alt="Admin" />
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
              <h2 className="text-2xl font-semibold">Student Feeds ({sessions.length})</h2>
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
                {sessions.map((session) => (
                  <Card 
                    key={session.id} 
                    className={`relative cursor-pointer transition-all ${
                      selectedSession === session.id ? "ring-2 ring-primary" : ""
                    }`}
                    onClick={() => setSelectedSession(session.id)}
                  >
                    <CardContent className="p-4">
                      <div className="aspect-video bg-muted rounded-lg mb-4 flex items-center justify-center">
                        {session.status === "active" ? (
                          <div className="flex flex-col items-center text-muted-foreground">
                            <Camera className="h-8 w-8 mb-2" />
                            <span className="text-sm">Camera Feed</span>
                          </div>
                        ) : session.status === "completed" ? (
                          <div className="flex flex-col items-center text-green-500">
                            <CheckCircle className="h-8 w-8 mb-2" />
                            <span className="text-sm">Completed</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center text-destructive">
                            <WifiOff className="h-8 w-8 mb-2" />
                            <span className="text-sm">Terminated</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium">{getStudentName(session.student_id)}</h3>
                          {getStatusBadge(session.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">{getExamName(session.exam_id)}</p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Last seen: {formatTime(session.last_activity)}</span>
                          <span>Violations: {session.violation_count}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {sessions.length === 0 && (
                  <div className="col-span-2 text-center py-12">
                    <Camera className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">No Active Sessions</h3>
                    <p className="text-muted-foreground">
                      No students are currently taking this exam
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
                  Live Logs
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
                    return (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>{getInitials(session.student_id)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{getStudentName(session.student_id)}</p>
                            <p className="text-sm text-muted-foreground">{getExamName(session.exam_id)}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Status:</span>
                            <div className="mt-1">{getStatusBadge(session.status)}</div>
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
    </div>
  );
};

export default AdminProctoring;
