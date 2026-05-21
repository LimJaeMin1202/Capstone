import { useEffect, useState } from "react";
import { fetchRecords, type ExerciseRecord } from "../api/records";
import { fetchExercises } from "../api/exercises";

interface Summary {
  exerciseId: string;
  name: string;
  sessions: number; // 실시 횟수 (운동한 횟수)
  totalGood: number; // 누적 정확한 자세 횟수
  avgAccuracy: number; // 평균 정확도
  lastDate: string; // 최근 운동일
}

function formatDate(iso?: string): string {
  if (!iso) return "-";
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function RecordsScreen() {
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchRecords(), fetchExercises()])
      .then(([records, exercises]) => {
        const nameMap: Record<string, string> = {};
        for (const ex of exercises) nameMap[ex.id] = ex.name;

        // 운동별 그룹핑
        const grouped: Record<string, ExerciseRecord[]> = {};
        for (const r of records) {
          (grouped[r.exerciseId] ??= []).push(r);
        }

        const result: Summary[] = Object.entries(grouped).map(([id, recs]) => {
          const totalGood = recs.reduce((s, r) => s + r.goodCount, 0);
          const avgAccuracy = Math.round(
            recs.reduce((s, r) => s + r.accuracy, 0) / recs.length
          );
          const lastDate = recs
            .map((r) => r.createdAt ?? "")
            .sort()
            .at(-1);
          return {
            exerciseId: id,
            name: nameMap[id] ?? id,
            sessions: recs.length,
            totalGood,
            avgAccuracy,
            lastDate: lastDate ?? "",
          };
        });

        // 최근 운동순 정렬
        result.sort((a, b) => b.lastDate.localeCompare(a.lastDate));
        setSummaries(result);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="state-msg">기록 불러오는 중...</p>;
  if (error) return <p className="state-msg error">❌ {error}</p>;
  if (summaries.length === 0)
    return (
      <p className="empty-msg">
        아직 운동 기록이 없어요.
        <br />
        운동을 완료하면 여기에 기록이 쌓여요! 💪
      </p>
    );

  return (
    <div className="records-list">
      {summaries.map((s) => (
          <div key={s.exerciseId} className="record-card">
            <div className="record-head">
              <span className="record-name">{s.name}</span>
              <span className="record-date">최근 {formatDate(s.lastDate)}</span>
            </div>
            <div className="record-stats">
              <span>
                실시 <b>{s.sessions}회</b>
              </span>
              <span>
                누적 자세 <b>{s.totalGood}회</b>
              </span>
              <span>
                평균 정확도 <b>{s.avgAccuracy}%</b>
              </span>
            </div>
            <div className="record-bar">
              <div
                className="record-bar-fill"
                style={{ width: `${s.avgAccuracy}%` }}
              />
            </div>
          </div>
        ))}
    </div>
  );
}
