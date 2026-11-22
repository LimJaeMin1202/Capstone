import { apiFetch, extractError } from "./client";
import type { SessionStats } from "../utils/exerciseSession";

export interface ExerciseRecord {
  id?: number;
  exerciseId: string;
  duration: number; // 초
  goodCount: number;
  accuracy: number; // 자세 기준 충족률 (0~100)
  mode?: SessionStats["mode"] | null;
  totalHoldSeconds?: number | null;
  measuredFrames?: number | null;
  totalFrames?: number | null;
  createdAt?: string;
}

// 운동 기록 저장
export async function saveRecord(
  record: SessionStats & { exerciseId: string; sessionId: string }
): Promise<ExerciseRecord> {
  const res = await apiFetch("/api/records", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(record),
  });
  if (!res.ok) throw new Error(await extractError(res));
  return res.json();
}

// 운동 기록 전체 조회 (내 기록)
export async function fetchRecords(): Promise<ExerciseRecord[]> {
  const res = await apiFetch("/api/records");
  if (!res.ok) throw new Error(await extractError(res));
  return res.json();
}
