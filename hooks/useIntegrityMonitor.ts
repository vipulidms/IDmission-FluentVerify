"use client";
import { useEffect, useRef, useState, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ViolationType =
  | "tab_switch"
  | "window_blur"
  | "copy_attempt"
  | "paste_attempt"
  | "right_click"
  | "mouse_leave"
  | "fullscreen_exit"
  | "keyboard_shortcut"
  | "large_paste"
  | "face_absent"
  | "multiple_faces"
  | "looking_away"
  | "webcam_denied";


export interface Violation {
  type: ViolationType;
  timestamp: string; // ISO
  detail?: string;
}

export type RiskLevel = "low" | "medium" | "high";

export interface IntegrityReport {
  violations: Violation[];
  violationCount: number;
  riskLevel: RiskLevel;
  flagged: boolean;
}

export interface ToastWarning {
  id: string;
  message: string;
  icon: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const VIOLATION_LABELS: Record<ViolationType, { icon: string; message: string }> = {
  tab_switch:        { icon: "👁️", message: "Please stay on this tab during the assessment." },
  window_blur:       { icon: "👁️", message: "We noticed you left this window." },
  copy_attempt:      { icon: "📋", message: "Copying content is not allowed during an assessment." },
  paste_attempt:     { icon: "📋", message: "Pasting content is not allowed during an assessment." },
  right_click:       { icon: "🖱️", message: "Right-click menus are disabled during an assessment." },
  mouse_leave:       { icon: "🖱️", message: "Please keep your mouse within the assessment window." },
  fullscreen_exit:   { icon: "🖥️", message: "Please remain in fullscreen mode during the assessment." },
  keyboard_shortcut: { icon: "⌨️", message: "Keyboard shortcuts are restricted during an assessment." },
  large_paste:       { icon: "📝", message: "Pasting large blocks of text is not allowed." },
  face_absent:       { icon: "😶", message: "No face detected — please stay in front of the camera." },
  multiple_faces:    { icon: "👥", message: "Multiple people detected in frame. Assistance is not allowed." },
  looking_away:      { icon: "👀", message: "You appear to be looking away from the screen." },
  webcam_denied:     { icon: "📷", message: "Camera access was denied. Integrity monitoring is limited." },
};


// Flag after this many violations
const FLAG_THRESHOLD = 3;

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useIntegrityMonitor(active: boolean) {
  const [violations, setViolations] = useState<Violation[]>([]);
  const [toasts, setToasts] = useState<ToastWarning[]>([]);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const violationsRef = useRef<Violation[]>([]);
  const activeToastTypesRef = useRef<Set<ViolationType>>(new Set());

  // Keep ref in sync so event handlers don't close over stale state
  useEffect(() => {
    violationsRef.current = violations;
  }, [violations]);

  const addViolation = useCallback((type: ViolationType, detail?: string) => {
    const v: Violation = { type, timestamp: new Date().toISOString(), detail };
    violationsRef.current = [...violationsRef.current, v];
    setViolations([...violationsRef.current]);

    // Show toast if not already active
    if (activeToastTypesRef.current.has(type)) {
      return;
    }

    const meta = VIOLATION_LABELS[type];
    const toastId = `${type}-${Date.now()}`;
    const toast: ToastWarning = { id: toastId, message: meta.message, icon: meta.icon };
    
    activeToastTypesRef.current.add(type);
    setToasts((prev) => [...prev, toast]);

    // Auto-dismiss toast after 4s
    setTimeout(() => {
      activeToastTypesRef.current.delete(type);
      setToasts((prev) => prev.filter((t) => t.id !== toastId));
    }, 4000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    const lastIndex = id.lastIndexOf("-");
    if (lastIndex !== -1) {
      const type = id.substring(0, lastIndex) as ViolationType;
      activeToastTypesRef.current.delete(type);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    if (!active) return;

    // ── 1. Tab visibility / window blur ──────────────────────────────────────
    const onVisibilityChange = () => {
      if (document.hidden) addViolation("tab_switch");
    };
    const onWindowBlur = () => addViolation("window_blur");

    // ── 2. Copy / paste keyboard shortcuts ───────────────────────────────────
    const onKeyDown = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && (e.key === "c" || e.key === "C")) {
        addViolation("copy_attempt", `key: Ctrl+${e.key}`);
        e.preventDefault();
      }
      if (ctrl && (e.key === "v" || e.key === "V")) {
        addViolation("paste_attempt", `key: Ctrl+${e.key}`);
        e.preventDefault();
      }
      // Block Ctrl+F (find), Ctrl+U (view source), Ctrl+A (select all)
      if (ctrl && ["f", "F", "u", "U", "a", "A"].includes(e.key)) {
        addViolation("keyboard_shortcut", `key: Ctrl+${e.key}`);
        e.preventDefault();
      }
    };

    // ── 3. Copy/paste DOM events (covers right-click copy too) ────────────────
    const onCopy  = () => addViolation("copy_attempt", "copy event");
    const onPaste = (e: ClipboardEvent) => {
      const text = e.clipboardData?.getData("text") ?? "";
      if (text.length > 200) {
        addViolation("large_paste", `${text.length} chars pasted`);
      } else {
        addViolation("paste_attempt", `${text.length} chars pasted`);
      }
      e.preventDefault();
    };

    // ── 4. Right-click / context menu ─────────────────────────────────────────
    const onContextMenu = (e: MouseEvent) => {
      addViolation("right_click");
      e.preventDefault();
    };

    // ── 5. Mouse leave viewport ───────────────────────────────────────────────
    let mouseLeaveDebounce: ReturnType<typeof setTimeout> | null = null;
    const onMouseLeave = (e: MouseEvent) => {
      // Only fire if mouse truly left (not just moved to browser chrome)
      if (e.clientY <= 0 || e.clientX <= 0 || e.clientX >= window.innerWidth || e.clientY >= window.innerHeight) {
        if (!mouseLeaveDebounce) {
          mouseLeaveDebounce = setTimeout(() => {
            addViolation("mouse_leave");
            mouseLeaveDebounce = null;
          }, 500); // debounce 500ms to avoid false positives
        }
      }
    };
    const onMouseEnter = () => {
      if (mouseLeaveDebounce) {
        clearTimeout(mouseLeaveDebounce);
        mouseLeaveDebounce = null;
      }
    };

    // ── 6. Fullscreen exit ────────────────────────────────────────────────────
    const syncFullscreen = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    const onFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
        addViolation("fullscreen_exit");
      } else {
        setIsFullscreen(true);
      }
    };

    // Sync initial fullscreen state
    syncFullscreen();


    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", onWindowBlur);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("copy", onCopy);
    document.addEventListener("paste", onPaste as EventListener);
    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("mouseleave", onMouseLeave);
    document.addEventListener("mouseenter", onMouseEnter);
    document.addEventListener("fullscreenchange", onFullscreenChange);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", onWindowBlur);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("paste", onPaste as EventListener);
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("mouseenter", onMouseEnter);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      if (mouseLeaveDebounce) clearTimeout(mouseLeaveDebounce);
    };
  }, [active, addViolation]);

  // ── Computed values ──────────────────────────────────────────────────────────
  const violationCount = violations.length;
  const riskLevel: RiskLevel =
    violationCount === 0 ? "low" :
    violationCount < FLAG_THRESHOLD ? "medium" : "high";
  const flagged = violationCount >= FLAG_THRESHOLD;

  const getReport = useCallback((): IntegrityReport => ({
    violations: violationsRef.current,
    violationCount: violationsRef.current.length,
    riskLevel:
      violationsRef.current.length === 0 ? "low" :
      violationsRef.current.length < FLAG_THRESHOLD ? "medium" : "high",
    flagged: violationsRef.current.length >= FLAG_THRESHOLD,
  }), []);

  return { violations, violationCount, riskLevel, flagged, isFullscreen, toasts, dismissToast, getReport, addViolation };
}


// ─── Fullscreen helpers ───────────────────────────────────────────────────────

export async function requestFullscreen(): Promise<boolean> {
  try {
    await document.documentElement.requestFullscreen();
    return true;
  } catch {
    return false;
  }
}

export function exitFullscreen(): void {
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {});
  }
}
