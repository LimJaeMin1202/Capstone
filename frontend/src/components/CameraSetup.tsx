import type { CameraPosition } from "../data/exerciseGuides";

interface Props {
  position: CameraPosition;
  issue: string | null;
  autoStart: boolean;
  onAutoStart: (enabled: boolean) => void;
  onStart: () => void;
}

export default function CameraSetup({ position, issue, autoStart, onAutoStart, onStart }: Props) {
  const direction = position === "측면" ? "옆쪽" : position === "정면" ? "정면" : "앞쪽 대각선";
  return (
    <div className="camera-setup" aria-label="카메라 위치 맞추기">
      <div className="camera-setup-copy">
        <h2>카메라를 {direction}에 두세요</h2>
        <p id="camera-setup-message" role="status" className={issue ? "" : "camera-setup-ready"}>
          {issue ?? "위치가 맞았어요. 시작할 수 있어요."}
        </p>
      </div>
      <div className="camera-setup-actions">
        <button type="button" className="start-btn" onClick={onStart} disabled={issue !== null}
          aria-describedby="camera-setup-message">
          운동 시작
        </button>
        <label className="camera-auto-start">
          <input type="checkbox" checked={autoStart} onChange={(event) => onAutoStart(event.target.checked)} />
          위치가 맞으면 3초 후 시작
        </label>
      </div>
    </div>
  );
}
