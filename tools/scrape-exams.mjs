import { mkdir, writeFile } from "node:fs/promises";

const sources = [
  ["2026년 1회", "https://chobopark.tistory.com/561"],
  ["2025년 1회", "https://chobopark.tistory.com/540"],
  ["2025년 2회", "https://chobopark.tistory.com/554"],
  ["2025년 3회", "https://chobopark.tistory.com/558"],
  ["2024년 1회", "https://chobopark.tistory.com/476"],
  ["2024년 2회", "https://chobopark.tistory.com/483"],
  ["2024년 3회", "https://chobopark.tistory.com/495"],
  ["2023년 1회", "https://chobopark.tistory.com/372"],
  ["2023년 2회", "https://chobopark.tistory.com/420"],
  ["2023년 3회", "https://chobopark.tistory.com/453"],
  ["2022년 1회", "https://chobopark.tistory.com/271"],
  ["2022년 2회", "https://chobopark.tistory.com/423"],
  ["2022년 3회", "https://chobopark.tistory.com/424"],
  ["2021년 1회", "https://chobopark.tistory.com/191"],
  ["2021년 2회", "https://chobopark.tistory.com/210"],
  ["2021년 3회", "https://chobopark.tistory.com/217"],
  ["2020년 1회", "https://chobopark.tistory.com/196"],
  ["2020년 2회", "https://chobopark.tistory.com/195"],
  ["2020년 3회", "https://chobopark.tistory.com/194"],
  ["2020년 4회", "https://chobopark.tistory.com/192"],
];

const clean = (html) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<ins[\s\S]*?<\/ins>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/\s+onerror="[^"]*"/gi, "")
    .replace(/\s+onclick="[^"]*"/gi, "")
    .replace(/\s+srcset="[^"]*"/gi, "")
    .replace(/<a class="btn-toggle-moreless"[\s\S]*?<\/a>/gi, "")
    .replace(/<div style="text-align:\s*right;[\s\S]*?Colored by Color Scripter[\s\S]*?<\/div>/gi, "");

const textOnly = (html) =>
  html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/&nbsp;/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();

function extractArticle(html) {
  const mobile = html.match(/<div class="blogview_content[\s\S]*?">([\s\S]*?)<\/article>/s);
  if (mobile) return mobile[1];
  const pc = html.match(/<div class="tt_article_useless_p_margin contents_style">([\s\S]*?)<div data-react-app="EntryContent"/s);
  if (pc) return pc[1];
  return "";
}

function removeNavigationTables(article) {
  let output = article;
  const examHeading = output.search(/\[[0-9]{4}년\s*[0-9]회\][\s\S]*?정보처리기사\s*실기\s*복원\s*문제/);
  if (examHeading > -1) output = output.slice(examHeading);
  const firstQuestion = output.search(/<p[^>]*>\s*(?:<b[^>]*>\s*)+(?:<span[^>]*>\s*)?1\s*[.&]/i);
  const trailingNav = output.indexOf("클릭하면 해당 페이지로 이동됩니다.", Math.max(firstQuestion, 0) + 100);
  if (trailingNav > -1) {
    const tableStart = output.lastIndexOf("<table", trailingNav);
    output = output.slice(0, tableStart > -1 ? tableStart : trailingNav);
  }
  return output;
}

function splitQuestions(article) {
  const candidates = [...article.matchAll(/<p[^>]*>\s*(?:<b[^>]*>\s*)+(?:<span[^>]*>\s*)?([0-9]{1,2})\s*[.&]/gi)]
    .map((match) => ({ index: match.index, number: Number(match[1]) }))
    .filter((item, index, list) => index === 0 || item.index !== list[index - 1].index);

  const starts = [];
  let expectedNumber = 1;
  for (const candidate of candidates) {
    if (candidate.number === expectedNumber) {
      starts.push(candidate);
      expectedNumber += 1;
    }
    if (expectedNumber > 20) break;
  }

  return starts
    .map((start, index) => {
      const end = starts[index + 1]?.index ?? article.length;
      const raw = clean(article.slice(start.index, end));
      const answerMatch = raw.match(/<div[^>]*data-ke-type="moreLess"[\s\S]*?<div class="moreless-content">([\s\S]*?)<\/div>\s*<\/div>/i);
      const answerHtml = answerMatch ? clean(answerMatch[1]) : "";
      const promptHtml = clean(raw.replace(/<div[^>]*data-ke-type="moreLess"[\s\S]*?<div class="moreless-content">[\s\S]*?<\/div>\s*<\/div>/gi, ""));
      return {
        number: start.number,
        promptHtml,
        answerHtml,
        answerText: textOnly(answerHtml),
      };
    })
    .filter((question) => question.promptHtml && question.answerHtml);
}

const exams = [];

for (const [title, sourceUrl] of sources) {
  const response = await fetch(sourceUrl.replace("https://chobopark.tistory.com/", "https://chobopark.tistory.com/m/"));
  if (!response.ok) throw new Error(`${title} fetch failed: ${response.status}`);
  const html = await response.text();
  const article = removeNavigationTables(extractArticle(html));
  const questions = splitQuestions(article);
  exams.push({ id: title.replace(/\s+/g, "-"), title, sourceUrl, questions });
  console.log(`${title}: ${questions.length} questions`);
}

await mkdir("src/data", { recursive: true });
await writeFile(
  "src/data/exams.js",
  `export const exams = ${JSON.stringify(exams, null, 2)};\n`,
);
