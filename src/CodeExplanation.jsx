import React, { useState } from "react";
import {
  List,
  Footprints,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from "lucide-react";

export default function CodeExplanation({ explanation }) {
  const [mode, setMode] = useState("steps");
  const [step, setStep] = useState(0);
  const trace = explanation.trace ?? [];
  return (
    <section className="codingExplanation" aria-label="코드 실행 해설">
      <div className="explanationHeading">
        <h4>{explanation.title}</h4>
        <div className="segmented" aria-label="해설 보기 방식">
          <button
            aria-pressed={mode === "steps"}
            onClick={() => setMode("steps")}
          >
            <Footprints size={15} />한 단계씩
          </button>
          <button aria-pressed={mode === "all"} onClick={() => setMode("all")}>
            <List size={15} />
            전체 흐름
          </button>
        </div>
      </div>
      {explanation.warning && (
        <p className="sourceWarning">
          <strong>복원 자료 확인</strong> {explanation.warning}
        </p>
      )}
      {mode === "steps" ? (
        <>
          <div className="traceProgress">
            <progress value={step + 1} max={trace.length} />
            <span>
              {step + 1} / {trace.length}
            </span>
          </div>
          <div className="activeTrace" aria-live="polite">
            <span className="stepLabel">
              STEP {String(step + 1).padStart(2, "0")}
            </span>
            <pre>
              <code>{trace[step]?.code}</code>
            </pre>
            <p>{trace[step]?.note}</p>
          </div>
          <div className="traceControls">
            <button
              onClick={() => setStep(Math.max(0, step - 1))}
              disabled={step === 0}
            >
              <ChevronLeft size={18} />
              이전 단계
            </button>
            <button
              onClick={() => setStep(0)}
              title="처음부터"
              aria-label="해설 처음부터"
            >
              <RotateCcw size={17} />
            </button>
            <button
              onClick={() => setStep(Math.min(trace.length - 1, step + 1))}
              disabled={step >= trace.length - 1}
            >
              다음 단계
              <ChevronRight size={18} />
            </button>
          </div>
        </>
      ) : (
        <ol className="traceTable">
          {trace.map((s, i) => (
            <li className="traceRow" key={i}>
              <span className="stepLabel">{i + 1}</span>
              <code>{s.code}</code>
              <p>{s.note}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
