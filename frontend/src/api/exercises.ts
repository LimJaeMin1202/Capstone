import type { Exercise } from "../types/exercise";
import { apiFetch, extractError } from "./client";

// 운동 전체 목록 조회
export async function fetchExercises(): Promise<Exercise[]> {
  const res = await apiFetch("/api/exercises");
  if (!res.ok) throw new Error(await extractError(res));
  return res.json();
}

// 특정 운동 조회
export async function fetchExercise(id: string): Promise<Exercise> {
  const res = await apiFetch(`/api/exercises/${id}`);
  if (!res.ok) throw new Error(await extractError(res));
  return res.json();
}
