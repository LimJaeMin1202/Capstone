import type { Exercise } from "../types/exercise";

const API_BASE = "http://localhost:8080";

// 운동 전체 목록 조회
export async function fetchExercises(): Promise<Exercise[]> {
  const res = await fetch(`${API_BASE}/api/exercises`);
  if (!res.ok) {
    throw new Error(`운동 목록 조회 실패 (${res.status})`);
  }
  return res.json();
}

// 특정 운동 조회
export async function fetchExercise(id: string): Promise<Exercise> {
  const res = await fetch(`${API_BASE}/api/exercises/${id}`);
  if (!res.ok) {
    throw new Error(`운동 조회 실패 (${res.status})`);
  }
  return res.json();
}
