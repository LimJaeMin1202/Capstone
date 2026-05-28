import { useState } from "react";

interface Props {
  exerciseId: string;
  category?: string;
  className?: string;
}

function getCategoryEmoji(category?: string): string {
  if (!category) return "🏃";
  if (category.includes("의자 착석")) return "🪑";
  if (category.includes("벽")) return "🧍";
  if (category.includes("바닥")) return "🧘";
  return "🏃";
}

/**
 * 운동 가이드 이미지 표시
 * - public/exercises/{exerciseId}.png 가 있으면 그 사진을 보여줌
 * - 없으면(404) 카테고리 이모지로 자동 폴백 (앱이 안 깨짐)
 */
export default function ExerciseImage({ exerciseId, category, className = "" }: Props) {
  const [errored, setErrored] = useState(false);

  if (errored) {
    return (
      <div className={`ex-img-fallback ${className}`} aria-hidden="true">
        <span>{getCategoryEmoji(category)}</span>
      </div>
    );
  }

  return (
    <img
      src={`/exercises/${exerciseId}.png`}
      alt=""
      className={`ex-img ${className}`}
      onError={() => setErrored(true)}
      draggable={false}
    />
  );
}
