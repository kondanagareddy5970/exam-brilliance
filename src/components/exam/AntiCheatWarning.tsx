import { AlertTriangle, Shield, Monitor, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface AntiCheatWarningProps {
  isOpen: boolean;
  violations: number;
  maxViolations: number;
  type: "fullscreen" | "tab_switch" | "blocked";
  onReturnToExam: () => void;
  onForceSubmit?: () => void;
}

export const AntiCheatWarning = ({
  isOpen,
  violations,
  maxViolations,
  type,
  onReturnToExam,
  onForceSubmit,
}: AntiCheatWarningProps) => {
  const isBlocked = type === "blocked";
  const remainingViolations = maxViolations - violations;

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            {isBlocked ? (
              <>
                <Shield className="h-5 w-5" />
                Exam Terminated
              </>
            ) : (
              <>
                <AlertTriangle className="h-5 w-5" />
                Security Warning
              </>
            )}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            {isBlocked ? (
              <div className="space-y-3">
                <p className="text-destructive font-medium">
                  Your exam has been automatically terminated due to multiple security violations.
                </p>
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                  <p className="text-sm">
                    You have exceeded the maximum allowed violations ({maxViolations}). 
                    Your exam will be submitted with your current answers.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {type === "fullscreen" && (
                  <div className="flex items-start gap-3 p-3 bg-warning/10 rounded-lg">
                    <Monitor className="h-5 w-5 text-warning mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Fullscreen Mode Required</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        You exited fullscreen mode. The exam must be taken in fullscreen for security purposes.
                      </p>
                    </div>
                  </div>
                )}
                
                {type === "tab_switch" && (
                  <div className="flex items-start gap-3 p-3 bg-warning/10 rounded-lg">
                    <Eye className="h-5 w-5 text-warning mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Tab Switch Detected</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        You navigated away from the exam tab. This activity has been logged.
                      </p>
                    </div>
                  </div>
                )}

                <div className="bg-muted rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Violations:</span>
                    <span className="font-bold text-destructive">{violations} / {maxViolations}</span>
                  </div>
                  <div className="w-full bg-muted-foreground/20 rounded-full h-2">
                    <div 
                      className="bg-destructive h-2 rounded-full transition-all" 
                      style={{ width: `${(violations / maxViolations) * 100}%` }}
                    />
                  </div>
                  {remainingViolations > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {remainingViolations} warning{remainingViolations !== 1 ? 's' : ''} remaining before auto-submission
                    </p>
                  )}
                </div>
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {isBlocked ? (
            <AlertDialogAction onClick={onForceSubmit} className="bg-destructive hover:bg-destructive/90">
              View Results
            </AlertDialogAction>
          ) : (
            <AlertDialogAction onClick={onReturnToExam} className="bg-gradient-primary">
              Return to Exam
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
