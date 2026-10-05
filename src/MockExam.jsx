import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Clock3,
  Flag,
  ChevronLeft,
  ChevronRight,
  Send,
  Shuffle,
  CheckCircle2,
  Circle,
  XCircle,
  X,
  Eye,
  RotateCcw,
  ExternalLink,
} from "lucide-react";
import {
  createMockSession,
  restoreMockSession,
  blueprintCounts,
  scoreSummary,
  OFFICIAL_RULES_URL,
} from "./mockExamModel.js";
import { prepareQuestionHtml, prepareExamPrompt } from "./codeContent.js";
import CodeExplanation from "./CodeExplanation.jsx";

const STORAGE = "engineer-mock-exam-v1";
const labels = {
  c: "C",
  java: "Java",
  python: "Python",
  sql: "SQL",
  theory: "이론",
};
function readSaved(questions) {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE) ?? "{}");
    return {
      session: restoreMockSession(saved.session, questions),
      history: (saved.history ?? [])
        .map((s) => restoreMockSession(s, questions))
        .filter(Boolean)
        .slice(0, 10),
    };
  } catch {
    return { session: null, history: [] };
  }
}
function timeText(milliseconds) {
  const total = Math.max(0, Math.ceil(milliseconds / 1000));
  return `${String(Math.floor(total / 3600)).padStart(2, "0")}:${String(Math.floor((total % 3600) / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export default function MockExam({
  catalog,
  explanations,
  onBack,
  onApplyRecords,
}) {
  const [saved, setSaved] = useState(() => readSaved(catalog.questions));
  const [blueprint, setBlueprint] = useState("2026년-2회");
  const [now, setNow] = useState(Date.now());
  const [confirm, setConfirm] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [error, setError] = useState("");
  const dialogRef = useRef(null);
  const session = saved.session;
  const running = session?.status === "running";
  const byKey = useMemo(
    () => new Map(catalog.questions.map((q) => [q.key, q])),
    [catalog],
  );
  const counts = useMemo(
    () => blueprintCounts(catalog.questions, blueprint),
    [catalog, blueprint],
  );
  const current = session && byKey.get(session.keys[session.index]);
  const promptHtml = useMemo(
    () => (current ? prepareExamPrompt(current.promptHtml) : ""),
    [current],
  );
  const explanation =
    current && explanations[current.explanationKey ?? current.key];
  const score = session && scoreSummary(session);
  const answered =
    session?.keys.filter((k) => session.answers[k]?.trim()).length ?? 0;

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE, JSON.stringify(saved));
    } catch {
      setError(
        "모의시험 기록을 저장하지 못했습니다. 브라우저 저장 공간을 확인하세요.",
      );
    }
  }, [saved]);
  useEffect(() => {
    if (!running) return;
    const tick = () => {
      const time = Date.now();
      setNow(time);
      if (time >= session.deadline) {
        setSaved((s) =>
          s.session?.status === "running"
            ? {
                ...s,
                session: {
                  ...s.session,
                  status: "submitted",
                  submittedAt: s.session.deadline,
                  reason: "timeout",
                },
              }
            : s,
        );
        setShowSolution(false);
        setConfirm(false);
      }
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [running, session?.deadline]);
  useEffect(() => {
    if (session?.status === "submitted")
      setSaved((s) => {
        const history = [
          s.session,
          ...s.history.filter((item) => item.id !== s.session.id),
        ].slice(0, 10);
        if (JSON.stringify(history) === JSON.stringify(s.history)) return s;
        return { ...s, history };
      });
  }, [session]);

  useEffect(() => {
    if (!confirm) return;
    const previous = document.activeElement;
    const buttons = [...dialogRef.current.querySelectorAll("button")];
    buttons[0]?.focus();
    function keydown(event) {
      if (event.key === "Escape") setConfirm(false);
      if (event.key === "Tab") {
        if (event.shiftKey && document.activeElement === buttons[0]) {
          event.preventDefault();
          buttons.at(-1)?.focus();
        } else if (
          !event.shiftKey &&
          document.activeElement === buttons.at(-1)
        ) {
          event.preventDefault();
          buttons[0]?.focus();
        }
      }
    }
    document.addEventListener("keydown", keydown);
    return () => {
      document.removeEventListener("keydown", keydown);
      previous?.focus();
    };
  }, [confirm]);

  function update(change) {
    setSaved((s) => ({ ...s, session: { ...s.session, ...change } }));
  }
  function jump(index) {
    update({ index });
    setShowSolution(false);
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  function start() {
    try {
      const next = createMockSession(catalog.questions, blueprint);
      setSaved((s) => ({ ...s, session: next }));
      setNow(Date.now());
      setShowSolution(false);
    } catch (e) {
      setError(e.message);
    }
  }
  function submit() {
    update({ status: "submitted", submittedAt: Date.now(), reason: "manual" });
    setConfirm(false);
    setShowSolution(false);
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  function enterScore(value) {
    const next = { ...session.scores };
    if (value === "") delete next[current.key];
    else {
      const number = Number(value);
      if (!Number.isFinite(number) || number < 0 || number > 5) return;
      next[current.key] = number;
    }
    update({ scores: next, recorded: false });
  }

  return (
    <main className={`app mockApp ${session ? "numberPanelOpen" : ""}`}>
      <header className="appHeader">
        <div className="headerBrand">
          <BookOpen size={23} />
          <strong>랜덤 모의시험</strong>
        </div>
        <button className="backStudy" onClick={onBack}>
          <ArrowLeft size={17} />
          기출 학습
        </button>
      </header>
      <section className="workspace mockWorkspace">
        {error && (
          <p className="notice" role="alert">
            {error}
            <button onClick={() => setError("")} aria-label="알림 닫기">
              <X size={16} />
            </button>
          </p>
        )}
        {!session ? (
          <>
            <div className="mockSetupHeading">
              <p>2026년 3회 대비</p>
              <h2>기출로 실전처럼</h2>
            </div>
            <div className="examRules">
              <div>
                <Clock3 size={20} />
                <strong>150분</strong>
                <span>필답형</span>
              </div>
              <div>
                <BookOpen size={20} />
                <strong>20문제</strong>
                <span>기출 랜덤</span>
              </div>
              <div>
                <CheckCircle2 size={20} />
                <strong>60점</strong>
                <span>연습 합격선</span>
              </div>
            </div>
            <section className="mockSettings">
              <label htmlFor="blueprint">문제 구성 기준</label>
              <select
                id="blueprint"
                value={blueprint}
                onChange={(e) => setBlueprint(e.target.value)}
              >
                {catalog.groups
                  .filter(
                    (g) => g.id.startsWith("2025") || g.id.startsWith("2026"),
                  )
                  .map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.title} 구성
                    </option>
                  ))}
              </select>
              <div className="blueprintCounts">
                {Object.entries(counts).map(([key, value]) => (
                  <span key={key}>
                    {labels[key]} <b>{value}</b>
                  </span>
                ))}
              </div>
              <p>
                선택한 회차의 유형별 문항 수를 맞춰 전체 회차 기출에서 중복 없이
                출제합니다. 창작 문제는 제외합니다.
              </p>
              <button className="primary" onClick={start}>
                <Shuffle size={18} />
                모의시험 시작
              </button>
            </section>
            <p className="mockRuleNote">
              시험 중 정답·해설은 숨겨집니다. 제출 후 문항당 0~5점으로 직접
              채점합니다. 복원 자료의 세부 배점과 실제 채점 결과는 다를 수
              있습니다.{" "}
              <a href={OFFICIAL_RULES_URL} target="_blank" rel="noreferrer">
                큐넷 시험 안내 <ExternalLink size={12} />
              </a>
            </p>
            {!!saved.history.length && (
              <section className="mockHistory">
                <h3>지난 모의시험</h3>
                {saved.history.map((s) => {
                  const summary = scoreSummary(s);
                  return (
                    <button
                      key={s.id}
                      onClick={() => {
                        setSaved((v) => ({ ...v, session: s }));
                        setShowSolution(false);
                      }}
                    >
                      <span>
                        {new Date(s.startedAt).toLocaleDateString("ko-KR")} ·{" "}
                        {s.blueprint.replace("-", " ")} 구성
                      </span>
                      <b>
                        {summary.complete
                          ? `${summary.score}점`
                          : `${summary.graded}/20 채점`}
                      </b>
                      <ChevronRight size={16} />
                    </button>
                  );
                })}
              </section>
            )}
          </>
        ) : (
          <>
            <div className="mockStatus">
              <div>
                <p>
                  {session.blueprint.replace("-", " ")} 구성 ·{" "}
                  {running ? "시험 진행 중" : "제출 완료"}
                </p>
                <h2>{session.index + 1}번 문제</h2>
              </div>
              {running ? (
                <div
                  className={`examClock ${session.deadline - now < 600000 ? "urgent" : ""}`}
                  role="timer"
                  aria-label="남은 시험 시간"
                >
                  <Clock3 size={18} />
                  {timeText(session.deadline - now)}
                </div>
              ) : (
                <div className="examResult">
                  <strong>
                    {score.complete
                      ? `${score.score} / 100`
                      : `${score.graded} / 20 채점`}
                  </strong>
                  <span>
                    {score.complete
                      ? score.passed
                        ? "연습 합격선 도달"
                        : "복습이 필요합니다"
                      : "정답과 비교해 직접 채점하세요"}
                  </span>
                </div>
              )}
            </div>
            {!running && (
              <div className="mockSubmittedNote">
                {session.reason === "timeout"
                  ? "제한 시간이 끝나 답안이 자동 제출되었습니다."
                  : "답안이 제출되었습니다."}{" "}
                <button
                  onClick={() => {
                    setSaved((s) => ({ ...s, session: null }));
                    setShowSolution(false);
                  }}
                >
                  <RotateCcw size={15} />새 모의시험
                </button>
                {score.complete && (
                  <button
                    disabled={session.recorded}
                    onClick={() => {
                      onApplyRecords(
                        Object.fromEntries(
                          session.keys.map((key) => [
                            key,
                            session.scores[key] === 5 ? "correct" : "wrong",
                          ]),
                        ),
                      );
                      update({ recorded: true });
                    }}
                  >
                    <CheckCircle2 size={15} />
                    {session.recorded
                      ? "학습 기록에 반영됨"
                      : "학습 기록에 반영"}
                  </button>
                )}
              </div>
            )}
            <article className="questionCard">
              <div
                className="questionContent"
                dangerouslySetInnerHTML={{ __html: promptHtml }}
              />
              <section className="answerPanel">
                <label htmlFor="mockAnswer">
                  {running ? "내 답안" : "제출한 답안"}
                </label>
                <textarea
                  id="mockAnswer"
                  value={session.answers[current.key] ?? ""}
                  readOnly={!running}
                  onChange={(e) =>
                    update({
                      answers: {
                        ...session.answers,
                        [current.key]: e.target.value,
                      },
                    })
                  }
                  placeholder="답안을 입력하세요"
                />
                <div className="actions">
                  {running ? (
                    <button
                      aria-pressed={!!session.flags[current.key]}
                      onClick={() =>
                        update({
                          flags: {
                            ...session.flags,
                            [current.key]: !session.flags[current.key],
                          },
                        })
                      }
                    >
                      <Flag size={17} />
                      다시 볼 문제
                    </button>
                  ) : (
                    <button
                      className="primary"
                      onClick={() => setShowSolution((s) => !s)}
                    >
                      <Eye size={17} />
                      {showSolution ? "풀이 숨기기" : "정답 및 풀이"}
                    </button>
                  )}
                </div>
              </section>
              {!running && showSolution && (
                <section className="solution">
                  <div className="solutionHeader">
                    <h3>정답 및 풀이</h3>
                    <span>
                      {current.examTitle} · {current.number}번
                    </span>
                  </div>
                  {explanation ? (
                    <>
                      <pre className="answerTextBlock">
                        {explanation.answer ?? current.answerText}
                      </pre>
                      <CodeExplanation
                        key={current.key}
                        explanation={explanation}
                        language={current.language}
                      />
                    </>
                  ) : (
                    <div
                      dangerouslySetInnerHTML={{
                        __html: prepareQuestionHtml(current.answerHtml),
                      }}
                    />
                  )}
                  <div className="mockGrading">
                    <label htmlFor="mockScore">이 문제 점수</label>
                    <input
                      id="mockScore"
                      type="number"
                      min="0"
                      max="5"
                      step="0.25"
                      value={session.scores[current.key] ?? ""}
                      onChange={(e) => enterScore(e.target.value)}
                    />
                    <span>/ 5점</span>
                    <button
                      aria-pressed={session.scores[current.key] === 0}
                      onClick={() => enterScore("0")}
                    >
                      0점
                    </button>
                    <button
                      aria-pressed={session.scores[current.key] === 5}
                      onClick={() => enterScore("5")}
                    >
                      5점
                    </button>
                  </div>
                </section>
              )}
            </article>
            <footer className="pager">
              <button
                onClick={() => jump(session.index - 1)}
                disabled={session.index === 0}
                aria-label="이전 문제"
              >
                <ChevronLeft size={18} />
                이전
              </button>
              <span>{session.index + 1} / 20</span>
              <button
                onClick={() => jump(session.index + 1)}
                disabled={session.index === 19}
                aria-label="다음 문제"
              >
                다음
                <ChevronRight size={18} />
              </button>
              {running && (
                <button className="submitExam" onClick={() => setConfirm(true)}>
                  <Send size={16} />
                  제출
                </button>
              )}
            </footer>
          </>
        )}
      </section>
      {session && (
        <nav className="questionNav" aria-label="모의시험 문제 목록">
          <div className="panelHeading">
            <h2>{running ? "답안 현황" : "채점 현황"}</h2>
            <small>
              {running ? `${answered}/20 작성` : `${score.graded}/20 채점`}
            </small>
          </div>
          <div className="numberGrid">
            {session.keys.map((key, i) => (
              <button
                key={key}
                aria-label={`${i + 1}번 문제`}
                aria-current={i === session.index ? "true" : undefined}
                className={i === session.index ? "active" : ""}
                onClick={() => jump(i)}
              >
                {!running && session.scores[key] === 0 ? (
                  <XCircle className="wrongIcon" size={14} />
                ) : (
                    running
                      ? session.answers[key]?.trim()
                      : Number.isFinite(session.scores[key])
                  ) ? (
                  <CheckCircle2 size={14} />
                ) : (
                  <Circle size={14} />
                )}
                <span>{i + 1}</span>
                {session.flags[key] && <Flag className="examFlag" size={9} />}
              </button>
            ))}
          </div>
          {running && (
            <p className="examNavNote">
              미답 {20 - answered}문제 · 표시{" "}
              {session.keys.filter((k) => session.flags[k]).length}문제
            </p>
          )}
        </nav>
      )}
      {confirm && (
        <div
          className="dialogBackdrop"
          onClick={(event) => {
            if (event.target === event.currentTarget) setConfirm(false);
          }}
        >
          <section
            ref={dialogRef}
            className="submitDialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="submitTitle"
          >
            <h2 id="submitTitle">답안을 제출할까요?</h2>
            <p>
              {answered === 20
                ? "20문제 답안이 모두 작성되었습니다."
                : `${20 - answered}문제의 답안이 비어 있습니다.`}{" "}
              제출 후에는 답안을 수정할 수 없습니다.
            </p>
            <div>
              <button onClick={() => setConfirm(false)}>계속 풀기</button>
              <button className="primary" onClick={submit}>
                <Send size={16} />
                제출 확정
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
