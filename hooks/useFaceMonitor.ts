"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import type { ViolationType } from "./useIntegrityMonitor";

// ─── Types ────────────────────────────────────────────────────────────────────

export type FaceStatus =
  | "idle"          // Not started yet
  | "requesting"    // Asking for camera permission
  | "denied"        // Permission denied
  | "loading"       // MediaPipe loading
  | "ok"            // 1 face detected, looking at screen
  | "absent"        // 0 faces detected
  | "multiple"      // 2+ faces
  | "looking_away"; // Face present but gaze off-screen

export interface FaceMonitorState {
  faceStatus: FaceStatus;
  faceCount: number;
  cameraEnabled: boolean;
  modelLoading: boolean;
  initCamera: () => Promise<boolean>;
  stopCamera: () => void;
}

// Heuristic: if the face bounding box top is in the lower 82% of frame
// the user is likely looking down at notes (increased to prevent false positives)
const LOOKING_DOWN_THRESHOLD = 0.82;

// How long (ms) face must be absent before firing violation
const ABSENT_DEBOUNCE_MS = 3000;

// Detection interval (ms)
const DETECTION_INTERVAL_MS = 2000;

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useFaceMonitor(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  active: boolean,
  onViolation: (type: ViolationType, detail?: string) => void
): FaceMonitorState {
  const [faceStatus, setFaceStatus] = useState<FaceStatus>("idle");
  const [faceCount, setFaceCount] = useState(0);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [modelLoading, setModelLoading] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const detectorRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const absentTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const absentFiredRef = useRef(false);
  const lookingAwayCountRef = useRef(0);

  const stopCamera = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (absentTimerRef.current) clearTimeout(absentTimerRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraEnabled(false);
    setFaceStatus("idle");
    setFaceCount(0);
    lookingAwayCountRef.current = 0;
  }, []);

  const initCamera = useCallback(async (): Promise<boolean> => {
    setFaceStatus("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCameraEnabled(true);
      setFaceStatus("loading");
      setModelLoading(true);
      return true;
    } catch {
      setFaceStatus("denied");
      onViolation("webcam_denied", "User denied camera permission");
      return false;
    }
  }, [videoRef, onViolation]);

  // Keep video srcObject in sync with streamRef.current when mounts/changes
  useEffect(() => {
    if (cameraEnabled && streamRef.current && videoRef.current) {
      const video = videoRef.current;
      if (video.srcObject !== streamRef.current) {
        video.srcObject = streamRef.current;
        video.play().catch((err) => console.error("[FaceMonitor] Error playing video:", err));
      }
    }
  }, [cameraEnabled, videoRef]);

  // Load MediaPipe FaceDetector
  useEffect(() => {
    if (!cameraEnabled) return;

    let cancelled = false;

    const loadDetector = async () => {
      try {
        // Dynamic import to avoid SSR issues
        const { FaceDetector, FilesetResolver } = await import("@mediapipe/tasks-vision");

        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );

        if (cancelled) return;

        const detector = await FaceDetector.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          minDetectionConfidence: 0.5,
          minSuppressionThreshold: 0.3,
        });

        if (cancelled) {
          detector.close();
          return;
        }

        detectorRef.current = detector;
        setModelLoading(false);
        setFaceStatus("ok");
      } catch (err) {
        console.error("[FaceMonitor] Failed to load MediaPipe:", err);
        setModelLoading(false);
        setFaceStatus("ok"); // Degrade gracefully — don't block assessment
      }
    };

    loadDetector();
    return () => { cancelled = true; };
  }, [cameraEnabled]);

  // Run detection loop
  useEffect(() => {
    if (!active || !cameraEnabled || modelLoading || !detectorRef.current) return;

    const detect = () => {
      const video = videoRef.current;
      const detector = detectorRef.current;
      if (!video || !detector || video.readyState < 2) return;

      try {
        const results = detector.detectForVideo(video, performance.now());
        
        // Filter out detections that are too small (likely false positive background noise or objects far away)
        const validDetections = (results.detections ?? []).filter((d: any) => {
          if (!d.boundingBox) return false;
          if (video.videoWidth > 0 && video.videoHeight > 0) {
            const widthRatio = d.boundingBox.width / video.videoWidth;
            const heightRatio = d.boundingBox.height / video.videoHeight;
            // A face occupying less than 8% of either dimension is likely noise
            if (widthRatio < 0.08 || heightRatio < 0.08) {
              return false;
            }
          }
          return true;
        });

        const count = validDetections.length;
        setFaceCount(count);

        let localIsLookingAway = false;

        if (count === 0) {
          setFaceStatus("absent");
          lookingAwayCountRef.current = 0;
          // Start absent timer if not already running
          if (!absentTimerRef.current) {
            absentTimerRef.current = setTimeout(() => {
              if (!absentFiredRef.current) {
                absentFiredRef.current = true;
                onViolation("face_absent", "No face detected for 3+ seconds");
              }
              absentTimerRef.current = null;
            }, ABSENT_DEBOUNCE_MS);
          }
        } else {
          // Face detected — clear absent timer
          if (absentTimerRef.current) {
            clearTimeout(absentTimerRef.current);
            absentTimerRef.current = null;
          }
          absentFiredRef.current = false;

          if (count > 1) {
            setFaceStatus("multiple");
            lookingAwayCountRef.current = 0;
            onViolation("multiple_faces", `${count} faces detected in frame`);
          } else {
            // Single face — check if looking down or looking away horizontally
            const detection = validDetections[0];
            const bbox = detection?.boundingBox;
            const keypoints = detection?.keypoints;
            let isLookingAway = false;
            let lookingAwayDetail = "";

            if (bbox && video.videoHeight > 0) {
              const faceCenterYRatio = (bbox.originY + bbox.height / 2) / video.videoHeight;
              if (faceCenterYRatio > LOOKING_DOWN_THRESHOLD) {
                isLookingAway = true;
                lookingAwayDetail = `Looking down (face center at ${Math.round(faceCenterYRatio * 100)}% of frame)`;
              }
            }

            // Check horizontal face turn using eye-nose symmetry ratio
            if (!isLookingAway && keypoints && keypoints[0] && keypoints[1] && keypoints[2]) {
              const eyeRight = keypoints[0]; // Right Eye
              const eyeLeft = keypoints[1];  // Left Eye
              const nose = keypoints[2];     // Nose Tip

              const distRight = Math.abs(nose.x - eyeRight.x);
              const distLeft = Math.abs(nose.x - eyeLeft.x);
              const totalDist = distRight + distLeft;

              if (totalDist > 0) {
                const ratio = Math.max(distRight, distLeft) / totalDist;
                // A ratio > 0.78 represents a significant head turn (nose is very close to one of the eyes horizontally)
                if (ratio > 0.78) {
                  isLookingAway = true;
                  lookingAwayDetail = `Face turned sideways (symmetry ratio: ${Math.round(ratio * 100)}%)`;
                }
              }
            }

            if (isLookingAway) {
              localIsLookingAway = true;
              setFaceStatus("looking_away");
              lookingAwayCountRef.current += 1;
              if (lookingAwayCountRef.current >= 2) {
                onViolation("looking_away", lookingAwayDetail);
              }
            } else {
              setFaceStatus("ok");
              lookingAwayCountRef.current = 0;
            }
          }
        }

        // Draw debug overlay on canvas (optional, shows detection box and keypoints)
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            validDetections.forEach((d: any) => {
              if (!d.boundingBox) return;
              const { originX, originY, width, height } = d.boundingBox;
              const scaleX = canvas.width / video.videoWidth;
              const scaleY = canvas.height / video.videoHeight;
              ctx.strokeStyle = count > 1 ? "#f43f5e" : localIsLookingAway ? "#f97316" : "#10b981";
              ctx.lineWidth = 2;
              ctx.strokeRect(
                originX * scaleX,
                originY * scaleY,
                width * scaleX,
                height * scaleY
              );

              // Draw keypoints for eyes and nose
              if (d.keypoints) {
                // index 0: Right Eye, index 1: Left Eye, index 2: Nose Tip
                d.keypoints.slice(0, 3).forEach((kp: any, idx: number) => {
                  const x = kp.x * canvas.width;
                  const y = kp.y * canvas.height;
                  ctx.fillStyle = idx === 2 ? "#3b82f6" : "#ec4899"; // nose is blue, eyes are pink
                  ctx.beginPath();
                  ctx.arc(x, y, 3.5, 0, 2 * Math.PI);
                  ctx.fill();
                });
              }
            });
          }
        }
      } catch {
        // Silently skip failed frames
      }
    };

    intervalRef.current = setInterval(detect, DETECTION_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [active, cameraEnabled, modelLoading, videoRef, canvasRef, onViolation]);

  return { faceStatus, faceCount, cameraEnabled, modelLoading, initCamera, stopCamera };
}

// ─── Status helpers ───────────────────────────────────────────────────────────

export function getFaceStatusDisplay(status: FaceStatus): { icon: string; label: string; color: string } {
  switch (status) {
    case "ok": return { icon: "🟢", label: "Face OK", color: "#10b981" };
    case "absent": return { icon: "🔴", label: "No Face", color: "#f43f5e" };
    case "multiple": return { icon: "🟡", label: "Multiple Faces", color: "#f59e0b" };
    case "looking_away": return { icon: "🟠", label: "Looking Away", color: "#f97316" };
    case "loading": return { icon: "⚪", label: "Loading AI...", color: "#94a3b8" };
    case "denied": return { icon: "❌", label: "Camera Denied", color: "#f43f5e" };
    case "requesting": return { icon: "⏳", label: "Requesting...", color: "#94a3b8" };
    default: return { icon: "⚪", label: "Idle", color: "#475569" };
  }
}
