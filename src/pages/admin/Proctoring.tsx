import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useProctoring } from "@/hooks/useProctoringDB";
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
  WifiOff
} from "lucide-react";

interface ProctoringSession {
  id: string;
  studentName: string;
  examName: string;
  status: "active" | "warning" | "offline";
  lastSeen: Date;
  violations: number;
  videoStream?: MediaStream;
}

interface LogEntry {
  id: string;
  sessionId: string;
  studentName: string;
  type: "info" | "warning" | "violation";
  message: string;
  timestamp: Date;
}

const AdminProctoring = () => {
  const { sessions, logs, loading, error } = useProctoring();
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(true);
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});

  // Remove simulation since we're using real data
  // useEffect(() => {
  //   if (!isMonitoring) return;
  //   ... simulation code removed
  // }, [isMonitoring, sessions]);

  const getStatusBadge = (status: ProctoringSession["status"]) => {
    switch (status) {
      case "active":
        return <Badge className="bg-success text-success-foreground">Active</Badge>;
      case "warning":
        return <Badge className="bg-warning text-warning-foreground">Warning</Badge>;
      case "offline":
        return <Badge className="bg-destructive text-destructive-foreground">Offline</Badge>;
    }
  };

  const getLogIcon = (type: LogEntry["type"]) => {
    switch (type) {
      case "info":
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "violation":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(date);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Header with Profile */}
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Monitor className="h-6 w-6 text-primary" />
            <div className="font-display font-bold text-xl">Live Proctoring</div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${isMonitoring ? "bg-success animate-pulse" : "bg-muted"}`} />
              <span className="text-sm text-muted-foreground">
                {isMonitoring ? "Monitoring" : "Paused"}
              </span>
            </div>
            
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
              <h2 className="text-2xl font-semibold">Student Feeds</h2>
              <Button
                variant={isMonitoring ? "default" : "outline"}
                onClick={() => setIsMonitoring(!isMonitoring)}
              >
                {isMonitoring ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
                {isMonitoring ? "Monitoring" : "Paused"}
              </Button>
            </div>

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
                      ) : session.status === "warning" ? (
                        <div className="flex flex-col items-center text-yellow-500">
                          <AlertTriangle className="h-8 w-8 mb-2" />
                          <span className="text-sm">Warning</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center text-destructive">
                          <WifiOff className="h-8 w-8 mb-2" />
                          <span className="text-sm">Offline</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">{session.studentName}</h3>
                        {getStatusBadge(session.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">{session.examName}</p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Last seen: {formatTime(session.lastSeen)}</span>
                        <span>Violations: {session.violations}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
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
                      {getLogIcon(log.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{log.studentName}</p>
                          <span className="text-xs text-muted-foreground">
                            {formatTime(log.timestamp)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{log.message}</p>
                      </div>
                    </div>
                  ))}
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
                            <AvatarFallback>{getInitials(session.studentName)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{session.studentName}</p>
                            <p className="text-sm text-muted-foreground">{session.examName}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Status:</span>
                            <div className="mt-1">{getStatusBadge(session.status)}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Violations:</span>
                            <div className="mt-1 font-medium">{session.violations}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Last Seen:</span>
                            <div className="mt-1 font-medium">{formatTime(session.lastSeen)}</div>
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
