import { useEffect, useMemo, useState } from "react";
import type { Exercise } from "../types/exercise";
import { fetchExercises } from "../api/exercises";

interface Props {
  onSelect: (exercise: Exercise) => void;
}

type GroupMode = "category" | "region" | "difficulty";

const CATEGORY_ORDER = ["의자 착석", "벽·의자 지지", "바닥·매트"];
const DIFFICULTY_ORDER = ["초급", "중급", "고급"];
const REGION_ORDER = [
  "어깨",
  "팔",
  "가슴",
  "등·허리",
  "코어",
  "하체",
  "종아리·발목",
  "기타",
];

// 난이도 → CSS 클래스
const LEVEL_CLASS: Record<string, string> = {
  초급: "lv-beginner",
  중급: "lv-intermediate",
  고급: "lv-advanced",
};

// 부위명(상세) → 큰 신체 부위로 분류
function getRegion(bodyPart: string): string {
  const s = bodyPart;
  if (s.includes("어깨")) return "어깨";
  if (s.includes("가슴")) return "가슴";
  if (s.includes("팔") || s.includes("이두") || s.includes("삼두")) return "팔";
  if (s.includes("종아리") || s.includes("발목")) return "종아리·발목";
  if (s.includes("복부") || s.includes("복사근") || s.includes("코어"))
    return "코어";
  if (s.includes("등") || s.includes("척추") || s.includes("기립근") || s.includes("허리"))
    return "등·허리";
  if (
    s.includes("무릎") ||
    s.includes("허벅지") ||
    s.includes("대퇴") ||
    s.includes("둔근") ||
    s.includes("엉덩이") ||
    s.includes("골반") ||
    s.includes("하체") ||
    s.includes("장요근") ||
    s.includes("밸런스")
  )
    return "하체";
  return "기타";
}

export default function ExerciseSelect({ onSelect }: Props) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<GroupMode>("category");

  useEffect(() => {
    fetchExercises()
      .then(setExercises)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const { groups, order } = useMemo(() => {
    const keyFn =
      mode === "category"
        ? (e: Exercise) => e.category
        : mode === "difficulty"
        ? (e: Exercise) => e.difficulty
        : (e: Exercise) => getRegion(e.bodyPart);

    const grouped: Record<string, Exercise[]> = {};
    for (const ex of exercises) {
      (grouped[keyFn(ex)] ??= []).push(ex);
    }

    const base =
      mode === "category"
        ? CATEGORY_ORDER
        : mode === "difficulty"
        ? DIFFICULTY_ORDER
        : REGION_ORDER;
    const ordered = base.filter((k) => grouped[k]);
    for (const k of Object.keys(grouped)) {
      if (!ordered.includes(k)) ordered.push(k);
    }
    return { groups: grouped, order: ordered };
  }, [exercises, mode]);

  if (loading) return <p className="state-msg">운동 목록 불러오는 중...</p>;
  if (error)
    return (
      <p className="state-msg error">
        ❌ {error}
        <br />
        백엔드 서버(8080)가 켜져 있는지 확인해주세요.
      </p>
    );

  return (
    <div>
      <div className="sort-bar">
        <button
          className={mode === "category" ? "sort-btn active" : "sort-btn"}
          onClick={() => setMode("category")}
        >
          자세별
        </button>
        <button
          className={mode === "region" ? "sort-btn active" : "sort-btn"}
          onClick={() => setMode("region")}
        >
          부위별
        </button>
        <button
          className={mode === "difficulty" ? "sort-btn active" : "sort-btn"}
          onClick={() => setMode("difficulty")}
        >
          난이도별
        </button>
      </div>

      {order.map((groupKey) => (
        <section key={groupKey} className="category-section">
          <h2 className="category-title">{groupKey}</h2>
          <div className="exercise-grid">
            {groups[groupKey].map((ex) => (
              <button
                key={ex.id}
                className="exercise-card"
                onClick={() => onSelect(ex)}
              >
                <span className="exercise-card-name">{ex.name}</span>
                <span className="exercise-card-part">{ex.bodyPart}</span>
                <span
                  className={`exercise-card-badge ${
                    LEVEL_CLASS[ex.difficulty] ?? ""
                  }`}
                >
                  {ex.difficulty}
                </span>
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
