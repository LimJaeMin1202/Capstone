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

interface Props {
  exercise: Exercise;
}

interface Feedback {
  msg: string;
  color: string;
}

export default function PoseDetector({ exercise }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectorRef = useRef<poseDetection.PoseDetector | null>(null);
  const rafRef = useRef<number | null>(null);

  // 타이밍·카운트 (리렌더 무관하게 ref로 관리)
  const goodStartRef = useRef<number | null>(null);
  const lastCountRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const countRef = useRef<number>(0);

  // UI 안정화용
  const angleEmaRef = useRef<number | null>(null); // 각도 평활화
  const lastUiRef = useRef<number>(0); // 마지막 화면 갱신 시각
  const lastMsgRef = useRef<string>(""); // 마지막 피드백 메시지 (중복 방지)

  const [status, setStatus] = useState("모델 로딩 중...");
  const [feedback, setFeedback] = useState<Feedback>({
    msg: "운동을 시작해보세요",
    color: "white",
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

    function judge(keypoints: poseDetection.Keypoint[]) {
      const now = Date.now();
      const result = analyzePose(keypoints, exercise);

      // 표시할 메시지·색·각도 결정
      let msg: string;
      let color: string;
      let angleStr: string;

      if (!result) {
        msg = "카메라에 몸 전체가 보이게 해주세요";
        color = "#ffb300";
        angleStr = "-";
        goodStartRef.current = null;
        angleEmaRef.current = null;
      } else {
        // 각도 평활화 (지수이동평균) — 떨림 제거
        const smoothed =
          angleEmaRef.current === null
            ? result.angle
            : angleEmaRef.current * 0.7 + result.angle * 0.3;
        angleEmaRef.current = smoothed;
        const shownAngle = Math.round(smoothed);
        angleStr = `${result.side === "left" ? "왼쪽" : "오른쪽"} ${shownAngle}°`;

        const ok = result.level === "success" || result.level === "perfect";
        const cooldownOver = now - lastCountRef.current > COOLDOWN_MS;

        if (ok) {
          if (!goodStartRef.current) goodStartRef.current = now;
          const heldLong = now - goodStartRef.current > HOLD_MS;
          if (heldLong && cooldownOver) {
            countRef.current += 1;
            setCount(countRef.current); // 카운트는 즉시 반영 (성취감)
            lastCountRef.current = now;
            goodStartRef.current = null;
          }
          if (result.level === "perfect") {
            msg = "🎉 완벽해요!";
            color = "#00e676";
          } else {
            msg = "👍 좋아요! 그대로 유지";
            color = "#8bc34a";
          }
        } else {
          goodStartRef.current = null;
          msg = "조금만 더 움직여보세요";
          color = "#ff5252";
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

  return (
    <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
      <div>
        <p style={{ color: "#aaa", marginBottom: 8 }}>{status}</p>
        <div style={{ position: "relative", width: VIDEO_WIDTH, height: VIDEO_HEIGHT }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            width={VIDEO_WIDTH}
            height={VIDEO_HEIGHT}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              transform: "scaleX(-1)",
              borderRadius: 12,
            }}
          />
          <canvas
            ref={canvasRef}
            width={VIDEO_WIDTH}
            height={VIDEO_HEIGHT}
            style={{ position: "absolute", top: 0, left: 0, zIndex: 10 }}
          />
        </div>
      </div>

      {/* 사이드 패널 */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 200 }}>
        <div
          style={{
            background: "#16213e",
            border: "2px solid #0f3460",
            borderRadius: 12,
            padding: 20,
            fontSize: "1.5rem",
            fontWeight: "bold",
            textAlign: "center",
            color: feedback.color,
            minHeight: 80,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "color 0.3s",
          }}
        >
          {feedback.msg}
        </div>
        <InfoBox value={String(count)} label="✅ 정확한 자세 횟수" />
        <InfoBox value={`${elapsed}s`} label="⏱ 운동 시간" />
        <InfoBox value={angleText} label="📐 현재 각도" />
      </div>
    </div>
  );
}

function InfoBox({ value, label }: { value: string; label: string }) {
  return (
    <div
      style={{
        background: "#16213e",
        border: "1px solid #0f3460",
        borderRadius: 12,
        padding: 16,
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#00e5ff" }}>
        {value}
      </div>
      <div style={{ fontSize: "0.9rem", color: "#aaa", marginTop: 4 }}>{label}</div>
    </div>
  );
}
