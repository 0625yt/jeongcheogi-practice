import React, { useState } from "react";
import {
  List,
  Footprints,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  MoveRight,
  Terminal,
} from "lucide-react";
import { highlightCode } from "./codeHighlighter.js";

function Narrative({ text }) {
  return (
    <div className="traceNarrative">
      {text
        .split(/(?<=[.!?])\s+(?!\d)/)
        .filter(Boolean)
        .map((sentence, i) => (
          <p key={i}>
            {sentence.split(/(-?\d+(?:\.\d+)?|→)/g).map((part, j) =>
              /^-?\d/.test(part) ? (
                <strong className="traceValue" key={j}>
                  {part}
                </strong>
              ) : part === "→" ? (
                <span className="inlineArrow" key={j}>
                  {" "}
                  →{" "}
                </span>
              ) : (
                part
              ),
            )}
          </p>
        ))}
    </div>
  );
}

function TraceDetails({ step }) {
  return (
    <>
      <Narrative text={step.note} />
      {step.diagram === "tree" && (
        <figure
          className="traceTree"
          aria-label="루트 21, 왼쪽 12, 오른쪽 64, 12의 자식 35와 53"
        >
          <div className="treeRoot">21</div>
          <div className="treeBranches">
            <div>
              <span>12</span>
              <div className="treeLeaves">
                <span>35</span>
                <span>53</span>
              </div>
            </div>
            <div>
              <span>64</span>
            </div>
          </div>
          <figcaption>왼쪽 → 오른쪽 → 현재 노드</figcaption>
        </figure>
      )}
      {step.state?.length > 0 && (
        <section className="stateChanges" aria-label="변수 값의 변화">
          <h5>값의 변화</h5>
          <div className="stateList">
            {step.state.map((v, i) => (
              <div className="stateChange" key={i}>
                <code>{v.name}</code>
                <div>
                  {v.before !== undefined && (
                    <>
                      <span className="beforeValue">{v.before}</span>
                      <MoveRight size={16} />
                    </>
                  )}
                  <strong>{v.after}</strong>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
      {step.table && (
        <div
          className="iterationTable"
          role="region"
          aria-label="반복별 계산"
          tabIndex={0}
        >
          <table>
            <thead>
              <tr>
                {step.table.columns.map((v, i) => (
                  <th key={i} scope="col">
                    {v}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {step.table.rows.map((row, i) => (
                <tr key={i}>
                  {row.map((v, j) => (
                    <td key={j}>{v}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {step.output !== undefined && (
        <div className="traceOutput">
          <span>
            <Terminal size={15} />
            현재 출력
          </span>
          <pre>{step.output || "(아직 없음)"}</pre>
        </div>
      )}
    </>
  );
}

export default function CodeExplanation({ explanation, language }) {
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
          <strong>복원 자료 확인</strong>
          {explanation.warning}
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
          <div className="stepStrip" aria-label="실행 단계 선택">
            {trace.map((s, i) => (
              <button
                key={i}
                aria-label={`${i + 1}단계로 이동`}
                aria-pressed={step === i}
                onClick={() => setStep(i)}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <div className="activeTrace" aria-live="polite">
            <span className="stepLabel">
              STEP {String(step + 1).padStart(2, "0")}
            </span>
            <pre className="traceCode">
              <code
                dangerouslySetInnerHTML={{
                  __html: highlightCode(trace[step]?.code ?? "", language),
                }}
              />
            </pre>
            <TraceDetails step={trace[step]} />
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
              <div className="traceBody">
                <pre className="traceCode">
                  <code
                    dangerouslySetInnerHTML={{
                      __html: highlightCode(s.code, language),
                    }}
                  />
                </pre>
                <TraceDetails step={s} />
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
