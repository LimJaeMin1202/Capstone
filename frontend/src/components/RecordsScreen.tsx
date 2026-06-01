import { useEffect, useState } from "react";
import { fetchRecords, type ExerciseRecord } from "../api/records";
import { fetchExercises } from "../api/exercises";

interface Summary {
  exerciseId: string;
  name: string;
  sessions: number;
  totalGood: number;
  avgAccuracy: number;
  lastDate: string;
}

interface DailyBar {
  label: string;   // 요일 (월/화/...)
  date: string;    // 날짜 (5/27)
  count: number;   // 그날 운동 횟수
  isToday: boolean;
}

interface WeeklyStats {
  thisWeekSessions: number;
  thisWeekMinutes: number;
  avgAccuracy: number;
  streak: number;
  daily: DailyBar[];
  feedback: string;
}

// ===== 날짜 유틸 =====
function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function daysAgo(n: number): Date {
  const d = startOfDay(new Date());
  d.setDate(d.getDate() - n);
  return d;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatDate(iso?: string): string {
  if (!iso) return "-";
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

// ===== 통계 계산 =====
function computeStats(records: ExerciseRecord[]): WeeklyStats {
  const today = startOfDay(new Date());
  const sevenDaysAgo = daysAgo(6); // 오늘 포함 7일

  const thisWeek = records.filter(
    (r) => r.createdAt && new Date(r.createdAt) >= sevenDaysAgo
  );
  const lastWeek = records.filter((r) => {
    if (!r.createdAt) return false;
    const d = new Date(r.createdAt);
    const start = daysAgo(13);
    return d >= start && d < sevenDaysAgo;
  });

  const thisWeekSessions = thisWeek.length;
  const thisWeekMinutes = Math.round(
    thisWeek.reduce((s, r) => s + r.duration, 0) / 60
  );
  const avgAccuracy =
    records.length > 0
      ? Math.round(
          records.reduce((s, r) => s + r.accuracy, 0) / records.length
        )
      : 0;

  // streak: 오늘부터 거꾸로 운동한 날 세기 (오늘 안 했어도 어제부터 셈)
  const exerciseDays = new Set(
    records
      .filter((r) => r.createdAt)
      .map((r) => startOfDay(new Date(r.createdAt!)).getTime())
  );
  let streak = 0;
  let cursor = 0;
  // 오늘이 없으면 어제부터 시작
  if (!exerciseDays.has(today.getTime())) cursor = 1;
  for (let i = cursor; i < 365; i++) {
    const d = daysAgo(i);
    if (exerciseDays.has(d.getTime())) streak++;
    else break;
  }

  // 최근 7일 막대그래프
  const dayLabels = ["일", "월", "화", "수", "목", "금", "토"];
  const daily: DailyBar[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = daysAgo(i);
    const count = records.filter(
      (r) => r.createdAt && isSameDay(new Date(r.createdAt), d)
    ).length;
    daily.push({
      label: dayLabels[d.getDay()],
      date: `${d.getMonth() + 1}/${d.getDate()}`,
      count,
      isToday: i === 0,
    });
  }

  // 피드백 메시지
  let feedback = "";
  const diff = thisWeekSessions - lastWeek.length;
  if (records.length === 0) {
    feedback = "🌱 첫 운동을 시작해볼까요?";
  } else if (thisWeekSessions === 0) {
    feedback = "🌿 이번 주는 아직 운동이 없어요. 한 번만 해볼까요?";
  } else if (lastWeek.length === 0) {
    feedback = `🎉 이번 주 ${thisWeekSessions}번 운동, 좋은 시작이에요!`;
  } else if (diff > 0) {
    feedback = `🚀 이번 주 ${thisWeekSessions}번, 지난주보다 ${diff}번 더 하셨어요!`;
  } else if (diff < 0) {
    feedback = `✨ 이번 주 ${thisWeekSessions}번. 지난주만큼 한 번 더 어떠세요?`;
  } else {
    feedback = `👏 이번 주 ${thisWeekSessions}번, 꾸준히 잘 하고 계세요!`;
  }

  return {
    thisWeekSessions,
    thisWeekMinutes,
    avgAccuracy,
    streak,
    daily,
    feedback,
  };
}

// ===== 컴포넌트 =====
export default function RecordsScreen() {
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [stats, setStats] = useState<WeeklyStats | null>(null);
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

        result.sort((a, b) => b.lastDate.localeCompare(a.lastDate));
        setSummaries(result);
        setStats(computeStats(records));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="state-msg">기록 불러오는 중...</p>;
  if (error) return <p className="state-msg error">❌ {error}</p>;

  // 기록 자체가 없을 때
  if (summaries.length === 0)
    return (
      <p className="empty-msg">
        아직 운동 기록이 없어요.
        <br />
        운동을 완료하면 여기에 기록이 쌓여요! 💪
      </p>
    );

  return (
    <div className="records-screen">
      {/* 한 줄 피드백 메시지 */}
      {stats && <div className="records-feedback">{stats.feedback}</div>}

      {/* 상단 요약 4카드 */}
      {stats && (
        <div className="records-summary-grid">
          <SummaryCard
            value={stats.thisWeekSessions}
            unit="회"
            label="이번 주 운동"
          />
          <SummaryCard
            value={stats.thisWeekMinutes}
            unit="분"
            label="이번 주 시간"
          />
          <SummaryCard
            value={stats.avgAccuracy}
            unit="%"
            label="평균 정확도"
          />
          <SummaryCard
            value={stats.streak}
            unit="일"
            label="연속 운동"
            highlight
          />
        </div>
      )}

      {/* 주간 추세 막대그래프 */}
      {stats && (
        <section className="records-section">
          <h3 className="records-section-title">📈 최근 7일 운동 추세</h3>
          <WeeklyBars daily={stats.daily} />
        </section>
      )}

      {/* 운동별 카드 */}
      <section className="records-section">
        <h3 className="records-section-title">📋 운동별 기록</h3>
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
      </section>
    </div>
  );
}

// ===== 작은 컴포넌트 =====
function SummaryCard({
  value,
  unit,
  label,
  highlight,
}: {
  value: number;
  unit: string;
  label: string;
  highlight?: boolean;
}) {
  return (
    <div className={`summary-card ${highlight ? "summary-card-highlight" : ""}`}>
      <div className="summary-card-value">
        {value}
        <span className="summary-card-unit">{unit}</span>
      </div>
      <div className="summary-card-label">{label}</div>
    </div>
  );
}

function WeeklyBars({ daily }: { daily: DailyBar[] }) {
  const max = Math.max(1, ...daily.map((d) => d.count));
  return (
    <div className="weekly-bars">
      {daily.map((d, i) => {
        const heightPct = (d.count / max) * 100;
        return (
          <div key={i} className="weekly-bar-col">
            <div className="weekly-bar-track">
              {d.count > 0 && (
                <div className="weekly-bar-num">{d.count}</div>
              )}
              <div
                className={`weekly-bar ${d.isToday ? "weekly-bar-today" : ""}`}
                style={{ height: `${Math.max(heightPct, d.count > 0 ? 6 : 0)}%` }}
              />
            </div>
            <div className={`weekly-bar-label ${d.isToday ? "today" : ""}`}>
              {d.label}
            </div>
            <div className="weekly-bar-date">{d.date}</div>
          </div>
        );
      })}
    </div>
  );
}
