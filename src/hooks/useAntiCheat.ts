import { useState, useEffect, useCallback, useRef } from "react";

export interface ActivityLog {
  timestamp: Date;
  type: "tab_switch" | "fullscreen_exit" | "right_click" | "copy_attempt" | "paste_attempt" | "screenshot_attempt" | "warning_shown";
  details?: string;
}

export interface AntiCheatState {
  isFullscreen: boolean;
  tabSwitchCount: number;
  activityLogs: ActivityLog[];
  violations: number;
  isBlocked: boolean;
}

interface UseAntiCheatOptions {
  maxViolations?: number;
  onMaxViolationsReached?: () => void;
  enableFullscreenEnforcement?: boolean;
  enableTabSwitchDetection?: boolean;
  enableRightClickPrevention?: boolean;
  enableCopyPastePrevention?: boolean;
}

export const useAntiCheat = (options: UseAntiCheatOptions = {}) => {
  const {
    maxViolations = 3,
    onMaxViolationsReached,
    enableFullscreenEnforcement = true,
    enableTabSwitchDetection = true,
    enableRightClickPrevention = true,
    enableCopyPastePrevention = true,
  } = options;

  const [state, setState] = useState<AntiCheatState>({
    isFullscreen: false,
    tabSwitchCount: 0,
    activityLogs: [],
    violations: 0,
    isBlocked: false,
  });

  const violationsRef = useRef(0);

  const addLog = useCallback((type: ActivityLog["type"], details?: string) => {
    const log: ActivityLog = {
      timestamp: new Date(),
      type,
      details,
    };
    setState((prev) => ({
      ...prev,
      activityLogs: [...prev.activityLogs, log],
    }));
    console.log(`[Anti-Cheat] ${type}: ${details || ""}`);
  }, []);

  const addViolation = useCallback(() => {
    violationsRef.current += 1;
    setState((prev) => {
      const newViolations = prev.violations + 1;
      const isBlocked = newViolations >= maxViolations;
      
      if (isBlocked && onMaxViolationsReached) {
        onMaxViolationsReached();
      }
      
      return {
        ...prev,
        violations: newViolations,
        isBlocked,
      };
    });
  }, [maxViolations, onMaxViolationsReached]);

  // Request fullscreen
  const requestFullscreen = useCallback(async () => {
    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if ((elem as any).webkitRequestFullscreen) {
        await (elem as any).webkitRequestFullscreen();
      } else if ((elem as any).msRequestFullscreen) {
        await (elem as any).msRequestFullscreen();
      }
      setState((prev) => ({ ...prev, isFullscreen: true }));
      return true;
    } catch (error) {
      console.error("Failed to enter fullscreen:", error);
      return false;
    }
  }, []);

  // Exit fullscreen
  const exitFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
  }, []);

  // Handle fullscreen change
  useEffect(() => {
    if (!enableFullscreenEnforcement) return;

    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!document.fullscreenElement;
      setState((prev) => ({ ...prev, isFullscreen: isCurrentlyFullscreen }));
      
      if (!isCurrentlyFullscreen && violationsRef.current < maxViolations) {
        addLog("fullscreen_exit", "User exited fullscreen mode");
        addViolation();
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
    };
  }, [enableFullscreenEnforcement, addLog, addViolation, maxViolations]);

  // Handle visibility change (tab switch)
  useEffect(() => {
    if (!enableTabSwitchDetection) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        addLog("tab_switch", "User switched away from exam tab");
        addViolation();
        setState((prev) => ({
          ...prev,
          tabSwitchCount: prev.tabSwitchCount + 1,
        }));
      }
    };

    // Handle window blur (clicking outside browser)
    const handleWindowBlur = () => {
      addLog("tab_switch", "Window lost focus");
      addViolation();
      setState((prev) => ({
        ...prev,
        tabSwitchCount: prev.tabSwitchCount + 1,
      }));
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, [enableTabSwitchDetection, addLog, addViolation]);

  // Prevent right-click
  useEffect(() => {
    if (!enableRightClickPrevention) return;

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      addLog("right_click", "Right-click attempt blocked");
    };

    document.addEventListener("contextmenu", handleContextMenu);
    
    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [enableRightClickPrevention, addLog]);

  // Prevent copy/paste and screenshot attempts
  useEffect(() => {
    if (!enableCopyPastePrevention) return;

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      addLog("copy_attempt", "Copy attempt blocked");
    };

    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      addLog("paste_attempt", "Paste attempt blocked");
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent PrintScreen
      if (e.key === "PrintScreen") {
        e.preventDefault();
        addLog("screenshot_attempt", "PrintScreen key blocked");
      }
      
      // Prevent Ctrl+C, Ctrl+V, Ctrl+P, Ctrl+S
      if (e.ctrlKey || e.metaKey) {
        if (["c", "v", "p", "s", "a"].includes(e.key.toLowerCase())) {
          e.preventDefault();
          addLog("copy_attempt", `Keyboard shortcut Ctrl+${e.key.toUpperCase()} blocked`);
        }
      }
      
      // Prevent F12 (DevTools)
      if (e.key === "F12") {
        e.preventDefault();
        addLog("copy_attempt", "DevTools shortcut blocked");
      }
    };

    document.addEventListener("copy", handleCopy);
    document.addEventListener("paste", handlePaste);
    document.addEventListener("keydown", handleKeyDown);
    
    return () => {
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("paste", handlePaste);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [enableCopyPastePrevention, addLog]);

  // Prevent text selection via CSS
  useEffect(() => {
    if (!enableCopyPastePrevention) return;

    const style = document.createElement("style");
    style.innerHTML = `
      .exam-content {
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, [enableCopyPastePrevention]);

  return {
    ...state,
    requestFullscreen,
    exitFullscreen,
    addLog,
    remainingViolations: maxViolations - state.violations,
  };
};
