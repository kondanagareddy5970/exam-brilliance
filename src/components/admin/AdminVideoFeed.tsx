import React, { useRef, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  AlertTriangle,
  CheckCircle,
  Camera,
  Wifi,
  WifiOff,
  Monitor,
  Maximize2,
  Volume2,
  VolumeX
} from "lucide-react";
import { useWebRTCProctoring } from "@/hooks/useWebRTCProctoring";

interface AdminVideoFeedProps {
  examCode: string;
  adminId: string;
  studentInfo: {
    id: string;
    name: string;
    examTitle: string;
    status: 'active' | 'completed' | 'terminated';
    violations: number;
    lastSeen: string;
  };
  isSelected?: boolean;
  onSelect?: (studentId: string) => void;
  onFullscreen?: (studentId: string) => void;
}

const AdminVideoFeed: React.FC<AdminVideoFeedProps> = ({
  examCode,
  adminId,
  studentInfo,
  isSelected = false,
  onSelect,
  onFullscreen
}) => {
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'poor' | 'none'>('none');
  const [streamStats, setStreamStats] = useState({
    resolution: 'Unknown',
    fps: 'Unknown',
    bitrate: 'Unknown'
  });

  const {
    remoteStreams,
    connectedUsers,
    isInitialized,
    startStreaming,
    stopStreaming,
    cleanup
  } = useWebRTCProctoring(examCode, adminId, true);

  // Get the specific student's stream
  const studentStream = remoteStreams.get(studentInfo.id);

  // Set remote video stream
  useEffect(() => {
    console.log(`[AdminFeed] Stream update for ${studentInfo.id}:`, !!studentStream);
    
    if (remoteVideoRef.current && studentStream) {
      remoteVideoRef.current.srcObject = studentStream;
      setIsConnected(true);
      setConnectionQuality('good'); // Would calculate actual quality in production
      
      console.log(`[AdminFeed] Successfully set video stream for ${studentInfo.name}`);
      
      // Get stream stats
      const videoTrack = studentStream.getVideoTracks()[0];
      if (videoTrack) {
        const settings = videoTrack.getSettings();
        setStreamStats({
          resolution: `${settings.width}x${settings.height}`,
          fps: '30', // Would calculate actual FPS
          bitrate: '2.5 Mbps' // Would calculate actual bitrate
        });
      }
    } else {
      setIsConnected(false);
      setConnectionQuality('none');
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
      console.log(`[AdminFeed] No stream available for ${studentInfo.name}`);
    }
  }, [studentStream, studentInfo.name]);

  // Toggle audio
  const toggleAudio = () => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.muted = !remoteVideoRef.current.muted;
      setIsMuted(!isMuted);
    }
  };

  // Get status badge
  const getStatusBadge = () => {
    if (!isConnected) {
      return <Badge className="bg-destructive text-destructive-foreground">Offline</Badge>;
    }
    
    switch (studentInfo.status) {
      case 'active':
        return <Badge className="bg-success text-success-foreground">Live</Badge>;
      case 'completed':
        return <Badge className="bg-primary text-primary-foreground">Completed</Badge>;
      case 'terminated':
        return <Badge className="bg-destructive text-destructive-foreground">Terminated</Badge>;
    }
  };

  // Get quality indicator
  const getQualityIndicator = () => {
    switch (connectionQuality) {
      case 'excellent':
        return <div className="flex items-center gap-1 text-success">
          <Wifi className="h-3 w-3" />
          <span className="text-xs">HD</span>
        </div>;
      case 'good':
        return <div className="flex items-center gap-1 text-warning">
          <Wifi className="h-3 w-3" />
          <span className="text-xs">SD</span>
        </div>;
      case 'poor':
        return <div className="flex items-center gap-1 text-destructive">
          <WifiOff className="h-3 w-3" />
          <span className="text-xs">Low</span>
        </div>;
      case 'none':
        return <div className="flex items-center gap-1 text-muted-foreground">
          <WifiOff className="h-3 w-3" />
          <span className="text-xs">No Signal</span>
        </div>;
    }
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
    <Card 
      className={`relative transition-all duration-300 ${
        isSelected ? 'ring-2 ring-primary shadow-lg' : 'hover:shadow-md'
      } ${isConnected ? 'border-success/20' : 'border-muted'}`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                {getInitials(studentInfo.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-sm font-medium">{studentInfo.name}</CardTitle>
              <p className="text-xs text-muted-foreground">{studentInfo.examTitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getQualityIndicator()}
            {getStatusBadge()}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Video Container */}
        <div 
          className="relative aspect-video bg-black rounded-lg overflow-hidden cursor-pointer"
          onClick={() => onSelect?.(studentInfo.id)}
        >
          {isConnected && studentStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              muted={isMuted}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-white">
              {studentInfo.status === 'completed' ? (
                <CheckCircle className="h-12 w-12 mb-2 opacity-50" />
              ) : studentInfo.status === 'terminated' ? (
                <AlertTriangle className="h-12 w-12 mb-2 opacity-50" />
              ) : (
                <Camera className="h-12 w-12 mb-2 opacity-50" />
              )}
              <p className="text-sm opacity-75">
                {!isConnected ? 'Waiting for stream...' : 
                 studentInfo.status === 'completed' ? 'Exam completed' :
                 studentInfo.status === 'terminated' ? 'Session terminated' :
                 'No video feed'}
              </p>
            </div>
          )}

          {/* Live Indicator */}
          {isConnected && studentInfo.status === 'active' && (
            <div className="absolute top-2 left-2">
              <div className="flex items-center gap-1 bg-red-600 px-2 py-1 rounded-full">
                <div className="h-2 w-2 bg-white rounded-full animate-pulse" />
                <span className="text-xs text-white font-medium">LIVE</span>
              </div>
            </div>
          )}

          {/* Violation Indicator */}
          {studentInfo.violations > 0 && (
            <div className="absolute top-2 right-2">
              <div className="flex items-center gap-1 bg-destructive px-2 py-1 rounded-full">
                <AlertTriangle className="h-3 w-3" />
                <span className="text-xs text-white">{studentInfo.violations}</span>
              </div>
            </div>
          )}

          {/* Controls Overlay */}
          <div className="absolute bottom-2 right-2 opacity-0 hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-1 bg-black/50 rounded-lg p-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleAudio();
                }}
                className="h-8 w-8 p-0 text-white hover:bg-white/20"
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onFullscreen?.(studentInfo.id);
                }}
                className="h-8 w-8 p-0 text-white hover:bg-white/20"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Student Info */}
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Last seen: {studentInfo.lastSeen}</span>
            <span>Violations: {studentInfo.violations}</span>
          </div>

          {/* Stream Stats */}
          {isConnected && (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{streamStats.resolution}</span>
              <span>{streamStats.fps} fps</span>
              <span>{streamStats.bitrate}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminVideoFeed;
