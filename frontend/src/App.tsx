import { useState } from "react";
import type { Exercise } from "./types/exercise";
import ExerciseSelect from "./components/ExerciseSelect";
import ExerciseScreen from "./components/ExerciseScreen";
import "./App.css";

function App() {
  const [selected, setSelected] = useState<Exercise | null>(null);

  return (
    <div className="app">
      <h1>🦴 AI 재활 운동 자세 피드백</h1>
      {selected ? (
        <ExerciseScreen exercise={selected} onBack={() => setSelected(null)} />
      ) : (
        <ExerciseSelect onSelect={setSelected} />
      )}
    </div>
  );
}

export default App;
