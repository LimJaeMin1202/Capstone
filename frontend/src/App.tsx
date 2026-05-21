import { useState } from "react";
import type { Exercise } from "./types/exercise";
import type { SessionStats } from "./components/PoseDetector";
import ExerciseSelect from "./components/ExerciseSelect";
import ExerciseScreen from "./components/ExerciseScreen";
import RecordsScreen from "./components/RecordsScreen";
import { saveRecord } from "./api/records";
import "./App.css";

type View = "select" | "exercise" | "records";

function App() {
  const [view, setView] = useState<View>("select");
  const [selected, setSelected] = useState<Exercise | null>(null);

  async function handleComplete(stats: SessionStats) {
    if (selected) {
      try {
        await saveRecord({ exerciseId: selected.id, ...stats });
      } catch (err) {
        alert("기록 저장 실패: " + (err as Error).message);
      }
    }
    setSelected(null);
    setView("records");
  }

  function goSelect() {
    setSelected(null);
    setView("select");
  }

  return (
    <div className="app">
      <header className="navbar">
        <div className="navbar-inner">
          <div className="navbar-brand">
            <span className="logo">🦵</span>
            건강한 우리 운동
          </div>
          <nav className="navbar-nav">
            <button
              className={view !== "records" ? "nav-link active" : "nav-link"}
              onClick={goSelect}
            >
              운동하기
            </button>
            <button
              className={view === "records" ? "nav-link active" : "nav-link"}
              onClick={() => {
                setSelected(null);
                setView("records");
              }}
            >
              기록 보기
            </button>
          </nav>
        </div>
      </header>

      <main className="main">
        {view === "select" && (
          <>
            <h1 className="page-title">오늘은 어떤 운동을 해볼까요?</h1>
            <p className="page-sub">
              운동을 고르면 카메라가 자세를 보고 실시간으로 알려드려요.
            </p>
            <ExerciseSelect
              onSelect={(ex) => {
                setSelected(ex);
                setView("exercise");
              }}
            />
          </>
        )}

        {view === "exercise" && selected && (
          <ExerciseScreen
            exercise={selected}
            onBack={goSelect}
            onComplete={handleComplete}
          />
        )}

        {view === "records" && (
          <>
            <h1 className="page-title">나의 운동 기록</h1>
            <p className="page-sub">그동안 해온 운동을 한눈에 확인해요.</p>
            <RecordsScreen />
          </>
        )}
      </main>
    </div>
  );
}

export default App;
