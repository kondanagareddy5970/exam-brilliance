import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, Shield, CheckCircle2, XCircle, Loader2 } from "lucide-react";

interface CameraPermissionDialogProps {
  onPermissionGranted: () => void;
  onPermissionDenied: () => void;
}

export const CameraPermissionDialog = ({
  onPermissionGranted,
  onPermissionDenied,
}: CameraPermissionDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<"prompt" | "granted" | "denied" | "checking">("checking");

  useEffect(() => {
    checkCameraPermission();
  }, []);

  const checkCameraPermission = async () => {
    try {
      // Check if permissions API is available
      if (navigator.permissions) {
        const result = await navigator.permissions.query({ name: "camera" as PermissionName });
        if (result.state === "granted") {
          setPermissionStatus("granted");
          onPermissionGranted();
          return;
        } else if (result.state === "denied") {
          setPermissionStatus("denied");
          setIsOpen(true);
          return;
        }
      }
      
      // If permissions API not available or state is "prompt", show dialog
      setPermissionStatus("prompt");
      setIsOpen(true);
    } catch (error) {
      // Fallback: show dialog to request permission
      setPermissionStatus("prompt");
      setIsOpen(true);
    }
  };

  const requestCameraAccess = async () => {
    setIsRequesting(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // Stop the stream immediately - we just needed permission
      stream.getTracks().forEach((track) => track.stop());
      setPermissionStatus("granted");
      setIsOpen(false);
      onPermissionGranted();
    } catch (error) {
      setPermissionStatus("denied");
      onPermissionDenied();
    } finally {
      setIsRequesting(false);
    }
  };

  const handleSkip = () => {
    setIsOpen(false);
    onPermissionDenied();
  };

  if (permissionStatus === "checking") {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Camera className="h-5 w-5 text-primary" />
            </div>
            Camera Access Required
          </DialogTitle>
          <DialogDescription className="text-left pt-2">
            This examination platform requires camera access for proctoring and identity verification during exams.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {permissionStatus === "denied" ? (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4">
              <div className="flex items-start gap-3">
                <XCircle className="h-5 w-5 text-destructive mt-0.5" />
                <div>
                  <p className="font-medium text-destructive">Camera Access Denied</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Please enable camera access in your browser settings to use this platform for examinations.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="rounded-lg bg-muted p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Secure Proctoring</p>
                    <p className="text-sm text-muted-foreground">
                      Your camera will only be used during active exam sessions for identity verification.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
                  <div>
                    <p className="font-medium">Privacy Protected</p>
                    <p className="text-sm text-muted-foreground">
                      Photos are securely stored and only accessible to authorized administrators.
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                By allowing camera access, you agree to being monitored during examinations.
              </p>
            </>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {permissionStatus === "denied" ? (
            <Button onClick={handleSkip} variant="outline">
              Continue Without Camera
            </Button>
          ) : (
            <>
              <Button
                onClick={requestCameraAccess}
                disabled={isRequesting}
                className="bg-gradient-primary"
              >
                {isRequesting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Requesting Access...
                  </>
                ) : (
                  <>
                    <Camera className="h-4 w-4 mr-2" />
                    Allow Camera Access
                  </>
                )}
              </Button>
              <Button variant="ghost" onClick={handleSkip} disabled={isRequesting}>
                Skip for Now
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
