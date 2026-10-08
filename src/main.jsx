import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BookOpen,
  CheckCircle2,
  Circle,
  ExternalLink,
  Eye,
  EyeOff,
  PanelLeft,
  ListOrdered,
  RotateCcw,
  Search,
  Shuffle,
  XCircle,
  X,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  Download,
  Upload,
  Flame,
  Check,
} from "lucide-react";
import {
  buildCatalog,
  filterQuestions,
  migrateProgress,
} from "./studyModel.js";
import { prepareQuestionHtml } from "./codeContent.js";
import { detailedCodeExplanations } from "./data/detailedExplanations.js";
import { codeFlows } from "./data/codeFlows.js";
import { sourceNotes } from "./data/sourceNotes.js";
import CodeExplanation from "./CodeExplanation.jsx";
import MockExam from "./MockExam.jsx";
import { flows2026Round2 } from "./data/flows2026Round2.js";
import { predictedExplanations } from "./data/predictedExams.js";
import PredictionOverview from "./PredictionOverview.jsx";
import "./styles.css";

const catalog = buildCatalog();
const byKey = new Map(catalog.questions.map((q) => [q.key, q]));
const STORAGE_KEY = "engineer-practical-study-v2";
const explanations = Object.fromEntries(
  Object.entries({
    ...detailedCodeExplanations,
    ...codeFlows,
    ...flows2026Round2,
    ...predictedExplanations,
  }).map(([key, value]) => [
    key,
    { ...value, warning: value.warning || sourceNotes[key] },
  ]),
);
const emptyState = {
  records: {},
  answers: {},
  bookmarks: {},
  group: "2026년-1회",
  currentKey: "2026년-1회-1",
  examPanel: false,
  numberPanel: true,
};

function validateState(value) {
  const state = { ...emptyState };
  for (const type of ["records", "answers", "bookmarks"]) {
    state[type] = Object.fromEntries(
      Object.entries(value?.[type] ?? {}).filter(
        ([key, v]) =>
          byKey.has(key) &&
          (type === "records"
            ? ["correct", "wrong"].includes(v)
            : type === "answers"
              ? typeof v === "string"
              : v === true),
      ),
    );
  }
  if (
    catalog.groups.some((g) => g.id === value?.group) ||
    value?.group === "all"
  )
    state.group = value.group;
  if (byKey.has(value?.currentKey)) state.currentKey = value.currentKey;
  state.examPanel = value?.examPanel === true;
  state.numberPanel = value?.numberPanel !== false;
  return state;
}
function restoreState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return validateState(JSON.parse(saved));
    return {
      ...emptyState,
      records: migrateProgress(
        JSON.parse(
          localStorage.getItem("engineer-practical-exam-trainer") ?? "{}",
        ),
        catalog,
      ),
    };
  } catch {
    return emptyState;
  }
}

function App() {
  const [siteMode, setSiteMode] = useState(() => {
    try {
      return localStorage.getItem("engineer-site-mode") === "mock"
        ? "mock"
        : "study";
    } catch {
      return "study";
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem("engineer-site-mode", siteMode);
    } catch {}
  }, [siteMode]);
  const [study, setStudy] = useState(restoreState);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState("");
  const [snapshot, setSnapshot] = useState({
    records: study.records,
    bookmarks: study.bookmarks,
  });
  const [revealed, setRevealed] = useState({});
  const [notice, setNotice] = useState("");
  const [resetConfirm, setResetConfirm] = useState(false);
  const uploadRef = useRef(null);
  const solutionRef = useRef(null);
  const group = catalog.groups.find((g) => g.id === study.group);
  const isCollection = !group || group.id.startsWith("코드기출-");
  const visible = useMemo(
    () =>
      filterQuestions(catalog.questions, {
        groupKeys: group?.keys,
        filter,
        query,
        topic,
        ...snapshot,
      }),
    [group, filter, query, topic, snapshot],
  );
  const current = visible.find((q) => q.key === study.currentKey) ?? visible[0];
  const index = current ? visible.indexOf(current) : -1;
  const explanation =
    current && explanations[current.explanationKey ?? current.key];
  const promptHtml = useMemo(
    () => (current ? prepareQuestionHtml(current.promptHtml) : ""),
    [current],
  );
  const answerHtml = useMemo(
    () => (current ? prepareQuestionHtml(current.answerHtml) : ""),
    [current],
  );
  const topicStats = useMemo(
    () =>
      Object.entries(catalog.frequencies).sort(
        (a, b) => b[1].exams.size - a[1].exams.size,
      ),
    [],
  );
  const stats = {
    correct: Object.values(study.records).filter((v) => v === "correct").length,
    wrong: Object.values(study.records).filter((v) => v === "wrong").length,
  };
  const frequent =
    current?.topics
      .map((t) => [t, catalog.frequencies[t]])
      .filter(([, f]) => f?.exams.size >= 3)
      .sort((a, b) => b[1].exams.size - a[1].exams.size) ?? [];

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(study));
    } catch {
      setNotice("기기 저장 공간이 부족합니다. 학습 기록을 백업해 주세요.");
    }
  }, [study]);
  useEffect(() => {
    if (current && current.key !== study.currentKey)
      setStudy((s) => ({ ...s, currentKey: current.key }));
  }, [current, study.currentKey]);
  useEffect(() => {
    const escape = (e) => {
      if (e.key === "Escape")
        setStudy((s) => ({ ...s, examPanel: false, numberPanel: false }));
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, []);

  function patch(value) {
    setStudy((s) => ({ ...s, ...value }));
  }
  function refreshSelection(change) {
    setSnapshot({ records: study.records, bookmarks: study.bookmarks });
    change();
  }
  function selectGroup(id) {
    refreshSelection(() => {
      patch({ group: id });
      setQuery("");
      setTopic("");
      setFilter("all");
    });
  }
  function jumpTo(next) {
    if (next) {
      patch({ currentKey: next.key });
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }
  function record(value, advance = false) {
    setStudy((s) => ({
      ...s,
      records: { ...s.records, [current.key]: value },
    }));
    if (advance) jumpTo(visible[index + 1]);
  }
  function reveal() {
    setRevealed((s) => ({ ...s, [current.key]: true }));
    requestAnimationFrame(() =>
      solutionRef.current?.scrollIntoView({
        block: "start",
        behavior: "smooth",
      }),
    );
  }
  function exportRecords() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify({ version: 2, study }, null, 2)], {
        type: "application/json",
      }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "jeongcheogi-study-backup.json";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function importRecords(event) {
    try {
      const file = event.target.files[0];
      if (!file) return;
      if (file.size > 5_000_000) throw new Error();
      const backup = JSON.parse(await file.text());
      if (backup.version !== 2 || !backup.study?.records) throw new Error();
      const imported = validateState(backup.study);
      const next = {
        ...study,
        records: { ...study.records, ...imported.records },
        answers: { ...study.answers, ...imported.answers },
        bookmarks: { ...study.bookmarks, ...imported.bookmarks },
      };
      setStudy(next);
      setSnapshot({ records: next.records, bookmarks: next.bookmarks });
      setNotice("백업 기록을 현재 기록에 합쳤습니다.");
    } catch {
      setNotice("올바른 학습 기록 백업 파일이 아닙니다.");
    }
    event.target.value = "";
  }

  if (siteMode === "mock")
    return (
      <MockExam
        catalog={catalog}
        explanations={explanations}
        initialBlueprint={group?.kind === "predicted" ? group.id : "2026년-2회"}
        onBack={() => setSiteMode("study")}
        onApplyRecords={(records) => {
          setStudy((s) => ({ ...s, records: { ...s.records, ...records } }));
          setNotice("모의시험 결과를 학습 기록에 반영했습니다.");
        }}
      />
    );

  return (
    <main
      className={`app ${study.examPanel ? "examPanelOpen" : ""} ${study.numberPanel ? "numberPanelOpen" : ""}`}
    >
      <header className="appHeader">
        <div className="headerBrand">
          <BookOpen size={23} />
          <strong>정보처리기사 실기</strong>
          <span>기출 훈련장</span>
        </div>
        <div className="mobilePanelActions">
          <button onClick={() => setSiteMode("mock")}>
            <Shuffle size={17} />
            모의시험
          </button>
          <button
            aria-expanded={study.examPanel}
            aria-controls="examPanel"
            onClick={() => patch({ examPanel: !study.examPanel })}
          >
            <PanelLeft size={18} />
            회차
          </button>
          <button
            aria-expanded={study.numberPanel}
            aria-controls="numberPanel"
            onClick={() => patch({ numberPanel: !study.numberPanel })}
          >
            <ListOrdered size={18} />
            문제 번호
          </button>
        </div>
      </header>
      <aside
        id="examPanel"
        className="sidebar"
        hidden={!study.examPanel}
        aria-label="회차 선택"
      >
        <div className="panelHeading">
          <h2>학습 목록</h2>
          <button
            aria-label="회차 패널 닫기"
            onClick={() => patch({ examPanel: false })}
          >
            <X size={18} />
          </button>
        </div>
        <section className="stats" aria-label="학습 현황">
          <div>
            <strong>{stats.correct}</strong>
            <span>맞힘</span>
          </div>
          <div>
            <strong>{stats.wrong}</strong>
            <span>오답</span>
          </div>
          <div>
            <strong>
              {catalog.questions.length - stats.correct - stats.wrong}
            </strong>
            <span>미풀이</span>
          </div>
        </section>
        <div className="examList">
          <button
            className={`examButton ${study.group === "all" ? "active" : ""}`}
            onClick={() => selectGroup("all")}
          >
            <span>전체 문제</span>
            <small>{catalog.questions.length}</small>
          </button>
          {catalog.groups.map((g, i) => (
            <React.Fragment key={g.id}>
              {(i === 0 || g.kind !== catalog.groups[i - 1]?.kind) && (
                <h3>
                  {g.kind === "language"
                    ? "언어별 코드"
                    : g.kind === "predicted"
                      ? "예상 문제집 · 5권"
                      : `회차별 기출 · ${catalog.examCount}회`}
                </h3>
              )}
              <button
                className={`examButton ${g.id === study.group ? "active" : ""}`}
                onClick={() => selectGroup(g.id)}
              >
                <span>{g.title}</span>
                <small>
                  {g.keys.filter((k) => study.records[k]).length}/
                  {g.keys.length}
                </small>
              </button>
            </React.Fragment>
          ))}
        </div>
        <div className="backupActions">
          <button onClick={exportRecords}>
            <Download size={16} />
            백업
          </button>
          <button onClick={() => uploadRef.current.click()}>
            <Upload size={16} />
            가져오기
          </button>
        </div>
        <input
          ref={uploadRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={importRecords}
        />
        <p className="storageNote">
          기록은 이 브라우저에 저장됩니다. 다른 기기에서는 백업 파일을 가져올 수
          있습니다.
        </p>
        {resetConfirm ? (
          <div className="resetConfirm">
            <p>답안·오답·북마크를 모두 지울까요?</p>
            <button
              onClick={() => {
                setStudy({ ...emptyState, examPanel: true });
                setRevealed({});
                setSnapshot({ records: {}, bookmarks: {} });
                setFilter("all");
                setQuery("");
                setTopic("");
                setResetConfirm(false);
              }}
            >
              모두 지우기
            </button>
            <button onClick={() => setResetConfirm(false)}>취소</button>
          </div>
        ) : (
          <button className="resetButton" onClick={() => setResetConfirm(true)}>
            <RotateCcw size={14} />
            기록 초기화
          </button>
        )}
      </aside>
      <section className="workspace">
        {notice && (
          <div className="notice" role="status">
            {notice}
            <button aria-label="알림 닫기" onClick={() => setNotice("")}>
              <X size={16} />
            </button>
          </div>
        )}
        <div className="studyToolbar">
          <div className="searchBox">
            <Search size={17} />
            <input
              aria-label="문제 검색"
              placeholder="회차·문제 내용 검색"
              value={query}
              onChange={(e) => refreshSelection(() => setQuery(e.target.value))}
            />
          </div>
          <select
            aria-label="출제 유형"
            value={topic}
            onChange={(e) => refreshSelection(() => setTopic(e.target.value))}
          >
            <option value="">모든 출제 유형</option>
            {topicStats.map(([t, f]) => (
              <option key={t} value={t}>
                {t} · {f.exams.size}회차
              </option>
            ))}
          </select>
        </div>
        <div className="filters" aria-label="학습 상태 필터">
          {[
            ["all", "전체"],
            ["unseen", "미풀이"],
            ["wrong", "오답"],
            ["correct", "맞힌 문제"],
            ["bookmarked", "북마크"],
          ].map(([v, label]) => (
            <button
              key={v}
              aria-pressed={filter === v}
              className={filter === v ? "active" : ""}
              onClick={() => refreshSelection(() => setFilter(v))}
            >
              {label}
            </button>
          ))}
          <span>{visible.length}문제</span>
        </div>
        {current ? (
          <>
            <header className="topbar">
              <div>
                <p>
                  {current.examTitle}
                  {isCollection && ` · 원문 ${current.number}번`}{" "}
                  {current.origin !== "past" && (
                    <span className="originBadge">
                      {current.origin === "predicted"
                        ? "예상 · 창작"
                        : current.origin === "practice"
                          ? "창작 연습"
                          : "기출 모음"}
                    </span>
                  )}
                </p>
                <h2>{isCollection ? index + 1 : current.number}번 문제</h2>
              </div>
              <div className="questionTools">
                <button
                  className={study.bookmarks[current.key] ? "bookmarked" : ""}
                  aria-label="문제 북마크"
                  aria-pressed={!!study.bookmarks[current.key]}
                  title="문제 북마크"
                  onClick={() =>
                    patch({
                      bookmarks: {
                        ...study.bookmarks,
                        [current.key]: !study.bookmarks[current.key],
                      },
                    })
                  }
                >
                  <Bookmark
                    size={19}
                    fill={
                      study.bookmarks[current.key] ? "currentColor" : "none"
                    }
                  />
                </button>
                {current.sourceUrl && (
                  <a
                    className="sourceLink"
                    href={current.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    원문
                    <ExternalLink size={15} />
                  </a>
                )}
              </div>
            </header>
            {group?.kind === "predicted" && (
              <PredictionOverview
                catalog={catalog}
                group={group}
                current={current}
                onExam={() => setSiteMode("mock")}
                onRelated={(q) => {
                  selectGroup(q.examId);
                  patch({ currentKey: q.key });
                  window.scrollTo({ top: 0, behavior: "instant" });
                }}
              />
            )}
            {!!frequent.length && (
              <details className="frequencyInfo">
                <summary>
                  <Flame size={16} />
                  <strong>빈출 유형</strong>
                  <span>
                    {frequent[0][0]} · {frequent[0][1].exams.size}개 회차
                  </span>
                </summary>
                <p>
                  수록된 {catalog.examCount}회차의 개념별 분류 기준입니다. 동일
                  문항의 재출제 횟수나 다음 시험 출제 확률은 아닙니다. 언어별
                  중복 목록과 창작 문제는 집계에서 제외했습니다.
                </p>
                {frequent.map(([t, f]) => (
                  <div key={t}>
                    <b>{t}</b>
                    <span>
                      {f.questionCount}문항 · {f.exams.size}회차
                    </span>
                    <small>
                      {[...f.exams].map((e) => e.replace("-", " ")).join(", ")}
                    </small>
                  </div>
                ))}
              </details>
            )}
            <article className="questionCard">
              <div
                className="questionContent"
                dangerouslySetInnerHTML={{ __html: promptHtml }}
              />
              <section className="answerPanel">
                <label htmlFor="answerInput">
                  내 답안{" "}
                  {study.records[current.key] && (
                    <span
                      className={`recordStatus ${study.records[current.key]}`}
                    >
                      {study.records[current.key] === "correct"
                        ? "맞힘"
                        : "오답"}
                    </span>
                  )}
                </label>
                <textarea
                  id="answerInput"
                  value={study.answers[current.key] ?? ""}
                  onChange={(e) =>
                    patch({
                      answers: {
                        ...study.answers,
                        [current.key]: e.target.value,
                      },
                    })
                  }
                  placeholder="답안을 입력하세요"
                />
                <div className="actions">
                  <button className="primary" onClick={reveal}>
                    <Eye size={17} />
                    정답 및 풀이
                  </button>
                  <button
                    onClick={() => {
                      const candidates = visible.filter(
                        (q) => q.key !== current.key,
                      );
                      jumpTo(
                        candidates[
                          Math.floor(Math.random() * candidates.length)
                        ],
                      );
                    }}
                    disabled={visible.length < 2}
                  >
                    <Shuffle size={17} />
                    랜덤
                  </button>
                </div>
              </section>
              {revealed[current.key] && (
                <section className="solution" ref={solutionRef}>
                  <div className="solutionHeader">
                    <h3>정답 및 풀이</h3>
                    <button
                      onClick={() =>
                        setRevealed((s) => ({ ...s, [current.key]: false }))
                      }
                    >
                      <EyeOff size={16} />
                      숨기기
                    </button>
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
                      className="originalSolution"
                      dangerouslySetInnerHTML={{ __html: answerHtml }}
                    />
                  )}
                  <div className="selfCheck">
                    <button
                      className="correct"
                      aria-pressed={study.records[current.key] === "correct"}
                      onClick={() => record("correct")}
                    >
                      <CheckCircle2 size={18} />
                      맞았어요
                    </button>
                    <button
                      className="wrong"
                      aria-pressed={study.records[current.key] === "wrong"}
                      onClick={() => record("wrong")}
                    >
                      <XCircle size={18} />
                      틀렸어요
                    </button>
                    <button
                      onClick={() => record("correct", true)}
                      disabled={index === visible.length - 1}
                    >
                      <Check size={17} />
                      맞힘 · 다음
                    </button>
                    <button
                      onClick={() => record("wrong", true)}
                      disabled={index === visible.length - 1}
                    >
                      <X size={17} />
                      오답 · 다음
                    </button>
                  </div>
                </section>
              )}
            </article>
          </>
        ) : (
          <div className="emptyState">
            <h2>조건에 맞는 문제가 없습니다</h2>
            <button
              onClick={() =>
                refreshSelection(() => {
                  setFilter("all");
                  setQuery("");
                  setTopic("");
                })
              }
            >
              필터 초기화
            </button>
          </div>
        )}
        <footer className="pager">
          <button
            aria-label="이전 문제"
            onClick={() => jumpTo(visible[index - 1])}
            disabled={index <= 0}
          >
            <ChevronLeft size={19} />
            이전
          </button>
          <span>
            <strong>{index + 1}</strong> / {visible.length}
          </span>
          <button
            aria-label="다음 문제"
            onClick={() => jumpTo(visible[index + 1])}
            disabled={index < 0 || index >= visible.length - 1}
          >
            다음
            <ChevronRight size={19} />
          </button>
        </footer>
      </section>
      <nav
        id="numberPanel"
        className="questionNav"
        hidden={!study.numberPanel}
        aria-label="문제 목록"
      >
        <div className="panelHeading">
          <div>
            <h2>문제 번호</h2>
            <small>{group?.title ?? "전체 문제"}</small>
          </div>
          <button
            aria-label="문제 번호 패널 닫기"
            onClick={() => patch({ numberPanel: false })}
          >
            <X size={18} />
          </button>
        </div>
        <div className="numberGrid">
          {visible.map((q, i) => (
            <button
              key={q.key}
              aria-label={`${i + 1}번째 문제, ${q.examTitle} ${q.number}번`}
              aria-current={q.key === current?.key ? "true" : undefined}
              className={q.key === current?.key ? "active" : ""}
              title={`${q.examTitle} ${q.number}번`}
              onClick={() => jumpTo(q)}
            >
              {study.records[q.key] === "correct" ? (
                <CheckCircle2 className="correctIcon" size={15} />
              ) : study.records[q.key] === "wrong" ? (
                <XCircle className="wrongIcon" size={15} />
              ) : (
                <Circle size={15} />
              )}
              <span>{isCollection ? i + 1 : q.number}</span>
              {study.bookmarks[q.key] && <span className="bookmarkDot" />}
            </button>
          ))}
        </div>
      </nav>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
