import {v4 as uuidv4} from "uuid";
import {nextTick} from "vue";
import mermaid from "mermaid";
import markdownActions from "./actions";

mermaid.initialize({ startOnLoad: false });

export function renderMermaid(text, raw) {
  const id = `mermaid-${uuidv4()}`;
  const mermaidDiv = `
    <div class="wrapper-mermaid" id="${id}">
        <div class="actions">
            <a class="copy" href="#">
                <span>copy</span>
            </a>
        </div>
        <div class="mermaid"></div>
    </div>
  `;

  nextTick(async () => {
    mermaid.initialize({ startOnLoad: false });

    const element = document.getElementById(id);
    if (!element) return;

    const mermaidElement = element.querySelector('.mermaid') as HTMLElement | null;
    if (!mermaidElement) return;

    const uniqueGraphId = `graph-${uuidv4()}`;

    const { svg } = await mermaid.render(uniqueGraphId, text);
    mermaidElement.innerHTML = svg;

    markdownActions(element, raw);
  });

  return mermaidDiv;
}
