import { useEffect, useRef, useState } from "react";
import * as poseDetection from "@tensorflow-models/pose-detection";
import * as tf from "@tensorflow/tfjs";
import type { Exercise } from "../types/exercise";
import { analyzePose } from "../utils/pose";

// MoveNet 관절 연결선
const CONNECTIONS: [number, number][] = [
  [0, 1], [0, 2], [1, 3], [2, 4],
  [5, 6], [5, 7], [7, 9], [6, 8], [8, 10],
  [5, 11], [6, 12], [11, 12],
  [11, 13], [13, 15], [12, 14], [14, 16],
];

const VIDEO_WIDTH = 640;
const VIDEO_HEIGHT = 480;
const MIN_SCORE = 0.3;
const HOLD_MS = 800;
const COOLDOWN_MS = 1500;
const COUNTDOWN_START = 3;

type Phase = "loading" | "ready" | "countdown" | "exercising";

export interface SessionStats {
  goodCount: number;
  duration: number;
  accuracy: number;
}

interface Props {
  exercise: Exercise;
  onComplete: (stats: SessionStats) => void;
}

interface Feedback {
  msg: string;
  color: string;
}

export default function PoseDetector({ exercise, onComplete }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectorRef = useRef<poseDetection.PoseDetector | null>(null);
  const rafRef = useRef<number | null>(null);

  // 타이밍·카운트
  const goodStartRef = useRef<number | null>(null);
  const lastCountRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const countRef = useRef<number>(0);

  // 정확도
  const totalFramesRef = useRef<number>(0);
  const goodFramesRef = useRef<number>(0);

  // UI 안정화
  const leftEmaRef = useRef<number | null>(null);
  const rightEmaRef = useRef<number | null>(null);
  const lastUiRef = useRef<number>(0);
  const lastMsgRef = useRef<string>("");

  // 단계 관리 (detectLoop 클로저에서 보려고 ref 함께 관리)
  const [phase, setPhase] = useState<Phase>("loading");
  const phaseRef = useRef<Phase>("loading");
  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);

  const [status, setStatus] = useState("모델 로딩 중...");
  const [feedback, setFeedback] = useState<Feedback>({
    msg: "AI가 준비되면 시작 버튼이 나타나요",
    color: "#2f9e8f",
  });
  const [count, setCount] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [angleText, setAngleText] = useState("-");

  // phase 변경 시 ref 동기화 (detectLoop 클로저용)
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: VIDEO_WIDTH, height: VIDEO_HEIGHT },
        });
        if (cancelled || !videoRef.current) return;
        videoRef.current.srcObject = stream;
        await new Promise<void>((resolve) => {
          if (videoRef.current) videoRef.current.onloadeddata = () => resolve();
        });

        setStatus("AI 엔진 준비 중...");
        await tf.setBackend("webgl");
        await tf.ready();

        setStatus("AI 모델 로딩 중... (처음엔 10초 정도 걸려요)");
        const detector = await poseDetection.createDetector(
          poseDetection.SupportedModels.MoveNet,
          { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING }
        );
        if (cancelled) {
          detector.dispose();
          return;
        }
        detectorRef.current = detector;

        // 준비 완료 → 시작 버튼 보이기
        setPhase("ready");
        setStatus("✅ 준비 완료! 카메라 앞에 서서 시작 버튼을 누르세요");
        setFeedback({
          msg: "시작 버튼을 누르면 운동이 시작돼요",
          color: "#2f9e8f",
        });

        detectLoop();
      } catch (err) {
        setStatus("❌ 오류: " + (err as Error).message);
      }
    }

    async function detectLoop() {
      const detector = detectorRef.current;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!detector || !video || !canvas) return;

      const poses = await detector.estimatePoses(video);
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);
        if (poses.length > 0) {
          const kp = poses[0].keypoints;
          drawSkeleton(ctx, kp);
          // 운동 중일 때만 판정·카운트
          if (phaseRef.current === "exercising") {
            judge(kp);
          }
        }
      }
      rafRef.current = requestAnimationFrame(detectLoop);
    }

    const UI_INTERVAL_MS = 400;

    const smooth = (prev: number | null, cur: number) =>
      prev === null ? cur : prev * 0.7 + cur * 0.3;

    function judge(keypoints: poseDetection.Keypoint[]) {
      const now = Date.now();
      const { left, right, best } = analyzePose(keypoints, exercise);

      let msg: string;
      let color: string;
      let angleStr: string;

      if (!best) {
        msg = "카메라에 몸 전체가 보이게 해주세요";
        color = "#e08600";
        angleStr = "-";
        goodStartRef.current = null;
        leftEmaRef.current = null;
        rightEmaRef.current = null;
      } else {
        let leftStr = "";
        let rightStr = "";
        if (left) {
          leftEmaRef.current = smooth(leftEmaRef.current, left.angle);
          leftStr = `왼 ${Math.round(leftEmaRef.current)}°`;
        } else {
          leftEmaRef.current = null;
        }
        if (right) {
          rightEmaRef.current = smooth(rightEmaRef.current, right.angle);
          rightStr = `오른 ${Math.round(rightEmaRef.current)}°`;
        } else {
          rightEmaRef.current = null;
        }
        angleStr = [leftStr, rightStr].filter(Boolean).join("   ") || "-";

        const ok = best.level === "success" || best.level === "perfect";
        const cooldownOver = now - lastCountRef.current > COOLDOWN_MS;

        totalFramesRef.current += 1;
        if (ok) goodFramesRef.current += 1;

        if (ok) {
          if (!goodStartRef.current) goodStartRef.current = now;
          const heldLong = now - goodStartRef.current > HOLD_MS;
          if (heldLong && cooldownOver) {
            countRef.current += 1;
            setCount(countRef.current);
            lastCountRef.current = now;
            goodStartRef.current = null;
          }
          if (best.level === "perfect") {
            msg = "🎉 완벽해요!";
            color = "#1e9e54";
          } else {
            msg = "👍 좋아요! 그대로 유지";
            color = "#3aa564";
          }
        } else {
          goodStartRef.current = null;
          msg = "조금만 더 움직여보세요";
          color = "#d8453b";
        }
      }

      if (now - lastUiRef.current >= UI_INTERVAL_MS) {
        lastUiRef.current = now;
        setAngleText(angleStr);
        if (msg !== lastMsgRef.current) {
          lastMsgRef.current = msg;
          setFeedback({ msg, color });
        }
      }
    }

    function drawSkeleton(
      ctx: CanvasRenderingContext2D,
      keypoints: poseDetection.Keypoint[]
    ) {
      ctx.save();
      ctx.scale(-1, 1);
      ctx.translate(-VIDEO_WIDTH, 0);
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#00e5ff";
      for (const [i, j] of CONNECTIONS) {
        const a = keypoints[i];
        const b = keypoints[j];
        if ((a.score ?? 0) > MIN_SCORE && (b.score ?? 0) > MIN_SCORE) {
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
      ctx.fillStyle = "#ff4081";
      for (const kp of keypoints) {
        if ((kp.score ?? 0) > MIN_SCORE) {
          ctx.beginPath();
          ctx.arc(kp.x, kp.y, 5, 0, 2 * Math.PI);
          ctx.fill();
        }
      }
      ctx.restore();
    }

    init();

    // 운동 시간 타이머 (startTimeRef가 0이면 안 돌아감)
    const timer = setInterval(() => {
      if (startTimeRef.current) {
        setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }
    }, 1000);

    return () => {
      cancelled = true;
      clearInterval(timer);
      if (countdownIntervalRef.current) {
        window.clearInterval(countdownIntervalRef.current);
      }
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      const stream = videoRef.current?.srcObject as MediaStream | null;
      stream?.getTracks().forEach((track) => track.stop());
      detectorRef.current?.dispose();
      detectorRef.current = null;
    };
  }, [exercise]);

  // 시작 버튼 → 3-2-1 카운트다운 → 운동 시작
  function handleStart() {
    setPhase("countdown");
    let n = COUNTDOWN_START;
    setCountdown(n);

    const id = window.setInterval(() => {
      n -= 1;
      if (n <= 0) {
        window.clearInterval(id);
        countdownIntervalRef.current = null;

        // 모든 통계 초기화 후 운동 시작
        startTimeRef.current = Date.now();
        countRef.current = 0;
        setCount(0);
        goodFramesRef.current = 0;
        totalFramesRef.current = 0;
        goodStartRef.current = null;
        lastCountRef.current = 0;
        lastMsgRef.current = "";

        setCountdown(null);
        setPhase("exercising");
        setStatus("운동 중");
        setFeedback({ msg: "자, 시작해볼까요!", color: "#3aa564" });
      } else {
        setCountdown(n);
      }
    }, 1000);
    countdownIntervalRef.current = id;
  }

  function handleFinish() {
    const duration = startTimeRef.current
      ? Math.floor((Date.now() - startTimeRef.current) / 1000)
      : 0;
    const total = totalFramesRef.current;
    const accuracy =
      total > 0 ? Math.round((goodFramesRef.current / total) * 100) : 0;
    onComplete({ goodCount: countRef.current, duration, accuracy });
  }

  return (
    <div className="pose-area">
      <div className="pose-video-col">
        <p className="pose-status">{status}</p>
        <div className="video-wrap">
          <video ref={videoRef} autoPlay playsInline className="cam-video" />
          <canvas
            ref={canvasRef}
            width={VIDEO_WIDTH}
            height={VIDEO_HEIGHT}
            className="cam-canvas"
          />

          {/* 준비 완료 → 시작 버튼 오버레이 */}
          {phase === "ready" && (
            <div className="video-overlay">
              <button className="start-btn" onClick={handleStart}>
                ▶ 운동 시작
              </button>
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
        </div>
      </div>

      <div className="pose-panel">
        <div className="feedback-box" style={{ background: feedback.color }}>
          {feedback.msg}
        </div>
        <InfoBox value={String(count)} label="✅ 정확한 자세 횟수" />
        <InfoBox value={`${elapsed}s`} label="⏱ 운동 시간" />
        <InfoBox value={angleText} label="📐 현재 각도" />
        {phase === "exercising" && (
          <button className="finish-btn" onClick={handleFinish}>
            운동 완료 & 기록 저장
          </button>
        )}
      </div>
    </div>
  );
}

function InfoBox({ value, label }: { value: string; label: string }) {
  return (
    <div className="info-box">
      <div className="info-value">{value}</div>
      <div className="info-label">{label}</div>
    </div>
  );
}
