import { v4 as uuidv4 } from "uuid";
import { nextTick } from "vue";
import mermaid from "mermaid";
import markdownActions from "./actions";

export function renderMermaid(text, raw) {
  const id = `mermaid-${uuidv4()}`;
  const mermaidDiv = `
    <div class="wrapper-mermaid" id="${id}">
        <div class="actions">
            <a class="copy" href="#">
                <span>copy</span>
            </a>
        </div>
        <div class="mermaid">${text}</div>
    </div>
  `;

  nextTick(() => {
    const element = document.getElementById(id);
    if (!element) return;

    const mermaidElement = element.querySelector('.mermaid') as HTMLElement | null;

    if (mermaidElement) {
      mermaid.run({ nodes: [mermaidElement] });
    }

    markdownActions(element, raw);
  });

  return mermaidDiv;
}
