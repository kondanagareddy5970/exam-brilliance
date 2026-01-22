import { Maximize, Shield, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FullscreenPromptProps {
  onEnterFullscreen: () => void;
  onCancel: () => void;
}

export const FullscreenPrompt = ({ onEnterFullscreen, onCancel }: FullscreenPromptProps) => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-lg w-full" variant="elevated">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Secure Exam Mode Required</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-center text-muted-foreground">
            To ensure exam integrity, you must enter fullscreen mode before starting. 
            The following security measures will be active:
          </p>

          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
              <Maximize className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-sm">Fullscreen Mode</p>
                <p className="text-xs text-muted-foreground">
                  Exam runs in fullscreen. Exiting will be recorded as a violation.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
              <AlertCircle className="h-5 w-5 text-warning mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-sm">Tab Switch Detection</p>
                <p className="text-xs text-muted-foreground">
                  Switching tabs or windows will be logged and counted as a violation.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
              <Shield className="h-5 w-5 text-success mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-sm">Activity Monitoring</p>
                <p className="text-xs text-muted-foreground">
                  Copy, paste, right-click, and screenshot attempts are blocked and logged.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <p className="text-sm text-destructive font-medium">
              ⚠️ Important: 3 violations will result in automatic exam submission.
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onCancel}>
              Cancel
            </Button>
            <Button variant="hero" className="flex-1" onClick={onEnterFullscreen}>
              <Maximize className="h-4 w-4 mr-2" />
              Enter Fullscreen
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
