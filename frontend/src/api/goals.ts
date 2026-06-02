import { apiFetch, extractError } from "./client";

export interface UserGoal {
  weeklySessionTarget: number;
  weeklyMinuteTarget: number;
}

// 내 운동 목표 조회 (없으면 백엔드가 기본값 자동 생성)
export async function fetchMyGoal(): Promise<UserGoal> {
  const res = await apiFetch("/api/goals");
  if (!res.ok) throw new Error(await extractError(res));
  return res.json();
}

export async function updateMyGoal(
  weeklySessionTarget: number,
  weeklyMinuteTarget: number
): Promise<UserGoal> {
  const res = await apiFetch("/api/goals", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ weeklySessionTarget, weeklyMinuteTarget }),
  });
  if (!res.ok) throw new Error(await extractError(res));
  return res.json();
}
