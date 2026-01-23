import { useState, useRef, useCallback, useEffect } from "react";

export interface FaceDetectionEvent {
  timestamp: Date;
  type: "no_face" | "face_returned" | "multiple_faces";
  faceCount: number;
}

interface UseFaceDetectionOptions {
  enabled?: boolean;
  detectionIntervalMs?: number;
  noFaceThresholdMs?: number;
  onNoFaceDetected?: () => void;
  onFaceReturned?: () => void;
  onMultipleFaces?: (count: number) => void;
}

export const useFaceDetection = (options: UseFaceDetectionOptions = {}) => {
  const {
    enabled = false,
    detectionIntervalMs = 2000,
    noFaceThresholdMs = 5000,
    onNoFaceDetected,
    onFaceReturned,
    onMultipleFaces,
  } = options;

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const detectorRef = useRef<any>(null);
  const noFaceStartRef = useRef<number | null>(null);
  const wasNoFaceRef = useRef(false);

  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [faceCount, setFaceCount] = useState(0);
  const [noFaceAlertActive, setNoFaceAlertActive] = useState(false);
  const [events, setEvents] = useState<FaceDetectionEvent[]>([]);
  const [noFaceDuration, setNoFaceDuration] = useState(0);

  // Initialize canvas for face detection
  useEffect(() => {
    if (!canvasRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = 320;
      canvas.height = 240;
      canvasRef.current = canvas;
    }
  }, []);

  // Check if Face Detection API is available
  useEffect(() => {
    const checkSupport = async () => {
      if ("FaceDetector" in window) {
        try {
          // @ts-ignore - FaceDetector is experimental
          detectorRef.current = new window.FaceDetector({ fastMode: true });
          setIsSupported(true);
          console.log("[FaceDetection] Native Face Detection API available");
        } catch (e) {
          console.log("[FaceDetection] Native API failed, using fallback");
          setIsSupported(false);
        }
      } else {
        console.log("[FaceDetection] Native API not available, using canvas-based fallback");
        setIsSupported(false);
      }
    };
    checkSupport();
  }, []);

  const addEvent = useCallback((type: FaceDetectionEvent["type"], count: number) => {
    const event: FaceDetectionEvent = {
      timestamp: new Date(),
      type,
      faceCount: count,
    };
    setEvents((prev) => [...prev, event]);
    console.log(`[FaceDetection] Event: ${type}, faces: ${count}`);
  }, []);

  // Attach video element for detection
  const attachVideo = useCallback((video: HTMLVideoElement) => {
    videoRef.current = video;
  }, []);

  // Perform face detection using native API or fallback
  const detectFaces = useCallback(async (): Promise<number> => {
    if (!videoRef.current || !canvasRef.current) return 0;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx || video.readyState < 2) return 0;

    // Draw current frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Try native Face Detection API first
    if (detectorRef.current && isSupported) {
      try {
        const faces = await detectorRef.current.detect(canvas);
        return faces.length;
      } catch (e) {
        console.error("[FaceDetection] Native detection failed:", e);
      }
    }

    // Fallback: Simple brightness/motion-based presence detection
    // This is a basic heuristic - in production you'd use a proper ML model
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Analyze center region for skin-tone-like pixels
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const regionSize = 80;
    
    let skinTonePixels = 0;
    let totalPixels = 0;

    for (let y = centerY - regionSize; y < centerY + regionSize; y++) {
      for (let x = centerX - regionSize; x < centerX + regionSize; x++) {
        if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) continue;
        
        const i = (y * canvas.width + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Simple skin tone detection heuristic
        // Works reasonably for various skin tones
        const isSkinTone = 
          r > 60 && g > 40 && b > 20 &&
          r > g && g > b &&
          Math.abs(r - g) > 15 &&
          r - b > 15;
        
        if (isSkinTone) skinTonePixels++;
        totalPixels++;
      }
    }

    const skinToneRatio = skinTonePixels / totalPixels;
    
    // If more than 15% of center region has skin-tone pixels, assume face present
    return skinToneRatio > 0.15 ? 1 : 0;
  }, [isSupported]);

  // Main detection loop
  useEffect(() => {
    if (!enabled) {
      setIsDetecting(false);
      setNoFaceAlertActive(false);
      setNoFaceDuration(0);
      noFaceStartRef.current = null;
      wasNoFaceRef.current = false;
      return;
    }

    setIsDetecting(true);

    const runDetection = async () => {
      const count = await detectFaces();
      setFaceCount(count);

      const now = Date.now();

      if (count === 0) {
        // No face detected
        if (!noFaceStartRef.current) {
          noFaceStartRef.current = now;
        }

        const duration = now - noFaceStartRef.current;
        setNoFaceDuration(duration);

        if (duration >= noFaceThresholdMs && !wasNoFaceRef.current) {
          wasNoFaceRef.current = true;
          setNoFaceAlertActive(true);
          addEvent("no_face", 0);
          onNoFaceDetected?.();
        }
      } else if (count === 1) {
        // Single face detected (expected state)
        if (wasNoFaceRef.current) {
          wasNoFaceRef.current = false;
          setNoFaceAlertActive(false);
          addEvent("face_returned", 1);
          onFaceReturned?.();
        }
        noFaceStartRef.current = null;
        setNoFaceDuration(0);
      } else if (count > 1) {
        // Multiple faces detected
        addEvent("multiple_faces", count);
        onMultipleFaces?.(count);
        noFaceStartRef.current = null;
        setNoFaceDuration(0);
      }
    };

    // Initial detection after short delay
    const initialTimeout = setTimeout(runDetection, 1000);

    // Periodic detection
    const intervalId = setInterval(runDetection, detectionIntervalMs);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(intervalId);
    };
  }, [enabled, detectionIntervalMs, noFaceThresholdMs, detectFaces, addEvent, onNoFaceDetected, onFaceReturned, onMultipleFaces]);

  return {
    isSupported,
    isDetecting,
    faceCount,
    noFaceAlertActive,
    noFaceDuration,
    events,
    attachVideo,
  };
};
