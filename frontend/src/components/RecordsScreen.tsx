import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { fetchRecords, type ExerciseRecord } from "../api/records";
import { fetchExercises } from "../api/exercises";
import { fetchMyGoal, type UserGoal } from "../api/goals";

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
  weekStart: Date;          // 주 시작 (월요일)
  weekEnd: Date;            // 주 끝 (일요일)
  weekOffset: number;       // 0=이번주, -1=지난주, ...
  weekSessions: number;
  weekMinutes: number;
  avgAccuracy: number;      // 전체 평균 (주 무관)
  streak: number;           // 오늘 기준 연속일 (주 무관)
  daily: DailyBar[];        // 해당 주의 월~일
  feedback: string;
}

// ===== 날짜 유틸 =====
function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

// 그 날짜가 속한 주의 월요일 (한국 기준 월요일 시작)
function startOfWeek(d: Date): Date {
  const day = d.getDay(); // 0(일) ~ 6(토)
  const offset = day === 0 ? -6 : 1 - day;
  const monday = startOfDay(d);
  monday.setDate(monday.getDate() + offset);
  return monday;
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

function formatDateShort(d: Date): string {
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function weekLabel(offset: number): string {
  if (offset === 0) return "이번 주";
  if (offset === -1) return "지난 주";
  return `${-offset}주 전`;
}

// ===== 통계 계산 (weekOffset 기준 주) =====
function computeStats(records: ExerciseRecord[], weekOffset: number): WeeklyStats {
  const today = startOfDay(new Date());
  const thisMonday = startOfWeek(today);

  // 선택한 주의 월요일 / 일요일
  const weekStart = new Date(thisMonday);
  weekStart.setDate(weekStart.getDate() + weekOffset * 7);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  // 직전 주의 월/일 (피드백 메시지 비교용)
  const prevStart = new Date(weekStart);
  prevStart.setDate(prevStart.getDate() - 7);
  const prevEnd = new Date(weekStart);
  prevEnd.setDate(prevEnd.getDate() - 1);

  function inRange(r: ExerciseRecord, from: Date, to: Date): boolean {
    if (!r.createdAt) return false;
    const d = new Date(r.createdAt);
    const dayStart = startOfDay(d);
    return dayStart >= from && dayStart <= to;
  }

  const weekRecs = records.filter((r) => inRange(r, weekStart, weekEnd));
  const prevRecs = records.filter((r) => inRange(r, prevStart, prevEnd));

  const weekSessions = weekRecs.length;
  const weekMinutes = Math.round(
    weekRecs.reduce((s, r) => s + r.duration, 0) / 60
  );
  const avgAccuracy =
    records.length > 0
      ? Math.round(
          records.reduce((s, r) => s + r.accuracy, 0) / records.length
        )
      : 0;

  // streak는 항상 오늘 기준
  const exerciseDays = new Set(
    records
      .filter((r) => r.createdAt)
      .map((r) => startOfDay(new Date(r.createdAt!)).getTime())
  );
  let streak = 0;
  let cursor = 0;
  if (!exerciseDays.has(today.getTime())) cursor = 1;
  for (let i = cursor; i < 365; i++) {
    const d = daysAgo(i);
    if (exerciseDays.has(d.getTime())) streak++;
    else break;
  }

  // 선택한 주의 월~일 막대그래프
  const dayLabels = ["월", "화", "수", "목", "금", "토", "일"];
  const daily: DailyBar[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    const count = records.filter(
      (r) => r.createdAt && isSameDay(new Date(r.createdAt), d)
    ).length;
    daily.push({
      label: dayLabels[i],
      date: formatDateShort(d),
      count,
      isToday: isSameDay(d, today),
    });
  }

  // 피드백 메시지 (주 기준)
  let feedback = "";
  if (weekOffset === 0) {
    const diff = weekSessions - prevRecs.length;
    if (records.length === 0) {
      feedback = "🌱 첫 운동을 시작해볼까요?";
    } else if (weekSessions === 0) {
      feedback = "🌿 이번 주는 아직 운동이 없어요. 한 번만 해볼까요?";
    } else if (prevRecs.length === 0) {
      feedback = `🎉 이번 주 ${weekSessions}번 운동, 좋은 시작이에요!`;
    } else if (diff > 0) {
      feedback = `🚀 이번 주 ${weekSessions}번, 지난주보다 ${diff}번 더 하셨어요!`;
    } else if (diff < 0) {
      feedback = `✨ 이번 주 ${weekSessions}번. 지난주만큼 한 번 더 어떠세요?`;
    } else {
      feedback = `👏 이번 주 ${weekSessions}번, 꾸준히 잘 하고 계세요!`;
    }
  } else {
    if (weekSessions === 0) {
      feedback = `📅 ${weekLabel(weekOffset)}는 운동 기록이 없어요.`;
    } else {
      feedback = `📅 ${weekLabel(weekOffset)}는 ${weekSessions}번 운동하셨네요.`;
    }
  }

  return {
    weekStart,
    weekEnd,
    weekOffset,
    weekSessions,
    weekMinutes,
    avgAccuracy,
    streak,
    daily,
    feedback,
  };
}

// ===== 컴포넌트 =====
export default function RecordsScreen() {
  const [searchParams, setSearchParams] = useSearchParams();
  const weekOffset = clampOffset(Number(searchParams.get("week") ?? "0"));

  const [records, setRecords] = useState<ExerciseRecord[]>([]);
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [goal, setGoal] = useState<UserGoal | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchRecords(), fetchExercises(), fetchMyGoal()])
      .then(([recs, exercises, userGoal]) => {
        setRecords(recs);
        setGoal(userGoal);
        const nameMap: Record<string, string> = {};
        for (const ex of exercises) nameMap[ex.id] = ex.name;

        const grouped: Record<string, ExerciseRecord[]> = {};
        for (const r of recs) {
          (grouped[r.exerciseId] ??= []).push(r);
        }
        const result: Summary[] = Object.entries(grouped).map(([id, list]) => {
          const totalGood = list.reduce((s, r) => s + r.goodCount, 0);
          const avgAccuracy = Math.round(
            list.reduce((s, r) => s + r.accuracy, 0) / list.length
          );
          const lastDate = list.map((r) => r.createdAt ?? "").sort().at(-1);
          return {
            exerciseId: id,
            name: nameMap[id] ?? id,
            sessions: list.length,
            totalGood,
            avgAccuracy,
            lastDate: lastDate ?? "",
          };
        });
        result.sort((a, b) => b.lastDate.localeCompare(a.lastDate));
        setSummaries(result);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // searchParams 변경마다 stats 다시 계산 (records 그대로 두고)
  const stats = records.length >= 0 ? computeStats(records, weekOffset) : null;

  function changeWeek(delta: number) {
    const next = clampOffset(weekOffset + delta);
    if (next === 0) {
      setSearchParams({}, { replace: false });
    } else {
      setSearchParams({ week: String(next) }, { replace: false });
    }
  }

  if (loading) return <p className="state-msg">기록 불러오는 중...</p>;
  if (error) return <p className="state-msg error">❌ {error}</p>;

  return (
    <div className="records-screen">
      {/* 주 선택 컨트롤 */}
      {stats && (
        <WeekNav
          weekStart={stats.weekStart}
          weekEnd={stats.weekEnd}
          weekOffset={stats.weekOffset}
          onPrev={() => changeWeek(-1)}
          onNext={() => changeWeek(+1)}
        />
      )}

      {/* 한 줄 피드백 메시지 */}
      {stats && <div className="records-feedback">{stats.feedback}</div>}

      {/* 목표 진행바 (이번 주 / 과거 주 모두 같은 목표 기준) */}
      {goal && stats && (
        <GoalProgressCard
          weekOffset={stats.weekOffset}
          sessionsDone={stats.weekSessions}
          minutesDone={stats.weekMinutes}
          sessionTarget={goal.weeklySessionTarget}
          minuteTarget={goal.weeklyMinuteTarget}
        />
      )}

      {/* 상단 요약 4카드 */}
      {stats && (
        <div className="records-summary-grid">
          <SummaryCard
            value={stats.weekSessions}
            unit="회"
            label={`${weekLabel(stats.weekOffset)} 운동`}
          />
          <SummaryCard
            value={stats.weekMinutes}
            unit="분"
            label={`${weekLabel(stats.weekOffset)} 시간`}
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
          <h3 className="records-section-title">
            📈 {weekLabel(stats.weekOffset)} 운동 추세
          </h3>
          <WeeklyBars daily={stats.daily} />
        </section>
      )}

      {/* 운동별 카드 */}
      <section className="records-section">
        <h3 className="records-section-title">📋 운동별 기록</h3>
        {summaries.length === 0 ? (
          <p className="empty-msg">
            아직 운동 기록이 없어요.
            <br />
            운동을 완료하면 여기에 쌓여요! 💪
          </p>
        ) : (
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
        )}
      </section>
    </div>
  );
}

// 너무 과거(52주 전)나 미래(0 초과)는 막음
function clampOffset(n: number): number {
  if (!Number.isFinite(n)) return 0;
  if (n > 0) return 0;
  if (n < -52) return -52;
  return Math.round(n);
}

// 주 선택 컨트롤
function WeekNav({
  weekStart,
  weekEnd,
  weekOffset,
  onPrev,
  onNext,
}: {
  weekStart: Date;
  weekEnd: Date;
  weekOffset: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="week-nav">
      <button
        type="button"
        className="week-nav-btn"
        onClick={onPrev}
        aria-label="이전 주"
      >
        ← 이전 주
      </button>
      <div className="week-nav-label">
        <span className="week-nav-desc">{weekLabel(weekOffset)}</span>
        <span className="week-nav-range">
          {formatDateShort(weekStart)} ~ {formatDateShort(weekEnd)}
        </span>
      </div>
      <button
        type="button"
        className="week-nav-btn"
        onClick={onNext}
        disabled={weekOffset >= 0}
        aria-label="다음 주"
      >
        다음 주 →
      </button>
    </div>
  );
}

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
              {d.count > 0 && <div className="weekly-bar-num">{d.count}</div>}
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

function GoalProgressCard({
  weekOffset,
  sessionsDone,
  minutesDone,
  sessionTarget,
  minuteTarget,
}: {
  weekOffset: number;
  sessionsDone: number;
  minutesDone: number;
  sessionTarget: number;
  minuteTarget: number;
}) {
  const sessionPct = Math.min(100, Math.round((sessionsDone / sessionTarget) * 100));
  const minutePct = Math.min(100, Math.round((minutesDone / minuteTarget) * 100));
  const sessionDone = sessionsDone >= sessionTarget;
  const minuteDone = minutesDone >= minuteTarget;
  const allDone = sessionDone && minuteDone;

  return (
    <div className={"goal-card" + (allDone ? " goal-card-done" : "")}>
      <div className="goal-card-head">
        <span className="goal-card-title">
          🎯 {weekLabel(weekOffset)} 목표
        </span>
        {allDone && <span className="goal-card-badge">달성!</span>}
      </div>
      <GoalRow
        label="운동 횟수"
        done={sessionsDone}
        target={sessionTarget}
        unit="회"
        pct={sessionPct}
        complete={sessionDone}
      />
      <GoalRow
        label="운동 시간"
        done={minutesDone}
        target={minuteTarget}
        unit="분"
        pct={minutePct}
        complete={minuteDone}
      />
    </div>
  );
}

function GoalRow({
  label,
  done,
  target,
  unit,
  pct,
  complete,
}: {
  label: string;
  done: number;
  target: number;
  unit: string;
  pct: number;
  complete: boolean;
}) {
  return (
    <div className="goal-row">
      <div className="goal-row-head">
        <span className="goal-row-label">{label}</span>
        <span className="goal-row-num">
          <b>{done}</b>
          <span className="goal-row-target">
            {" "}/ {target}{unit}
          </span>
          {complete && <span className="goal-row-check"> ✓</span>}
        </span>
      </div>
      <div className="goal-bar">
        <div
          className={"goal-bar-fill" + (complete ? " goal-bar-fill-done" : "")}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
