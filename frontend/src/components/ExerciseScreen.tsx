import type { Exercise } from "../types/exercise";
import PoseDetector from "./PoseDetector";

interface Props {
  exercise: Exercise;
  onBack: () => void;
}

export default function ExerciseScreen({ exercise, onBack }: Props) {
  return (
    <div style={{ width: "100%", maxWidth: 1000 }}>
      <button
        onClick={onBack}
        style={{
          background: "none",
          border: "1px solid #444",
          color: "white",
          padding: "8px 16px",
          borderRadius: 8,
          cursor: "pointer",
          marginBottom: 16,
        }}
      >
        ← 운동 선택으로
      </button>

      <h2 style={{ fontSize: "1.3rem", marginBottom: 4 }}>{exercise.name}</h2>
      <p style={{ color: "#aaa", fontSize: "0.9rem", marginBottom: 16 }}>
        {exercise.bodyPart} · 기준점 {exercise.jointA}-{exercise.jointB}-
        {exercise.jointC} · 목표 {exercise.normalTarget}° (허용{" "}
        {exercise.allowedTarget}°)
      </p>

      <PoseDetector key={exercise.id} exercise={exercise} />

      {exercise.notes && (
        <p style={{ color: "#888", fontSize: "0.85rem", marginTop: 12 }}>
          💡 {exercise.notes}
        </p>
      )}
    </div>
  );
}
