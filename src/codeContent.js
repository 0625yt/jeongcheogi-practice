import imageManifest from "./data/imageManifest.json" with { type: "json" };

export function plainText(html = "") {
  const element = document.createElement("div");
  element.innerHTML = html;
  return element.textContent ?? "";
}

export function codeBlockLines(block) {
  const pre = block.matches("pre")
    ? block
    : block.querySelector("pre code, pre");
  if (pre)
    return pre.textContent
      .replace(/\u00a0/g, " ")
      .replace(/^\n|\n$/g, "")
      .split("\n");
  const cells = [...block.querySelectorAll("td")];
  const cell = cells.find(
    (item) =>
      !/^\s*\d+(\s+\d+)*\s*$/.test(item.textContent) &&
      !/^\s*cs\s*$/.test(item.textContent),
  );
  const source = cell?.querySelector(":scope > div") ?? cell ?? block;
  return [...source.children].map((line) =>
    line.textContent.replace(/\u00a0/g, " "),
  );
}

function findCodeBlocks(element) {
  const blocks = [...element.querySelectorAll(".colorscripter-code")];
  element.querySelectorAll('a[href*="colorscripter.com"]').forEach((link) => {
    const table = link.closest("table");
    if (table && !blocks.some((block) => block.contains(table)))
      blocks.push(table);
  });
  element.querySelectorAll("pre").forEach((pre) => {
    if (
      !blocks.some((block) => block.contains(pre)) &&
      !pre.closest(".custom-input")
    )
      blocks.push(pre);
  });
  return blocks;
}

export function extractCodeLines(html) {
  const element = document.createElement("div");
  element.innerHTML = html;
  return findCodeBlocks(element).flatMap(codeBlockLines);
}

export function prepareQuestionHtml(html) {
  const element = document.createElement("div");
  element.innerHTML = html;
  findCodeBlocks(element).forEach((block) => {
    const lines = codeBlockLines(block);
    const code = document.createElement("div");
    code.className = "sourceCode";
    code.setAttribute("role", "region");
    code.setAttribute("aria-label", "문제 코드");
    code.setAttribute("tabindex", "0");
    lines.forEach((text, index) => {
      const row = document.createElement("div");
      row.className = "sourceLine";
      const number = document.createElement("span");
      number.className = "lineNumber";
      number.setAttribute("aria-hidden", "true");
      number.textContent = index + 1;
      const content = document.createElement("code");
      content.textContent = text || " ";
      row.append(number, content);
      code.append(row);
    });
    block.replaceWith(code);
  });
  element.querySelectorAll("p").forEach((p) => {
    if (!p.textContent.trim() && !p.querySelector("img, table, figure"))
      p.remove();
  });
  element.querySelectorAll("img[src]").forEach((img) => {
    try {
      const url = new URL(img.getAttribute("src"));
      const file = imageManifest[url.origin + url.pathname];
      if (file) {
        img.setAttribute(
          "src",
          `${import.meta.env?.BASE_URL ?? "/jeongcheogi-practice/"}question-assets/${file}`,
        );
        img.removeAttribute("srcset");
      }
      if (!img.getAttribute("alt"))
        img.setAttribute("alt", "문제에 제시된 도표");
    } catch {
      /* Keep non-HTTP image references unchanged. */
    }
  });
  return element.innerHTML;
}

export function detectCodeLanguage(text) {
  if (/System\.out|public class/.test(text)) return "java";
  if (/(C언어|C코드|C 언어|다음은 C\b|#include|printf\s*\()/i.test(text))
    return "c";
  if (/(Java|자바|System\.out|public class)/i.test(text)) return "java";
  if (/(Python|Pyhon|파이썬|def \w+\(|print\s*\()/i.test(text)) return "python";
  return null;
}
