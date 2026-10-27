import { useEffect, useState } from "react";
import {
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import type { Exercise } from "./types/exercise";
import type { SessionStats } from "./components/PoseDetector";
import ExerciseSelect from "./components/ExerciseSelect";
import ExerciseScreen from "./components/ExerciseScreen";
import RecordsScreen from "./components/RecordsScreen";
import ResultScreen from "./components/ResultScreen";
import AuthPage from "./components/AuthPage";
import BirthYearModal from "./components/BirthYearModal";
import SettingsModal from "./components/SettingsModal";
import { saveRecord } from "./api/records";
import { fetchExercise } from "./api/exercises";
import { useAuth } from "./auth/useAuth";
import "./App.css";

// 어르신 친화 글씨 크기 — 실제 px는 CSS에서 결정 (PC/모바일 다르게 매핑)
type FontSize = "small" | "normal" | "large";

function App() {
  const { user, loading, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);

  // 글씨 크기 (localStorage에 저장, 로그인 전후 모두 적용)
  const [fontSize, setFontSize] = useState<FontSize>(
    () => (localStorage.getItem("font-size") as FontSize) || "normal"
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-font-size", fontSize);
    localStorage.setItem("font-size", fontSize);
  }, [fontSize]);

  function handleLogout() {
    navigate("/");
    logout();
  }

  if (loading) {
    return (
      <div className="app">
        <p className="state-msg" style={{ padding: 40 }}>
          불러오는 중...
        </p>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  // 카카오 가입자가 아직 출생연도 입력 안 했으면 강제 모달
  const needBirthYear = user.birthYear === null;

  // 네비바 active 상태
  const path = location.pathname;
  const isRecordsTab = path.startsWith("/records");
  const isExerciseTab = !isRecordsTab;

  return (
    <div className="app">
      {needBirthYear && <BirthYearModal mode="required" />}
      {showProfile && (
        <SettingsModal
          onClose={() => setShowProfile(false)}
          onLogout={handleLogout}
        />
      )}
      <header className="navbar">
        <div className="navbar-inner">
          <button
            type="button"
            className="navbar-brand"
            onClick={() => navigate("/")}
            aria-label="홈으로"
          >
            <img src={`${import.meta.env.BASE_URL}icon.png`} alt="CareFit" className="brand-logo" />
          </button>
          <nav className="navbar-nav">
            <button
              className={isExerciseTab ? "nav-link active" : "nav-link"}
              onClick={() => navigate("/")}
            >
              운동하기
            </button>
            <button
              className={isRecordsTab ? "nav-link active" : "nav-link"}
              onClick={() => navigate("/records")}
            >
              기록 보기
            </button>

            <div className="font-toggle" title="글씨 크기">
              <button
                className={fontSize === "small" ? "fs-btn active" : "fs-btn"}
                onClick={() => setFontSize("small")}
              >
                작게
              </button>
              <button
                className={fontSize === "normal" ? "fs-btn active" : "fs-btn"}
                onClick={() => setFontSize("normal")}
              >
                보통
              </button>
              <button
                className={fontSize === "large" ? "fs-btn active" : "fs-btn"}
                onClick={() => setFontSize("large")}
              >
                크게
              </button>
            </div>

            <span className="navbar-user">{user.name}님</span>
            <button
              type="button"
              className="settings-btn"
              onClick={() => setShowProfile(true)}
              title="설정"
              aria-label="설정"
            >
              ⚙
            </button>
          </nav>
        </div>
      </header>

      <main className="main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/exercise/:id" element={<ExercisePage />} />
          <Route path="/result" element={<ResultPage />} />
          <Route path="/records" element={<RecordsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

// ===== 페이지 컴포넌트 =====

function HomePage() {
  const navigate = useNavigate();
  return (
    <>
      <h1 className="page-title">오늘은 어떤 운동을 해볼까요?</h1>
      <p className="page-sub">
        운동을 고르면 카메라가 자세를 보고 실시간으로 알려드려요.
      </p>
      <ExerciseSelect onSelect={(ex) => navigate(`/exercise/${ex.id}`)} />
    </>
  );
}

function ExercisePage() {
  const { id } = useParams<{ id: string }>();
  if (!id) return <Navigate to="/" replace />;
  return <ExerciseDetails key={id} id={id} />;
}

function ExerciseDetails({ id }: { id: string }) {
  const navigate = useNavigate();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchExercise(id)
      .then((loaded) => { if (!cancelled) setExercise(loaded); })
      .catch((err) => { if (!cancelled) setError(err.message); });
    return () => { cancelled = true; };
  }, [id]);

  if (error)
    return (
      <p className="state-msg error">
        ❌ {error}
        <br />
        운동을 찾을 수 없어요.
      </p>
    );
  if (!exercise) return <p className="state-msg">운동 정보 불러오는 중...</p>;

  return (
    <ExerciseScreen
      exercise={exercise}
      onBack={() => navigate("/")}
      onComplete={async (stats) => {
        try {
          await saveRecord({ exerciseId: exercise.id, ...stats });
        } catch (err) {
          alert("기록 저장 실패: " + (err as Error).message);
        }
        // 새로고침 시 result는 다시 못 보이게 replace + state로 전달
        navigate("/result", { state: { exercise, stats }, replace: true });
      }}
    />
  );
}

function ResultPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as
    | { exercise: Exercise; stats: SessionStats }
    | null;

  // 새로고침 등으로 state가 사라지면 홈으로
  if (!state?.exercise || !state?.stats) {
    return <Navigate to="/" replace />;
  }

  return (
    <ResultScreen
      exercise={state.exercise}
      stats={state.stats}
      onAnother={() => navigate("/")}
      onRecords={() => navigate("/records")}
    />
  );
}

function RecordsPage() {
  return (
    <>
      <h1 className="page-title">나의 운동 기록</h1>
      <p className="page-sub">그동안 해온 운동을 한눈에 확인해요.</p>
      <RecordsScreen />
    </>
  );
}

export default App;
