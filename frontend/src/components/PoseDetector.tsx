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
const HOLD_MS = 800; // 정자세 유지해야 하는 시간
const COOLDOWN_MS = 1500; // 카운트 후 쿨다운

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

  // 타이밍·카운트 (리렌더 무관하게 ref로 관리)
  const goodStartRef = useRef<number | null>(null);
  const lastCountRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const countRef = useRef<number>(0);

  // 정확도 계산용 (올바른 자세 프레임 / 전체 프레임)
  const totalFramesRef = useRef<number>(0);
  const goodFramesRef = useRef<number>(0);

  // UI 안정화용
  const leftEmaRef = useRef<number | null>(null); // 왼쪽 각도 평활화
  const rightEmaRef = useRef<number | null>(null); // 오른쪽 각도 평활화
  const lastUiRef = useRef<number>(0); // 마지막 화면 갱신 시각
  const lastMsgRef = useRef<string>(""); // 마지막 피드백 메시지 (중복 방지)

  const [status, setStatus] = useState("모델 로딩 중...");
  const [feedback, setFeedback] = useState<Feedback>({
    msg: "운동을 시작해보세요",
    color: "#2f9e8f",
  });
  const [count, setCount] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [angleText, setAngleText] = useState("-");

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
        setStatus("✅ 준비 완료! 카메라 앞에 서보세요");

        startTimeRef.current = Date.now();
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
          judge(kp);
        }
      }
      rafRef.current = requestAnimationFrame(detectLoop);
    }

    // 화면 갱신은 약 0.4초마다만 (어르신 가독성 위해 깜빡임 최소화)
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
        // 좌/우 각각 평활화해서 따로 표시 (왔다갔다 안 함)
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

        // 판정·카운트는 더 잘한 쪽(best) 기준
        const ok = best.level === "success" || best.level === "perfect";
        const cooldownOver = now - lastCountRef.current > COOLDOWN_MS;

        // 정확도용 프레임 집계
        totalFramesRef.current += 1;
        if (ok) goodFramesRef.current += 1;

        if (ok) {
          if (!goodStartRef.current) goodStartRef.current = now;
          const heldLong = now - goodStartRef.current > HOLD_MS;
          if (heldLong && cooldownOver) {
            countRef.current += 1;
            setCount(countRef.current); // 카운트는 즉시 반영 (성취감)
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

      // throttle: 0.4초마다만 화면 갱신, 메시지는 바뀔 때만
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

    // 운동 시간 타이머
    const timer = setInterval(() => {
      if (startTimeRef.current) {
        setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }
    }, 1000);

    return () => {
      cancelled = true;
      clearInterval(timer);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      const stream = videoRef.current?.srcObject as MediaStream | null;
      stream?.getTracks().forEach((track) => track.stop());
      detectorRef.current?.dispose();
      detectorRef.current = null;
    };
  }, [exercise]);

  function handleFinish() {
    const duration = startTimeRef.current
      ? Math.floor((Date.now() - startTimeRef.current) / 1000)
      : 0;
    const total = totalFramesRef.current;
    const accuracy = total > 0 ? Math.round((goodFramesRef.current / total) * 100) : 0;
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
        </div>
      </div>

      <div className="pose-panel">
        <div className="feedback-box" style={{ background: feedback.color }}>
          {feedback.msg}
        </div>
        <InfoBox value={String(count)} label="✅ 정확한 자세 횟수" />
        <InfoBox value={`${elapsed}s`} label="⏱ 운동 시간" />
        <InfoBox value={angleText} label="📐 현재 각도" />
        <button className="finish-btn" onClick={handleFinish}>
          운동 완료 & 기록 저장
        </button>
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
