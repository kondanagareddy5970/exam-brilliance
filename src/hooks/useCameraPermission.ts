import { useState, useEffect, useCallback } from "react";

type PermissionStatus = "checking" | "prompt" | "granted" | "denied";

interface UseCameraPermissionReturn {
  status: PermissionStatus;
  isChecking: boolean;
  hasPermission: boolean;
  checkPermission: () => Promise<PermissionStatus>;
}

const PERMISSION_KEY = "camera_permission_checked";

export const useCameraPermission = (): UseCameraPermissionReturn => {
  const [status, setStatus] = useState<PermissionStatus>("checking");

  const checkPermission = useCallback(async (): Promise<PermissionStatus> => {
    try {
      if (navigator.permissions) {
        const result = await navigator.permissions.query({ name: "camera" as PermissionName });
        
        if (result.state === "granted") {
          setStatus("granted");
          sessionStorage.setItem(PERMISSION_KEY, "granted");
          return "granted";
        } else if (result.state === "denied") {
          setStatus("denied");
          sessionStorage.setItem(PERMISSION_KEY, "denied");
          return "denied";
        }
      }
      
      // Check if we've already prompted in this session
      const checked = sessionStorage.getItem(PERMISSION_KEY);
      if (checked === "granted") {
        setStatus("granted");
        return "granted";
      } else if (checked === "denied" || checked === "skipped") {
        setStatus("denied");
        return "denied";
      }
      
      setStatus("prompt");
      return "prompt";
    } catch (error) {
      // Check session storage as fallback
      const checked = sessionStorage.getItem(PERMISSION_KEY);
      if (checked === "granted") {
        setStatus("granted");
        return "granted";
      } else if (checked === "denied" || checked === "skipped") {
        setStatus("denied");
        return "denied";
      }
      
      setStatus("prompt");
      return "prompt";
    }
  }, []);

  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  return {
    status,
    isChecking: status === "checking",
    hasPermission: status === "granted",
    checkPermission,
  };
};

export const markPermissionAsGranted = () => {
  sessionStorage.setItem(PERMISSION_KEY, "granted");
};

export const markPermissionAsSkipped = () => {
  sessionStorage.setItem(PERMISSION_KEY, "skipped");
};
