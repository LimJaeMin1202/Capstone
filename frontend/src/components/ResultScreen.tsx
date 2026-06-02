import type { Exercise } from "../types/exercise";
import type { SessionStats } from "./PoseDetector";
import ExerciseImage from "./ExerciseImage";

interface Props {
  exercise: Exercise;
  stats: SessionStats;
  onAnother: () => void;
  onRecords: () => void;
}

// 운동 횟수 + 정확도에 따른 축하 메시지
// 횟수 0이면 정확도와 무관하게 격려 메시지
function getCelebration(goodCount: number, accuracy: number): {
  emoji: string;
  title: string;
  message: string;
} {
  if (goodCount === 0) {
    return {
      emoji: "🙏",
      title: "오늘은 여기까지 해도 괜찮아요",
      message:
        "카메라 위치나 자세가 잘 잡히지 않았을 수 있어요. 가이드를 다시 보고 천천히 시도해 보세요.",
    };
  }
  if (accuracy >= 90) {
    return {
      emoji: "🎉",
      title: "완벽해요!",
      message: "자세가 아주 정확했어요. 이대로만 꾸준히!",
    };
  }
  if (accuracy >= 70) {
    return {
      emoji: "👍",
      title: "잘하셨어요!",
      message: "좋은 자세로 잘 따라오셨어요.",
    };
  }
  if (accuracy >= 40) {
    return {
      emoji: "💪",
      title: "수고하셨어요!",
      message: "꾸준히 하면 점점 좋아져요.",
    };
  }
  return {
    emoji: "🌱",
    title: "시작이 반이에요!",
    message: "오늘 운동하신 것만으로도 충분해요.",
  };
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}초`;
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return sec === 0 ? `${min}분` : `${min}분 ${sec}초`;
}

export default function ResultScreen({
  exercise,
  stats,
  onAnother,
  onRecords,
}: Props) {
  const celebration = getCelebration(stats.goodCount, stats.accuracy);

  return (
    <div className="result-wrap">
      <div className="result-celebrate">
        <span className="result-emoji">{celebration.emoji}</span>
        <h1 className="result-title">{celebration.title}</h1>
        <p className="result-msg">{celebration.message}</p>
      </div>

      <div className="result-card">
        <div className="result-img">
          <ExerciseImage
            exerciseId={exercise.id}
            category={exercise.category}
          />
        </div>
        <div className="result-info">
          <p className="result-exercise-name">{exercise.name}</p>
          <p className="result-exercise-part">{exercise.bodyPart}</p>
        </div>
      </div>

      <div className="result-stats">
        <div className="result-stat">
          <div className="result-stat-value">{stats.goodCount}</div>
          <div className="result-stat-label">운동 횟수</div>
        </div>
        <div className="result-stat">
          <div className="result-stat-value">{formatDuration(stats.duration)}</div>
          <div className="result-stat-label">운동 시간</div>
        </div>
        <div className="result-stat">
          <div className="result-stat-value">{stats.accuracy}%</div>
          <div className="result-stat-label">정확도</div>
          <div className="result-stat-bar">
            <div
              className="result-stat-bar-fill"
              style={{ width: `${stats.accuracy}%` }}
            />
          </div>
        </div>
      </div>

      <div className="result-actions">
        <button className="result-btn primary" onClick={onAnother}>
          다른 운동 하기
        </button>
        <button className="result-btn" onClick={onRecords}>
          내 기록 보기
        </button>
      </div>
    </div>
  );
}
