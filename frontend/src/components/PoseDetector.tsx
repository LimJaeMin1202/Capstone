import { useEffect, useRef, useState } from "react";
import * as poseDetection from "@tensorflow-models/pose-detection";
import * as tf from "@tensorflow/tfjs";
import type { CameraPosition, ExerciseMode } from "../data/exerciseGuides";
import type { Exercise } from "../types/exercise";
import { ExerciseSession, type SessionStats } from "../utils/exerciseSession";
import { analyzePose, isVisibleKeypoint } from "../utils/pose";

const CONNECTIONS: [number, number][] = [
  [0, 1], [0, 2], [1, 3], [2, 4],
  [5, 6], [5, 7], [7, 9], [6, 8], [8, 10],
  [5, 11], [6, 12], [11, 12],
  [11, 13], [13, 15], [12, 14], [14, 16],
];

const VIDEO_WIDTH = 640;
const VIDEO_HEIGHT = 480;
const UI_INTERVAL_MS = 200;
const COUNTDOWN_START = 3;

type Phase = "loading" | "ready" | "countdown" | "exercising" | "finished";

interface Props {
  exercise: Exercise;
  holdSeconds: number;
  mode: ExerciseMode;
  cameraPosition: CameraPosition;
  onComplete: (stats: SessionStats, sessionId: string) => Promise<void>;
}

interface Feedback {
  msg: string;
  color: string;
}

const GUIDE_COLOR = "#2f9e8f";
const WARNING_COLOR = "#a65b00";

function cameraErrorMessage(error: unknown): string {
  const name = error instanceof Error ? error.name : "";
  if (name === "NotAllowedError") return "주소창에서 카메라 권한을 허용해 주세요.";
  if (name === "NotFoundError") return "카메라가 연결되어 있는지 확인해 주세요.";
  if (name === "NotReadableError" || name === "AbortError") {
    return "카메라를 사용하는 다른 앱이나 탭을 닫고 다시 시도해 주세요.";
  }
  return error instanceof Error ? error.message : "카메라를 다시 연결해 주세요.";
}

async function openCamera(signal: AbortSignal): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("이 브라우저에서는 카메라를 사용할 수 없어요.");
  }
  try {
    return await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { width: { ideal: VIDEO_WIDTH }, height: { ideal: VIDEO_HEIGHT }, facingMode: "user" },
    });
  } catch (error) {
    const name = error instanceof Error ? error.name : "";
    if (name !== "NotReadableError" && name !== "AbortError") throw error;
    // 카메라 드라이버가 직전 스트림을 놓을 시간을 준다.
    await new Promise((resolve) => window.setTimeout(resolve, 750));
    signal.throwIfAborted();
    return navigator.mediaDevices.getUserMedia({ audio: false, video: true });
  }
}

async function waitForVideo(video: HTMLVideoElement, signal: AbortSignal) {
  if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
    await new Promise<void>((resolve, reject) => {
      function settle(error?: unknown) {
        window.clearTimeout(timeout);
        video.removeEventListener("loadeddata", handleLoaded);
        video.removeEventListener("error", handleError);
        signal.removeEventListener("abort", handleAbort);
        if (error) reject(error);
        else resolve();
      }
      const handleLoaded = () => settle();
      const handleError = () => settle(new Error("카메라 영상을 불러오지 못했어요."));
      const handleAbort = () => settle(signal.reason);
      const timeout = window.setTimeout(handleError, 10000);
      video.addEventListener("loadeddata", handleLoaded, { once: true });
      video.addEventListener("error", handleError, { once: true });
      signal.addEventListener("abort", handleAbort, { once: true });
      if (signal.aborted) handleAbort();
    });
  }
  signal.throwIfAborted();
  await video.play();
}

function drawSkeleton(canvas: HTMLCanvasElement, video: HTMLVideoElement, keypoints: poseDetection.Keypoint[]) {
  if (canvas.width !== video.videoWidth) canvas.width = video.videoWidth;
  if (canvas.height !== video.videoHeight) canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#00e5ff";
  for (const [i, j] of CONNECTIONS) {
    const a = keypoints[i];
    const b = keypoints[j];
    if (!isVisibleKeypoint(a) || !isVisibleKeypoint(b)) continue;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
  ctx.fillStyle = "#ff4081";
  for (const point of keypoints) {
    if (!isVisibleKeypoint(point)) continue;
    ctx.beginPath();
    ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
    ctx.fill();
  }
  ctx.restore();
}

export default function PoseDetector({ exercise, holdSeconds, mode, cameraPosition, onComplete }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoWrapRef = useRef<HTMLDivElement>(null);
  const phaseRef = useRef<Phase>("loading");
  const sessionRef = useRef<ExerciseSession | null>(null);
  const countdownTimer = useRef<number | null>(null);
  const saveRef = useRef<{ stats: SessionStats; sessionId: string } | null>(null);
  const savingRef = useRef(false);

  const [phase, setPhase] = useState<Phase>("loading");
  const [status, setStatus] = useState("카메라 연결 중...");
  const [feedback, setFeedback] = useState<Feedback>({ msg: "카메라와 모델을 준비하고 있어요", color: GUIDE_COLOR });
  const [countdown, setCountdown] = useState<number | null>(null);
  const [holdCountdown, setHoldCountdown] = useState<number | null>(null);
  const [count, setCount] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [angleText, setAngleText] = useState("-");
  const [totalHoldSec, setTotalHoldSec] = useState(0);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraAttempt, setCameraAttempt] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreen = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFullscreen);
    const timer = window.setInterval(() => {
      if (phaseRef.current === "exercising" && sessionRef.current) {
        setElapsed(sessionRef.current.stats(performance.now()).duration);
      }
    }, 1000);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreen);
      window.clearInterval(timer);
      if (countdownTimer.current !== null) window.clearInterval(countdownTimer.current);
    };
  }, []);

  async function toggleFullscreen() {
    const element = videoWrapRef.current;
    if (!element) return;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await element.requestFullscreen();
    } catch {
      // Fullscreen API가 없는 브라우저에서는 현재 화면을 유지한다.
    }
  }

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const abort = new AbortController();
    let stream: MediaStream | null = null;
    let detector: poseDetection.PoseDetector | null = null;
    let frame: number | null = null;
    let estimating = false;
    let lastVideoTime = -1;
    let lastFreshFrameTime = performance.now();
    let lastUpdatedAt = 0;
    let lastMessage = "";

    function disposeModel() {
      detector?.dispose();
      detector = null;
    }

    function stop() {
      if (abort.signal.aborted) return;
      abort.abort();
      if (frame !== null) cancelAnimationFrame(frame);
      for (const track of stream?.getTracks() ?? []) {
        track.removeEventListener("ended", trackEnded);
        track.stop();
      }
      if (video!.srcObject === stream) video!.srcObject = null;
      if (!estimating) disposeModel();
    }

    function cameraFailed(message: string) {
      if (abort.signal.aborted || phaseRef.current === "finished") return;
      stop();
      if (countdownTimer.current !== null) {
        window.clearInterval(countdownTimer.current);
        countdownTimer.current = null;
        setCountdown(null);
      }
      if (!sessionRef.current) {
        phaseRef.current = "loading";
        setPhase("loading");
      }
      sessionRef.current?.interrupt();
      setCameraError(message);
      setStatus("");
      setFeedback({ msg: message, color: WARNING_COLOR });
      setHoldCountdown(null);
      setAngleText("-");
    }

    function trackEnded() {
      cameraFailed("카메라 연결이 끊겼어요. 다시 연결해 주세요.");
    }

    function updateExercise(points: poseDetection.Keypoint[], now: number) {
      const session = sessionRef.current;
      if (phaseRef.current !== "exercising" || !session) return;
      const pose = analyzePose(points, exercise, session.activeSide);
      const progress = session.observe(pose, now);
      let message = pose.hint ?? "운동 자세를 천천히 만들어 보세요";
      let color = GUIDE_COLOR;

      if (progress.kind === "missing") {
        message = pose.hint ?? "필요한 관절이 화면에 보이게 해주세요";
        color = WARNING_COLOR;
      } else if (progress.counted) {
        message = "🎉 " + progress.count + "회 완료! 다음 자세 준비";
        color = "#1e9e54";
      } else if (progress.phase === "satisfied") {
        message = mode === "hold" ? "목표 시간에 도달했어요" : "충분해요! 천천히 자세를 풀어 주세요";
        color = "#1e9e54";
      } else if (progress.kind === "matched") {
        message = progress.started ? "자세 잡았어요! 유지해 주세요" : "자세 유지 중이에요";
      } else {
        color = WARNING_COLOR;
      }

      if (message !== lastMessage) {
        lastMessage = message;
        setFeedback({ msg: message, color });
      }
      if (progress.completed || progress.counted || progress.kind === "missing" || now - lastUpdatedAt >= UI_INTERVAL_MS) {
        lastUpdatedAt = now;
        const angles = [pose.left && "왼 " + pose.left.angle + "°", pose.right && "오른 " + pose.right.angle + "°"];
        setAngleText(angles.filter(Boolean).join("\n") || "-");
        setHoldCountdown(progress.kind === "missing" ? null : progress.remainingSeconds);
        setCount(progress.count);
        setTotalHoldSec(progress.totalHoldSeconds);
      }
    }

    async function detectFrame() {
      if (abort.signal.aborted || !detector) return;
      if (phaseRef.current === "finished") {
        stop();
        return;
      }
      const captureTime = performance.now();
      if (document.hidden) {
        lastFreshFrameTime = captureTime;
        sessionRef.current?.interrupt();
      } else if (video!.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video!.currentTime !== lastVideoTime) {
        const duringExercise = phaseRef.current === "exercising";
        lastVideoTime = video!.currentTime;
        lastFreshFrameTime = captureTime;
        estimating = true;
        try {
          const poses = await detector.estimatePoses(video!);
          if (abort.signal.aborted) return;
          const points = poses[0]?.keypoints ?? [];
          drawSkeleton(canvas!, video!, points);
          if (duringExercise) updateExercise(points, captureTime);
        } catch {
          cameraFailed("자세 인식이 멈췄어요. 카메라를 다시 연결해 주세요.");
        } finally {
          estimating = false;
          if (abort.signal.aborted) disposeModel();
        }
      } else if (captureTime - lastFreshFrameTime >= 2000) {
        cameraFailed("카메라 영상이 멈췄어요. 다시 연결해 주세요.");
      }
      if (!abort.signal.aborted) frame = requestAnimationFrame(detectFrame);
    }

    async function initialize() {
      try {
        const opened = await openCamera(abort.signal);
        if (abort.signal.aborted) {
          opened.getTracks().forEach((track) => track.stop());
          return;
        }
        stream = opened;
        opened.getVideoTracks().forEach((track) => track.addEventListener("ended", trackEnded));
        video!.srcObject = opened;
        await waitForVideo(video!, abort.signal);
        abort.signal.throwIfAborted();
        setStatus("자세 인식 모델 준비 중...");
        if (!await tf.setBackend("webgl")) throw new Error("자세 인식에 필요한 그래픽 기능을 사용할 수 없어요.");
        await tf.ready();
        abort.signal.throwIfAborted();
        const model = await poseDetection.createDetector(
          poseDetection.SupportedModels.MoveNet,
          { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING },
        );
        if (abort.signal.aborted || phaseRef.current === "finished") {
          model.dispose();
          stop();
          return;
        }
        detector = model;
        if (phaseRef.current === "exercising") {
          setFeedback({ msg: "카메라가 연결됐어요. 운동을 이어가세요", color: GUIDE_COLOR });
        } else {
          phaseRef.current = "ready";
          setPhase("ready");
          setStatus("준비 완료");
          setFeedback({ msg: "시작 버튼을 누르면 운동이 시작돼요", color: GUIDE_COLOR });
        }
        lastFreshFrameTime = performance.now();
        frame = requestAnimationFrame(detectFrame);
      } catch (error) {
        cameraFailed(cameraErrorMessage(error));
      }
    }

    void initialize();
    return stop;
  }, [cameraAttempt, exercise, mode]);

  function retryCamera() {
    setCameraError(null);
    setStatus("카메라 연결 중...");
    setFeedback({ msg: "카메라를 다시 연결하고 있어요", color: GUIDE_COLOR });
    setCameraAttempt((attempt) => attempt + 1);
  }

  function handleStart() {
    if (phaseRef.current !== "ready" || cameraError) return;
    phaseRef.current = "countdown";
    setPhase("countdown");
    let remaining = COUNTDOWN_START;
    setCountdown(remaining);
    const timer = window.setInterval(() => {
      remaining--;
      if (remaining > 0) {
        setCountdown(remaining);
        return;
      }
      window.clearInterval(timer);
      countdownTimer.current = null;
      const now = performance.now();
      sessionRef.current = new ExerciseSession(mode, holdSeconds, now);
      setCountdown(null);
      phaseRef.current = "exercising";
      setPhase("exercising");
      setFeedback({ msg: "운동 자세를 만들어 볼까요?", color: GUIDE_COLOR });
    }, 1000);
    countdownTimer.current = timer;
  }

  async function handleFinish() {
    if (savingRef.current || !sessionRef.current) return;
    const snapshot = saveRef.current ?? {
      stats: sessionRef.current.stats(performance.now()),
      sessionId: crypto.randomUUID(),
    };
    saveRef.current = snapshot;
    savingRef.current = true;
    setSaving(true);
    setSaveError(null);
    setCameraError(null);
    setStatus("");
    setElapsed(snapshot.stats.duration);
    phaseRef.current = "finished";
    setPhase("finished");
    try {
      await onComplete(snapshot.stats, snapshot.sessionId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "잠시 뒤 다시 시도해 주세요.";
      setSaveError("기록을 저장하지 못했어요. " + message);
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  return (
    <div className="pose-area">
      <div className="pose-video-col">
        <div className="video-wrap" ref={videoWrapRef}>
          <div className="video-inner">
            <video ref={videoRef} autoPlay muted playsInline className="cam-video" />
            <canvas
              ref={canvasRef}
              width={VIDEO_WIDTH}
              height={VIDEO_HEIGHT}
              className="cam-canvas"
            />

            {/* 전체화면 토글 버튼 (우하단) */}
            <button
              type="button"
              className="fullscreen-btn"
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? "전체화면 끄기" : "전체화면"}
              title={isFullscreen ? "전체화면 끄기" : "전체화면"}
            >
              {isFullscreen ? (
                // 축소 — 모서리 L자가 안쪽을 향함
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 3v6H3M15 3v6h6M9 21v-6H3M15 21v-6h6" />
                </svg>
              ) : (
                // 확대 — 모서리 L자가 바깥을 향함
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 9V3h6M21 9V3h-6M3 15v6h6M21 15v6h-6" />
                </svg>
              )}
            </button>

          {/* 상태 chip (좌상단) — 운동 중엔 숨김 (그땐 우측 패널 피드백이 안내) */}
          {status && phase !== "exercising" && phase !== "finished" && (
            <div className="pose-status-chip">{status}</div>
          )}

          {/* 준비 완료 → 시작 버튼 오버레이 + 카메라 위치 안내 */}
          {phase === "ready" && !cameraError && (
            <div className="video-overlay video-overlay-ready">
              <div className="ready-guide">
                <div className="ready-guide-title">
                  카메라를 {cameraPosition === "측면" ? "옆쪽" : cameraPosition} 1.5~2m
                  거리에 두세요
                </div>
                <div className="ready-guide-sub">
                  {cameraPosition === "측면"
                    ? "이 운동은 옆모습으로 측정해요. 머리부터 발끝까지 옆모습이 보이게 해주세요."
                    : cameraPosition === "대각선"
                      ? "몸 앞쪽 움직임과 양쪽 관절이 보이도록 앞옆으로 카메라를 놓아 주세요."
                      : "머리부터 발끝까지 앞모습이 전부 보이게 충분히 떨어져 주세요."}
                </div>
              </div>
              <button className="start-btn" onClick={handleStart}>
                ▶ 운동 시작
              </button>
            </div>
          )}

          {cameraError && phase !== "finished" && (
            <div className="video-overlay video-overlay-ready">
              <p className="ready-guide-title">{cameraError}</p>
              <button type="button" className="start-btn" onClick={retryCamera}>카메라 다시 연결</button>
            </div>
          )}

          {/* 카운트다운 오버레이 */}
          {phase === "countdown" && countdown !== null && (
            <div className="video-overlay">
              <div key={countdown} className="countdown-num">
                {countdown}
              </div>
            </div>
          )}

          {/* 자세 유지 시간 표시 (holding 중일 때만, 우상단) */}
          {phase === "exercising" && holdCountdown !== null && (
            <div className="hold-countdown-badge">{holdCountdown}</div>
          )}

          {/* 운동 중 핵심 통계 (영상 좌상단) — 전체화면일 때만 보이게 */}
          {phase === "exercising" && isFullscreen && (
            <div className="pose-count-overlay">
              <div className="pose-count-cell">
                <div className="pose-count-value">
                  {mode === "hold" ? totalHoldSec : count}
                </div>
                <div className="pose-count-label">
                  {mode === "hold" ? "초 유지" : "회"}
                </div>
              </div>
              <div className="pose-count-divider" />
              <div className="pose-count-cell">
                <div className="pose-count-value">{formatElapsed(elapsed)}</div>
                <div className="pose-count-label">시간</div>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>

      <div className="pose-panel">
        <div className="feedback-box" role="status" style={{ background: feedback.color }}>
          {feedback.msg}
        </div>
        <div className="info-grid">
          {mode === "hold" ? (
            <>
              <InfoBox value={`${totalHoldSec}초`} label="🔥 누적 유지 시간" />
              <InfoBox value={`${holdSeconds}초`} label="🎯 목표 유지 시간" />
            </>
          ) : (
            <>
              <InfoBox value={String(count)} label="✅ 운동 횟수" />
              <InfoBox value={`${holdSeconds}초`} label="🎯 1회 유지 시간" />
            </>
          )}
          <InfoBox value={`${elapsed}s`} label="⏱ 운동 시간" />
          <InfoBox value={angleText} label="📐 현재 각도" className="angle-info-box" />
        </div>
        {saveError && <p className="state-msg error" role="alert">{saveError}</p>}
        {(phase === "exercising" || phase === "finished") && (
          <button type="button" className="finish-btn" onClick={handleFinish} disabled={saving}>
            {saving ? "기록 저장 중..." : saveError ? "기록 저장 다시 시도" : "운동 완료 & 기록 저장"}
          </button>
        )}
      </div>
    </div>
  );
}

function InfoBox({ value, label, className }: { value: string; label: string; className?: string }) {
  return (
    <div className={className ? `info-box ${className}` : "info-box"}>
      <div className="info-value">{value}</div>
      <div className="info-label">{label}</div>
    </div>
  );
}

// 운동 시간 포맷 — 60초 이상이면 M:SS, 미만은 N초
function formatElapsed(s: number): string {
  if (s < 60) return `${s}초`;
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}
