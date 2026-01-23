import { AlertCircle, User, Users, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

interface FaceDetectionAlertProps {
  noFaceAlertActive: boolean;
  noFaceDuration: number;
  faceCount: number;
  thresholdMs: number;
  className?: string;
}

export const FaceDetectionAlert = ({
  noFaceAlertActive,
  noFaceDuration,
  faceCount,
  thresholdMs,
  className,
}: FaceDetectionAlertProps) => {
  // Calculate warning progress
  const warningProgress = Math.min((noFaceDuration / thresholdMs) * 100, 100);
  const isWarning = noFaceDuration > 0 && noFaceDuration < thresholdMs;
  const isMultipleFaces = faceCount > 1;

  if (!noFaceAlertActive && !isWarning && !isMultipleFaces) {
    return null;
  }

  if (isMultipleFaces) {
    return (
      <div className={cn(
        "bg-warning/10 border border-warning/30 rounded-lg p-3 animate-pulse",
        className
      )}>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-warning shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-medium text-warning">
              Multiple Faces Detected
            </p>
            <p className="text-[10px] text-warning/80">
              {faceCount} people visible - only you should be on camera
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (noFaceAlertActive) {
    return (
      <div className={cn(
        "bg-destructive/10 border border-destructive/30 rounded-lg p-3",
        className
      )}>
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-destructive shrink-0 animate-pulse" />
          <div className="flex-1">
            <p className="text-xs font-medium text-destructive">
              Face Not Detected
            </p>
            <p className="text-[10px] text-destructive/80">
              Please return to the camera frame immediately
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isWarning) {
    return (
      <div className={cn(
        "bg-warning/10 border border-warning/30 rounded-lg p-3",
        className
      )}>
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-warning shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-medium text-warning">
              Stay in Frame
            </p>
            <p className="text-[10px] text-warning/80">
              Face detection warning in {Math.ceil((thresholdMs - noFaceDuration) / 1000)}s
            </p>
            {/* Warning progress bar */}
            <div className="mt-1.5 h-1 bg-warning/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-warning rounded-full transition-all duration-200"
                style={{ width: `${warningProgress}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

interface FaceStatusIndicatorProps {
  faceCount: number;
  isDetecting: boolean;
  noFaceAlertActive: boolean;
  className?: string;
}

export const FaceStatusIndicator = ({
  faceCount,
  isDetecting,
  noFaceAlertActive,
  className,
}: FaceStatusIndicatorProps) => {
  if (!isDetecting) {
    return null;
  }

  const getStatusColor = () => {
    if (noFaceAlertActive) return "text-destructive bg-destructive/10";
    if (faceCount > 1) return "text-warning bg-warning/10";
    if (faceCount === 1) return "text-success bg-success/10";
    return "text-muted-foreground bg-muted";
  };

  const getStatusIcon = () => {
    if (faceCount === 0) return <AlertCircle className="h-3 w-3" />;
    if (faceCount > 1) return <Users className="h-3 w-3" />;
    return <User className="h-3 w-3" />;
  };

  return (
    <div className={cn(
      "flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium",
      getStatusColor(),
      className
    )}>
      {getStatusIcon()}
      <span>{faceCount === 1 ? "Face OK" : faceCount === 0 ? "No Face" : `${faceCount} Faces`}</span>
    </div>
  );
};
