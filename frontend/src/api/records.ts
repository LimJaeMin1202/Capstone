const API_BASE = "http://localhost:8080";

export interface ExerciseRecord {
  id?: number;
  exerciseId: string;
  duration: number; // 초
  goodCount: number;
  accuracy: number; // 0~100
  createdAt?: string;
}

// 운동 기록 저장
export async function saveRecord(
  record: Pick<ExerciseRecord, "exerciseId" | "duration" | "goodCount" | "accuracy">
): Promise<ExerciseRecord> {
  const res = await fetch(`${API_BASE}/api/records`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(record),
  });
  if (!res.ok) throw new Error(`기록 저장 실패 (${res.status})`);
  return res.json();
}

// 운동 기록 전체 조회
export async function fetchRecords(): Promise<ExerciseRecord[]> {
  const res = await fetch(`${API_BASE}/api/records`);
  if (!res.ok) throw new Error(`기록 조회 실패 (${res.status})`);
  return res.json();
}
