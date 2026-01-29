import { useState, useRef, useCallback, useEffect } from "react";

export interface CapturedPhoto {
  id: string;
  timestamp: Date;
  dataUrl: string;
  type: "initial" | "periodic" | "suspicious";
}

interface UseWebcamOptions {
  autoCapture?: boolean;
  captureIntervalMs?: number;
  onPhotoCapture?: (photo: CapturedPhoto) => void;
}

export const useWebcam = (options: UseWebcamOptions = {}) => {
  const {
    autoCapture = true,
    captureIntervalMs = 60000, // Capture every 60 seconds
    onPhotoCapture,
  } = options;

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([]);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  // Initialize canvas for photo capture
  useEffect(() => {
    if (!canvasRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = 640;
      canvas.height = 480;
      canvasRef.current = canvas;
    }
  }, []);

  // Request webcam access
  const requestAccess = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
        audio: false,
      });

      streamRef.current = stream;
      setHasPermission(true);
      setIsEnabled(true);
      setIsLoading(false);

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to access webcam";
      setError(errorMessage);
      setHasPermission(false);
      setIsLoading(false);
      console.error("[Webcam] Access denied:", errorMessage);
      return false;
    }
  }, []);

  // Attach stream to video element
  const attachToVideo = useCallback((videoElement: HTMLVideoElement) => {
    videoRef.current = videoElement;
    if (streamRef.current && videoElement) {
      videoElement.srcObject = streamRef.current;
      videoElement.play().catch(console.error);
    }
  }, []);

  // Capture a photo
  const capturePhoto = useCallback((type: CapturedPhoto["type"] = "periodic"): CapturedPhoto | null => {
    if (!videoRef.current || !canvasRef.current || !isEnabled) {
      return null;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx) return null;

    // Draw current video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to data URL
    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);

    const photo: CapturedPhoto = {
      id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      dataUrl,
      type,
    };

    setCapturedPhotos((prev) => [...prev, photo]);
    onPhotoCapture?.(photo);

    console.log(`[Webcam] Photo captured: ${type} at ${photo.timestamp.toISOString()}`);

    return photo;
  }, [isEnabled, onPhotoCapture]);

  // Stop webcam
  const stopWebcam = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsEnabled(false);
  }, []);

  // Auto-capture photos at intervals
  useEffect(() => {
    if (!autoCapture || !isEnabled) return;

    // Capture initial photo after a short delay
    const initialTimeout = setTimeout(() => {
      capturePhoto("initial");
    }, 2000);

    // Set up periodic capture
    const intervalId = setInterval(() => {
      capturePhoto("periodic");
    }, captureIntervalMs);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(intervalId);
    };
  }, [autoCapture, isEnabled, captureIntervalMs, capturePhoto]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopWebcam();
    };
  }, [stopWebcam]);

  return {
    isEnabled,
    isLoading,
    error,
    hasPermission,
    capturedPhotos,
    requestAccess,
    attachToVideo,
    capturePhoto,
    stopWebcam,
    photoCount: capturedPhotos.length,
  };
};
