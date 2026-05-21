import { useEffect, useState } from "react";
import type { Exercise } from "../types/exercise";
import { fetchExercises } from "../api/exercises";

interface Props {
  onSelect: (exercise: Exercise) => void;
}

// 카테고리 표시 순서
const CATEGORY_ORDER = ["의자 착석", "벽·의자 지지", "바닥·매트"];

export default function ExerciseSelect({ onSelect }: Props) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExercises()
      .then((data) => setExercises(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ color: "#aaa" }}>운동 목록 불러오는 중...</p>;
  if (error)
    return (
      <p style={{ color: "#ff5252" }}>
        ❌ {error}
        <br />
        백엔드 서버(8080)가 켜져 있는지 확인해주세요.
      </p>
    );

  // 카테고리별로 그룹핑
  const byCategory: Record<string, Exercise[]> = {};
  for (const ex of exercises) {
    (byCategory[ex.category] ??= []).push(ex);
  }

  const categories = CATEGORY_ORDER.filter((c) => byCategory[c]);

  return (
    <div style={{ width: "100%", maxWidth: 900 }}>
      <p style={{ color: "#aaa", marginBottom: 24, textAlign: "center" }}>
        운동을 선택하면 AI가 자세를 실시간 분석해드려요 (총 {exercises.length}개)
      </p>

      {categories.map((category) => (
        <section key={category} style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: "1.1rem", marginBottom: 12 }}>{category}</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: 12,
            }}
          >
            {byCategory[category].map((ex) => (
              <button
                key={ex.id}
                onClick={() => onSelect(ex)}
                style={{
                  background: "#16213e",
                  border: "2px solid #0f3460",
                  borderRadius: 12,
                  padding: "16px",
                  textAlign: "left",
                  cursor: "pointer",
                  color: "white",
                }}
              >
                <div style={{ fontWeight: "bold", marginBottom: 6 }}>
                  {ex.name}
                </div>
                <div style={{ fontSize: "0.8rem", color: "#aaa" }}>
                  {ex.bodyPart}
                </div>
                <div style={{ fontSize: "0.75rem", color: "#00e5ff", marginTop: 6 }}>
                  {ex.difficulty}
                </div>
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
