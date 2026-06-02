import type { Exercise } from "../types/exercise";
import PoseDetector, { type SessionStats } from "./PoseDetector";
import ExerciseImage from "./ExerciseImage";
import { EXERCISE_GUIDES, DEFAULT_GUIDE } from "../data/exerciseGuides";

interface Props {
  exercise: Exercise;
  onBack: () => void;
  onComplete: (stats: SessionStats) => void;
}

export default function ExerciseScreen({ exercise, onBack, onComplete }: Props) {
  const guide = EXERCISE_GUIDES[exercise.id] ?? DEFAULT_GUIDE;

  return (
    <div className="exercise-detail">
      <button className="back-btn" onClick={onBack}>
        ← 운동 선택으로
      </button>

      <h1 className="exercise-title">{exercise.name}</h1>
      <p className="exercise-meta">
        <span className="meta-chip">{exercise.bodyPart}</span>
        <span className="meta-chip meta-chip-soft">난이도 {exercise.difficulty}</span>
        <span className="meta-chip meta-chip-soft">목표 {exercise.normalTarget}°</span>
        <span className="meta-chip meta-chip-soft">
          카메라 {guide.cameraPosition}
        </span>
      </p>

      {/* 카메라 안내 — 비디오 바로 위에 두어 사용자가 확실히 보게 */}
      <div
        className={
          "camera-guide-box" +
          (guide.cameraPosition === "측면" ? " camera-guide-box-side" : "")
        }
      >
        <div className="camera-guide-text">
          <strong>
            카메라를 {guide.cameraPosition === "측면" ? "옆쪽" : "정면"} 1.5~2m
            거리에 두세요
          </strong>
          <div className="camera-guide-sub">
            {guide.cameraPosition === "측면"
              ? "이 운동은 옆모습으로 측정해요. 머리부터 발끝까지 옆모습이 전부 보이게 카메라를 멀리 배치해주세요."
              : "머리부터 발끝까지 앞모습이 전부 보이게 카메라에서 충분히 떨어져 주세요."}
          </div>
        </div>
      </div>

      <PoseDetector
        key={exercise.id}
        exercise={exercise}
        holdSeconds={guide.holdSeconds}
        mode={guide.mode}
        onComplete={onComplete}
      />

      {/* 운동 가이드 (이미지 + 4섹션) — 카메라 아래로 이동 */}
      <div className="exercise-guide exercise-guide-below">
        <div className="exercise-guide-img">
          <ExerciseImage
            exerciseId={exercise.id}
            category={exercise.category}
          />
        </div>

        <div className="exercise-guide-text">
          <div className="guide-section">
            <h3 className="guide-section-title">
              <span className="guide-section-icon">📌</span>
              준비 자세
            </h3>
            <p className="guide-prepare">{guide.prepare}</p>
          </div>

          <div className="guide-section">
            <h3 className="guide-section-title">
              <span className="guide-section-icon">👣</span>
              따라하기
            </h3>
            <ol className="guide-steps">
              {guide.steps.map((step, idx) => (
                <li key={idx}>
                  <span className="step-num">{idx + 1}</span>
                  <span className="step-text">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="guide-section guide-caution-box">
            <h3 className="guide-section-title">
              <span className="guide-section-icon">⚠️</span>
              주의 사항
            </h3>
            <ul className="guide-cautions">
              {guide.cautions.map((c, idx) => (
                <li key={idx}>{c}</li>
              ))}
            </ul>
          </div>

          <div className="guide-section guide-benefit-box">
            <h3 className="guide-section-title">
              <span className="guide-section-icon">💪</span>
              어떤 효과가 있나요?
            </h3>
            <p className="guide-benefit">{guide.benefit}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
