import type { Exercise } from "../types/exercise";
import PoseDetector, { type SessionStats } from "./PoseDetector";

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

      <PoseDetector
        key={exercise.id}
        exercise={exercise}
        onComplete={onComplete}
      />

      {exercise.notes && <p className="exercise-note">💡 {exercise.notes}</p>}
    </div>
  );
}
