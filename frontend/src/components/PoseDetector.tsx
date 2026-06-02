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
const COUNTDOWN_START = 3;

// 자세 진입/이탈 시 노이즈 방지용 짧은 그레이스 윈도우
// 0.3초 동안 자세가 흔들려도 같은 phase 유지 (한두 프레임 노이즈 흡수)
const PHASE_GRACE_MS = 300;
// satisfied 상태에서 자세가 "정말로" 풀린 걸 확정하는 데 필요한 시간
// 이 시간 동안 자세 풀린 상태가 지속되어야 카운트 +1
// keypoint jitter (한두 프레임 사라짐)로 인한 가짜 카운트 방지
const RELEASE_CONFIRM_MS = 400;

type Phase = "loading" | "ready" | "countdown" | "exercising";

// 운동 1회 수행 안의 sub-state
type RepPhase = "rest" | "holding" | "satisfied";
//  rest      → 휴식 자세 / 운동 자세 미달
//  holding   → 운동 자세 진입, 목표 시간 채우는 중
//  satisfied → 목표 시간 채움, 사용자가 풀어주길 기다림 → 풀면 카운트++

export interface SessionStats {
  mode: "rep" | "hold";        // 운동 모드
  goodCount: number;           // rep: 횟수 / hold: 자세 잡았다 풀었다 한 사이클 수
  duration: number;            // 총 운동 시간 (초)
  accuracy: number;            // 정확한 자세 프레임 비율 (%)
  totalHoldSeconds: number;    // hold 모드용: 누적으로 자세를 유지한 총 시간 (초)
}

interface Props {
  exercise: Exercise;
  holdSeconds: number;
  mode: "rep" | "hold";        // rep: 자세 잡고 풀고 반복 / hold: 한 자세 길게 유지
  cameraPosition: "정면" | "측면";  // 시작 오버레이 안내용
  onComplete: (stats: SessionStats) => void;
}

interface Feedback {
  msg: string;
  color: string;
}

export default function PoseDetector({
  exercise,
  holdSeconds,
  mode,
  cameraPosition,
  onComplete,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectorRef = useRef<poseDetection.PoseDetector | null>(null);
  const rafRef = useRef<number | null>(null);

  // ===== Rep state machine =====
  const repPhaseRef = useRef<RepPhase>("rest");
  const holdStartRef = useRef<number | null>(null); // holding phase 진입 시각
  const lastInPoseRef = useRef<number>(0);          // 마지막으로 자세가 OK였던 시각
  const releaseStartRef = useRef<number | null>(null); // satisfied에서 자세 풀기 시작한 시각

  // ===== 통계 =====
  const startTimeRef = useRef<number>(0);
  const countRef = useRef<number>(0);
  const totalFramesRef = useRef<number>(0);
  const goodFramesRef = useRef<number>(0);

  // hold 모드: 자세를 잡고 있는 동안 매 프레임 누적되는 시간 (ms)
  const holdAccumMsRef = useRef<number>(0);
  const lastTickRef = useRef<number>(0);

  const modeRef = useRef(mode);
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  // ===== UI 안정화 =====
  const leftEmaRef = useRef<number | null>(null);
  const rightEmaRef = useRef<number | null>(null);
  const lastUiRef = useRef<number>(0);
  const lastMsgRef = useRef<string>("");

  // ===== Phase 관리 =====
  const [phase, setPhase] = useState<Phase>("loading");
  const phaseRef = useRef<Phase>("loading");
  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);

  const holdSecondsRef = useRef(holdSeconds);
  useEffect(() => {
    holdSecondsRef.current = holdSeconds;
  }, [holdSeconds]);

  const [status, setStatus] = useState("모델 로딩 중...");
  const [feedback, setFeedback] = useState<Feedback>({
    msg: "AI가 준비되면 시작 버튼이 나타나요",
    color: "#2f9e8f",
  });
  const [count, setCount] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [angleText, setAngleText] = useState("-");
  // 카운트다운 표시 (holding 중 남은 시간을 작게 보여줌)
  const [holdCountdown, setHoldCountdown] = useState<number | null>(null);
  // hold 모드용: 누적 유지 시간 (초)
  const [totalHoldSec, setTotalHoldSec] = useState(0);

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

        setPhase("ready");
        setStatus("✅ 준비 완료! 시작 버튼을 눌러주세요");
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
          if (phaseRef.current === "exercising") {
            judge(kp);
          }
        }
      }
      rafRef.current = requestAnimationFrame(detectLoop);
    }

    const UI_INTERVAL_MS = 200;

    const smooth = (prev: number | null, cur: number) =>
      prev === null ? cur : prev * 0.7 + cur * 0.3;

    function judge(keypoints: poseDetection.Keypoint[]) {
      const now = Date.now();
      const { left, right, best } = analyzePose(keypoints, exercise);

      let msg: string;
      let color: string;
      let angleStr: string;
      let countdownDisplay: number | null = null;

      // satisfied 상태에서 자세가 "정말" 풀렸는지 시간으로 확정하는 헬퍼
      // released 가 RELEASE_CONFIRM_MS 만큼 지속되어야 카운트 +1
      function tryConfirmRelease(): { msg: string; color: string } {
        if (releaseStartRef.current === null) {
          releaseStartRef.current = now;
        }
        if (now - releaseStartRef.current >= RELEASE_CONFIRM_MS) {
          countRef.current += 1;
          setCount(countRef.current);
          repPhaseRef.current = "rest";
          holdStartRef.current = null;
          releaseStartRef.current = null;
          return {
            msg: `🎉 ${countRef.current}회 완료! 다음 자세 준비`,
            color: "#1e9e54",
          };
        }
        return { msg: "잘 했어요. 천천히 풀어주세요", color: "#3aa564" };
      }

      if (!best) {
        angleStr = "-";
        leftEmaRef.current = null;
        rightEmaRef.current = null;

        if (repPhaseRef.current === "satisfied") {
          // 키포인트 사라짐 = 사용자가 자세 풀면서 가려진 것일 가능성 높음
          // 단, jitter(한두 프레임)로 인한 가짜 카운트 방지 위해 시간 확정
          const r = tryConfirmRelease();
          msg = r.msg;
          color = r.color;
        } else if (repPhaseRef.current === "holding") {
          // holding 중 키포인트 일시적 손실: phase 유지
          msg = "조금만 더 또렷하게 보여주세요";
          color = "#e08600";
        } else {
          msg = "카메라에 몸 전체가 보이게 해주세요";
          color = "#e08600";
        }
      } else {
        // 각도 EMA 스무딩 + 좌/우 텍스트
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

        // 정확도 추적
        const inPose = best.level === "success" || best.level === "perfect";
        totalFramesRef.current += 1;
        if (inPose) goodFramesRef.current += 1;

        // hold 모드: 자세 잡고 있는 동안 매 프레임 시간 누적
        // 잠시 끊겨도 (recentlyInPose) 누적 유지하고, 진짜 풀리면 lastTick 리셋
        if (inPose) {
          if (lastTickRef.current > 0) {
            holdAccumMsRef.current += now - lastTickRef.current;
          }
          lastTickRef.current = now;
        } else if (!(now - lastInPoseRef.current < PHASE_GRACE_MS)) {
          lastTickRef.current = 0;
        }

        // 그레이스 윈도우: 자세 한두 프레임 흔들려도 같은 phase 유지
        if (inPose) lastInPoseRef.current = now;
        const recentlyInPose = now - lastInPoseRef.current < PHASE_GRACE_MS;

        const holdMs = holdSecondsRef.current * 1000;

        // ===== State machine =====
        switch (repPhaseRef.current) {
          case "rest": {
            releaseStartRef.current = null;
            if (inPose) {
              repPhaseRef.current = "holding";
              holdStartRef.current = now;
              msg = `🟢 자세 잡았어요! ${holdSecondsRef.current}초 유지하세요`;
              color = "#3aa564";
            } else {
              msg = "운동 자세를 천천히 만들어 보세요";
              color = "#e08600";
            }
            break;
          }

          case "holding": {
            releaseStartRef.current = null;
            if (inPose || recentlyInPose) {
              const held = now - (holdStartRef.current ?? now);
              if (held >= holdMs) {
                repPhaseRef.current = "satisfied";
                msg = "✨ 충분해요! 천천히 내려놓으세요";
                color = "#1e9e54";
              } else {
                const remaining = Math.max(1, Math.ceil((holdMs - held) / 1000));
                countdownDisplay = remaining;
                msg = `⏳ 자세 유지 중... ${remaining}초 남았어요`;
                color = "#2f9e8f";
              }
            } else {
              repPhaseRef.current = "rest";
              holdStartRef.current = null;
              msg = "조금만 더 유지해보세요";
              color = "#d8453b";
            }
            break;
          }

          case "satisfied": {
            const released = !inPose && !recentlyInPose;
            if (released) {
              const r = tryConfirmRelease();
              msg = r.msg;
              color = r.color;
            } else {
              // 다시 자세 잡힘 (또는 그레이스 윈도우 내) → release 취소
              releaseStartRef.current = null;
              msg = "잘 했어요. 천천히 풀어주세요";
              color = "#3aa564";
            }
            break;
          }
        }

        if (repPhaseRef.current !== "holding") {
          countdownDisplay = null;
        }
      }

      // UI 업데이트는 일정 간격으로
      if (now - lastUiRef.current >= UI_INTERVAL_MS) {
        lastUiRef.current = now;
        setAngleText(angleStr);
        setHoldCountdown(countdownDisplay);
        if (modeRef.current === "hold") {
          setTotalHoldSec(Math.floor(holdAccumMsRef.current / 1000));
        }
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

        startTimeRef.current = Date.now();
        countRef.current = 0;
        setCount(0);
        goodFramesRef.current = 0;
        totalFramesRef.current = 0;
        // Rep state machine 초기화
        repPhaseRef.current = "rest";
        holdStartRef.current = null;
        releaseStartRef.current = null;
        lastInPoseRef.current = 0;
        lastMsgRef.current = "";
        // hold 모드 누적 시간 초기화
        holdAccumMsRef.current = 0;
        lastTickRef.current = 0;
        setTotalHoldSec(0);

        setCountdown(null);
        setPhase("exercising");
        setStatus("운동 중");
        setFeedback({ msg: "자, 운동 자세를 만들어 볼까요!", color: "#3aa564" });
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
    onComplete({
      mode,
      goodCount: countRef.current,
      duration,
      accuracy,
      totalHoldSeconds: Math.floor(holdAccumMsRef.current / 1000),
    });
  }

  return (
    <div className="pose-area">
      <div className="pose-video-col">
        <div className="video-wrap">
          <video ref={videoRef} autoPlay playsInline className="cam-video" />
          <canvas
            ref={canvasRef}
            width={VIDEO_WIDTH}
            height={VIDEO_HEIGHT}
            className="cam-canvas"
          />

          {/* 상태 chip (좌상단) — 운동 중엔 숨김 (그땐 우측 패널 피드백이 안내) */}
          {status && phase !== "exercising" && (
            <div className="pose-status-chip">{status}</div>
          )}

          {/* 준비 완료 → 시작 버튼 오버레이 + 카메라 위치 안내 */}
          {phase === "ready" && (
            <div className="video-overlay video-overlay-ready">
              <div className="ready-guide">
                <div className="ready-guide-title">
                  카메라를 {cameraPosition === "측면" ? "옆쪽" : "정면"} 1.5~2m
                  거리에 두세요
                </div>
                <div className="ready-guide-sub">
                  {cameraPosition === "측면"
                    ? "이 운동은 옆모습으로 측정해요. 머리부터 발끝까지 옆모습이 보이게 해주세요."
                    : "머리부터 발끝까지 앞모습이 전부 보이게 충분히 떨어져 주세요."}
                </div>
              </div>
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

          {/* 자세 유지 시간 표시 (holding 중일 때만, 우상단) */}
          {phase === "exercising" && holdCountdown !== null && (
            <div className="hold-countdown-badge">{holdCountdown}</div>
          )}
        </div>
      </div>

      <div className="pose-panel">
        <div className="feedback-box" style={{ background: feedback.color }}>
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
          <InfoBox value={angleText} label="📐 현재 각도" />
        </div>
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
