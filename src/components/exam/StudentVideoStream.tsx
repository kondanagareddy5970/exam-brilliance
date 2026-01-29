import React, { useRef, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  AlertTriangle,
  CheckCircle,
  Camera,
  Wifi,
  WifiOff
} from "lucide-react";
import { useWebRTCProctoring } from "@/hooks/useWebRTCProctoring";

interface StudentVideoStreamProps {
  examCode: string;
  studentId: string;
  examTitle: string;
  onStreamStart?: () => void;
  onStreamStop?: () => void;
}

const StudentVideoStream: React.FC<StudentVideoStreamProps> = ({
  examCode,
  studentId,
  examTitle,
  onStreamStart,
  onStreamStop
}) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string>("");
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  
  const {
    localStream,
    remoteStreams,
    connectedUsers,
    isInitialized,
    startStreaming,
    stopStreaming,
    cleanup
  } = useWebRTCProctoring(examCode, studentId, false);

  // Set local video stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Handle stream start
  const handleStartStream = async () => {
    try {
      setError("");
      setConnectionStatus('connecting');
      
      await startStreaming();
      setIsStreaming(true);
      setConnectionStatus('connected');
      
      if (onStreamStart) {
        onStreamStart();
      }
      
      console.log(`Student ${studentId} started streaming for exam ${examCode}`);
    } catch (err) {
      setError("Failed to start camera. Please ensure camera permissions are granted.");
      setConnectionStatus('disconnected');
      console.error("Stream start error:", err);
    }
  };

  // Handle stream stop
  const handleStopStream = () => {
    stopStreaming();
    setIsStreaming(false);
    setConnectionStatus('disconnected');
    
    if (onStreamStop) {
      onStreamStop();
    }
    
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    
    console.log(`Student ${studentId} stopped streaming`);
  };

  // Toggle audio
  const toggleAudio = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  // Toggle video
  const toggleVideo = () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  const getStatusBadge = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Badge className="bg-success text-success-foreground">Live</Badge>;
      case 'connecting':
        return <Badge className="bg-warning text-warning-foreground">Connecting</Badge>;
      case 'disconnected':
        return <Badge className="bg-destructive text-destructive-foreground">Offline</Badge>;
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">{examTitle}</h3>
              <p className="text-sm text-muted-foreground">Student ID: {studentId}</p>
            </div>
            {getStatusBadge()}
          </div>

          {/* Video Container */}
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
            {isStreaming && localStream ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-white">
                <Camera className="h-12 w-12 mb-2 opacity-50" />
                <p className="text-sm opacity-75">
                  {error || "Camera not active"}
                </p>
              </div>
            )}

            {/* Connection Status Overlay */}
            {isStreaming && (
              <div className="absolute top-2 right-2">
                <div className="flex items-center gap-1 bg-black/50 px-2 py-1 rounded-full">
                  {connectionStatus === 'connected' ? (
                    <Wifi className="h-3 w-3 text-success" />
                  ) : (
                    <WifiOff className="h-3 w-3 text-destructive" />
                  )}
                  <span className="text-xs text-white">
                    {connectionStatus}
                  </span>
                </div>
              </div>
            )}

            {/* Admin Monitoring Indicator */}
            {connectedUsers.size > 0 && (
              <div className="absolute top-2 left-2">
                <div className="flex items-center gap-1 bg-black/50 px-2 py-1 rounded-full">
                  <CheckCircle className="h-3 w-3 text-success" />
                  <span className="text-xs text-white">
                    Admin monitoring
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant={isVideoEnabled ? "default" : "destructive"}
                size="sm"
                onClick={toggleVideo}
                disabled={!isStreaming}
              >
                {isVideoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
              </Button>
              <Button
                variant={isMuted ? "destructive" : "default"}
                size="sm"
                onClick={toggleAudio}
                disabled={!isStreaming}
              >
                {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
            </div>

            <Button
              variant={isStreaming ? "destructive" : "default"}
              onClick={isStreaming ? handleStopStream : handleStartStream}
              disabled={!isInitialized}
            >
              {isStreaming ? (
                <>
                  <VideoOff className="h-4 w-4 mr-2" />
                  Stop Stream
                </>
              ) : (
                <>
                  <Video className="h-4 w-4 mr-2" />
                  Start Stream
                </>
              )}
            </Button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Status Info */}
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex justify-between">
              <span>Status:</span>
              <span className={connectionStatus === 'connected' ? 'text-success' : 'text-muted-foreground'}>
                {connectionStatus}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Admin Viewers:</span>
              <span>{connectedUsers.size}</span>
            </div>
            <div className="flex justify-between">
              <span>Exam Code:</span>
              <span className="font-mono">{examCode}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StudentVideoStream;
