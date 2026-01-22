import { useEffect, useRef, useState } from "react";
import { Camera, CameraOff, AlertCircle, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

interface WebcamProctorProps {
  isEnabled: boolean;
  onVideoRef: (video: HTMLVideoElement) => void;
  photoCount: number;
  error?: string | null;
  className?: string;
  minimized?: boolean;
  onToggleMinimize?: () => void;
}

export const WebcamProctor = ({
  isEnabled,
  onVideoRef,
  photoCount,
  error,
  className,
  minimized = false,
  onToggleMinimize,
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
          className
        )}
      >
        <div className="relative">
          <Camera className="h-4 w-4 text-success" />
          <span className="absolute -top-1 -right-1 h-2 w-2 bg-success rounded-full animate-pulse" />
        </div>
        <span className="text-xs font-medium">{photoCount} photos</span>
      </button>
    );
  }

  return (
    <div className={cn("relative rounded-lg overflow-hidden border bg-black", className)}>
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

      {/* Status overlay */}
      <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-sm rounded-full px-2 py-1">
          <span className="h-2 w-2 bg-success rounded-full animate-pulse" />
          <span className="text-[10px] text-white font-medium">RECORDING</span>
        </div>
        
        <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-sm rounded-full px-2 py-1">
          <Eye className="h-3 w-3 text-white" />
          <span className="text-[10px] text-white font-medium">{photoCount}</span>
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
