import { useEffect, useRef, useState } from "react";
import { Camera, CameraOff, AlertCircle, Eye, User, Users, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface WebcamProctorProps {
  isEnabled: boolean;
  onVideoRef: (video: HTMLVideoElement) => void;
  photoCount: number;
  error?: string | null;
  className?: string;
  minimized?: boolean;
  onToggleMinimize?: () => void;
  faceCount?: number;
  noFaceAlertActive?: boolean;
  isDetectingFace?: boolean;
}

export const WebcamProctor = ({
  isEnabled,
  onVideoRef,
  photoCount,
  error,
  className,
  minimized = false,
  onToggleMinimize,
  faceCount = 1,
  noFaceAlertActive = false,
  isDetectingFace = false,
}: WebcamProctorProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);

  useEffect(() => {
    if (videoRef.current && isEnabled) {
      onVideoRef(videoRef.current);
    }
  }, [isEnabled, onVideoRef]);

  const handleVideoCanPlay = () => {
    setIsVideoReady(true);
  };

  const getFaceStatusColor = () => {
    if (noFaceAlertActive) return "bg-destructive";
    if (faceCount > 1) return "bg-warning";
    if (faceCount === 1) return "bg-success";
    return "bg-muted-foreground";
  };

  const getFaceStatusIcon = () => {
    if (faceCount === 0) return <AlertTriangle className="h-3 w-3 text-white" />;
    if (faceCount > 1) return <Users className="h-3 w-3 text-white" />;
    return <User className="h-3 w-3 text-white" />;
  };

  if (error) {
    return (
      <div className={cn(
        "bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-center gap-2",
        className
      )}>
        <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
        <span className="text-xs text-destructive">Webcam error: {error}</span>
      </div>
    );
  }

  if (!isEnabled) {
    return (
      <div className={cn(
        "bg-muted rounded-lg p-4 flex flex-col items-center justify-center gap-2",
        className
      )}>
        <CameraOff className="h-8 w-8 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Webcam not active</span>
      </div>
    );
  }

  if (minimized) {
    return (
      <button
        onClick={onToggleMinimize}
        className={cn(
          "bg-card border rounded-lg p-2 flex items-center gap-2 hover:bg-muted transition-colors",
          noFaceAlertActive && "border-destructive bg-destructive/5",
          className
        )}
      >
        <div className="relative">
          <Camera className={cn("h-4 w-4", noFaceAlertActive ? "text-destructive" : "text-success")} />
          <span className={cn(
            "absolute -top-1 -right-1 h-2 w-2 rounded-full animate-pulse",
            noFaceAlertActive ? "bg-destructive" : "bg-success"
          )} />
        </div>
        <span className="text-xs font-medium">{photoCount} photos</span>
        {isDetectingFace && (
          <div className={cn(
            "flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium",
            getFaceStatusColor(),
            "text-white"
          )}>
            {getFaceStatusIcon()}
          </div>
        )}
      </button>
    );
  }

  return (
    <div className={cn(
      "relative rounded-lg overflow-hidden border bg-black",
      noFaceAlertActive && "border-destructive border-2",
      className
    )}>
      {/* Video feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        onCanPlay={handleVideoCanPlay}
        className="w-full h-full object-cover scale-x-[-1]"
      />

      {/* Loading overlay */}
      {!isVideoReady && (
        <div className="absolute inset-0 bg-muted flex items-center justify-center">
          <div className="animate-pulse flex flex-col items-center gap-2">
            <Camera className="h-6 w-6 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Starting camera...</span>
          </div>
        </div>
      )}

      {/* No face alert overlay */}
      {noFaceAlertActive && isVideoReady && (
        <div className="absolute inset-0 bg-destructive/20 flex items-center justify-center animate-pulse">
          <div className="bg-destructive text-destructive-foreground px-3 py-2 rounded-lg flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-xs font-medium">Face not detected!</span>
          </div>
        </div>
      )}

      {/* Status overlay */}
      <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-sm rounded-full px-2 py-1">
          <span className="h-2 w-2 bg-success rounded-full animate-pulse" />
          <span className="text-[10px] text-white font-medium">RECORDING</span>
        </div>
        
        <div className="flex items-center gap-1.5">
          {/* Face detection status */}
          {isDetectingFace && (
            <div className={cn(
              "flex items-center gap-1 backdrop-blur-sm rounded-full px-2 py-1",
              getFaceStatusColor()
            )}>
              {getFaceStatusIcon()}
              <span className="text-[10px] text-white font-medium">
                {faceCount === 0 ? "No Face" : faceCount === 1 ? "OK" : `${faceCount}`}
              </span>
            </div>
          )}
          
          <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-sm rounded-full px-2 py-1">
            <Eye className="h-3 w-3 text-white" />
            <span className="text-[10px] text-white font-medium">{photoCount}</span>
          </div>
        </div>
      </div>

      {/* Minimize button */}
      {onToggleMinimize && (
        <button
          onClick={onToggleMinimize}
          className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm rounded p-1 hover:bg-black/80 transition-colors"
        >
          <span className="text-[10px] text-white">Minimize</span>
        </button>
      )}
    </div>
  );
};
