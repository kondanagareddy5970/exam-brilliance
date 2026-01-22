import { Shield, AlertTriangle, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

interface SecurityStatusBarProps {
  violations: number;
  maxViolations: number;
  tabSwitchCount: number;
  isFullscreen: boolean;
}

export const SecurityStatusBar = ({
  violations,
  maxViolations,
  tabSwitchCount,
  isFullscreen,
}: SecurityStatusBarProps) => {
  const hasViolations = violations > 0;
  
  return (
    <div className={cn(
      "flex items-center gap-4 px-4 py-2 rounded-lg text-sm transition-colors",
      hasViolations ? "bg-warning/10 text-warning" : "bg-success/10 text-success"
    )}>
      <div className="flex items-center gap-2">
        {hasViolations ? (
          <AlertTriangle className="h-4 w-4" />
        ) : (
          <Shield className="h-4 w-4" />
        )}
        <span className="font-medium">
          {hasViolations 
            ? `${maxViolations - violations} warning${maxViolations - violations !== 1 ? 's' : ''} left`
            : "Secure"
          }
        </span>
      </div>
      
      {tabSwitchCount > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Eye className="h-3.5 w-3.5" />
          <span>{tabSwitchCount} tab switch{tabSwitchCount !== 1 ? 'es' : ''}</span>
        </div>
      )}
      
      {!isFullscreen && (
        <div className="text-xs text-destructive font-medium">
          Not in fullscreen
        </div>
      )}
    </div>
  );
};
