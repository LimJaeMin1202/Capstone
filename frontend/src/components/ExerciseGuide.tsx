import type { ExerciseGuide } from "../data/exerciseGuides";
import type { Exercise } from "../types/exercise";
import ExerciseImage from "./ExerciseImage";

interface Props {
  exercise: Exercise;
  guide: ExerciseGuide;
}

export type MotionCue = "move" | "hold" | "release";

export function ExerciseGuideCard({ exercise, guide, cue, onOpen }: Props & {
  cue: MotionCue | null;
  onOpen: () => void;
}) {
  const instruction = cue === "hold" ? "자세를 유지해 주세요."
    : cue === "release" ? "천천히 처음 자세로 돌아오세요."
    : cue === "move" ? guide.steps[0] ?? guide.prepare
    : guide.prepare.split(". ", 1)[0];

  return (
    <section className="motion-guide" aria-label="자세 안내">
      <ExerciseImage exerciseId={exercise.id} category={exercise.category} className="motion-guide-img" />
      <div className="motion-guide-copy">
        <div className="motion-guide-heading">
          <h2>{cue ? "지금 할 동작" : "준비 자세"}</h2>
          <button type="button" className="motion-guide-btn" aria-haspopup="dialog" onClick={onOpen}>
            자세 보기
          </button>
        </div>
        <p>{instruction}</p>
      </div>
    </section>
  );
}

export function ExerciseGuideDetails({ exercise, guide }: Props) {
  return (
    <div className="exercise-guide">
      <div className="exercise-guide-img">
        <ExerciseImage exerciseId={exercise.id} category={exercise.category} />
      </div>
      <div className="exercise-guide-text">
        <section className="guide-section">
          <h3 className="guide-section-title">준비 자세</h3>
          <p className="guide-prepare">{guide.prepare}</p>
        </section>
        <section className="guide-section">
          <h3 className="guide-section-title">따라하기</h3>
          <ol className="guide-steps">
            {guide.steps.map((step, index) => (
              <li key={step}>
                <span className="step-num" aria-hidden="true">{index + 1}</span>
                <span className="step-text">{step}</span>
              </li>
            ))}
          </ol>
        </section>
        <section className="guide-section guide-caution-box">
          <h3 className="guide-section-title">주의 사항</h3>
          <ul className="guide-cautions">
            {guide.cautions.map((caution) => <li key={caution}>{caution}</li>)}
          </ul>
        </section>
        <section className="guide-section guide-benefit-box">
          <h3 className="guide-section-title">어떤 효과가 있나요?</h3>
          <p className="guide-benefit">{guide.benefit}</p>
        </section>
      </div>
    </div>
  );
}
