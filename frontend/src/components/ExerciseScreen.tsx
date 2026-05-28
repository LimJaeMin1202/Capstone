import type { Exercise } from "../types/exercise";
import PoseDetector, { type SessionStats } from "./PoseDetector";
import ExerciseImage from "./ExerciseImage";

interface Props {
  exercise: Exercise;
  onBack: () => void;
  onComplete: (stats: SessionStats) => void;
}

export default function ExerciseScreen({ exercise, onBack, onComplete }: Props) {
  return (
    <div className="exercise-detail">
      <button className="back-btn" onClick={onBack}>
        ← 운동 선택으로
      </button>

      <h1 className="exercise-title">{exercise.name}</h1>
      <p className="exercise-meta">
        {exercise.bodyPart} · 목표 {exercise.normalTarget}° (허용{" "}
        {exercise.allowedTarget}°)
      </p>

      <div className="exercise-guide">
        <div className="exercise-guide-img">
          <ExerciseImage
            exerciseId={exercise.id}
            category={exercise.category}
          />
        </div>
        <div className="exercise-guide-text">
          <h3>운동 방법</h3>
          {exercise.notes ? (
            <p>{exercise.notes}</p>
          ) : (
            <p style={{ color: "var(--text-muted)" }}>
              카메라 앞에 서서 천천히 동작을 따라해보세요.
            </p>
          )}
        </div>
      </div>

      <PoseDetector
        key={exercise.id}
        exercise={exercise}
        onComplete={onComplete}
      />
    </div>
  );
}
