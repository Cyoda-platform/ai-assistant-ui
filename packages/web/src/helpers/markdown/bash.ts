import {v4 as uuidv4} from "uuid";
import markdownActions from "./actions";

export function renderBash(text, raw) {
  const id = `bash-${uuidv4()}`;
  const mermaidDiv = `
    <div class="wrapper wrapper-bash" id="${id}">
        <div class="actions">
            <a class="copy" href="#">
                <span>copy</span>
            </a>
        </div>
        <pre><code>${text}</code></pre>
    </div>
  `;

  // Use setTimeout to defer execution similar to nextTick
  setTimeout(async () => {
    const element = document.getElementById(id);
    if (!element) return;
    markdownActions(element, text);
  });

  return mermaidDiv;
}
