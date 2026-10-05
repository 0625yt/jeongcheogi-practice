import hljs from "highlight.js/lib/core";
import c from "highlight.js/lib/languages/c";
import java from "highlight.js/lib/languages/java";
import python from "highlight.js/lib/languages/python";
import sql from "highlight.js/lib/languages/sql";
for (const [name, syntax] of Object.entries({ c, java, python, sql }))
  hljs.registerLanguage(name, syntax);

export function highlightCode(code, language) {
  if (language && hljs.getLanguage(language))
    return hljs.highlight(code, { language, ignoreIllegals: true }).value;
  return code
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
