import { parseHTML } from "linkedom";
import { mkdirSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { exams } from "../src/data/exams.js";

const imageKey = (url) => {
  const u = new URL(url);
  return u.origin + u.pathname;
};
const manifest = {};
const failed = [];
mkdirSync("public/question-assets", { recursive: true });
for (const exam of exams) {
  const oldDocument = parseHTML(
    exam.questions.map((q) => q.promptHtml + q.answerHtml).join("\n"),
  ).document;
  const urls = [
    ...new Set(
      [...oldDocument.querySelectorAll("img[src]")].map((img) =>
        img.getAttribute("src"),
      ),
    ),
  ];
  if (!urls.length) continue;
  const page = await fetch(exam.sourceUrl);
  if (!page.ok) throw new Error(`${exam.sourceUrl}: ${page.status}`);
  const fresh = parseHTML(await page.text()).document;
  const freshUrls = [...fresh.querySelectorAll("img[src]")]
    .map((img) => img.getAttribute("src"))
    .filter((url) => /^https?:/.test(url));
  const replacements = new Map(freshUrls.map((url) => [imageKey(url), url]));
  for (const old of urls) {
    if (!/^https?:/.test(old)) continue;
    const key = imageKey(old);
    if (manifest[key]) continue;
    const url = replacements.get(key) ?? old;
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
      const mime = response.headers.get("content-type")?.split(";")[0];
      if (!response.ok || !mime?.startsWith("image/"))
        throw new Error(`${response.status} ${mime}`);
      const ext = {
        "image/png": "png",
        "image/jpeg": "jpg",
        "image/gif": "gif",
        "image/webp": "webp",
      }[mime];
      if (!ext) throw new Error(`Unsupported image ${mime}`);
      const file =
        createHash("sha256").update(key).digest("hex").slice(0, 16) + "." + ext;
      writeFileSync(
        `public/question-assets/${file}`,
        Buffer.from(await response.arrayBuffer()),
      );
      manifest[key] = file;
    } catch (error) {
      failed.push({ exam: exam.id, key, error: error.message });
    }
  }
  console.log(
    exam.id,
    urls.length,
    "images; cached",
    Object.keys(manifest).length,
  );
}
writeFileSync(
  "src/data/imageManifest.json",
  JSON.stringify(manifest, null, 2) + "\n",
);
console.log(JSON.stringify({ cached: Object.keys(manifest).length, failed }));
if (failed.length) process.exitCode = 1;
