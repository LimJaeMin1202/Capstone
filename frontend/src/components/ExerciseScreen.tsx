import type { Exercise } from "../types/exercise";
import PoseDetector from "./PoseDetector";
import { ExerciseGuideDetails } from "./ExerciseGuide";
import { EXERCISE_GUIDES, DEFAULT_GUIDE } from "../data/exerciseGuides";
import type { SessionStats } from "../utils/exerciseSession";
import { getTrackingUnavailableReason } from "../utils/pose";

interface Props {
  exercise: Exercise;
  onBack: () => void;
  onComplete: (stats: SessionStats, sessionId: string) => Promise<void>;
}

export default function ExerciseScreen({ exercise, onBack, onComplete }: Props) {
  const guide = EXERCISE_GUIDES[exercise.id] ?? DEFAULT_GUIDE;
  const trackingUnavailable = getTrackingUnavailableReason(exercise);

  return (
    <div className="exercise-detail">
      <button className="back-btn" onClick={onBack}>
        ← 운동 선택으로
      </button>

      <h1 className="exercise-title">{exercise.name}</h1>
      <p className="exercise-meta">
        <span className="meta-chip">{exercise.bodyPart}</span>
        <span className="meta-chip meta-chip-soft">난이도 {exercise.difficulty}</span>
      </p>

      {trackingUnavailable ? (
        <>
          <p className="state-msg">{trackingUnavailable}</p>
          <ExerciseGuideDetails exercise={exercise} guide={guide} />
        </>
      ) : (
        <PoseDetector
          key={exercise.id}
          exercise={exercise}
          guide={guide}
          onComplete={onComplete}
        />
      )}
    </div>
  );
}
