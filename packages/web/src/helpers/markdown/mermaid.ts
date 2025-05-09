import {v4 as uuidv4} from "uuid";
import {nextTick} from "vue";
import mermaid from "mermaid";
import markdownActions from "./actions";

mermaid.initialize({ startOnLoad: false });

export function renderMermaid(text, raw) {
  const id = `mermaid-${uuidv4()}`;
  const mermaidDiv = `
    <div class="wrapper wrapper-mermaid" id="${id}">
        <div class="actions">
            <span class="zoom-box">
            Zoom:
            <span class="current-zoom">1</span>
            </span>
            <span class="delimiter">|</span>
            <a class="zoom-in" href="#">
                <span>zoom in</span>
            </a>
            <a class="zoom-out" href="#">
                <span>zoom out</span>
            </a>
            <a class="zoom-reset" href="#">
                <span>reset</span>
            </a>
            <span class="delimiter">|</span>
            <a class="copy" href="#">
                <span>copy</span>
            </a>
        </div>
         <div class="wrap-container">
        <div style="transform-origin: top left;" class="diagram-container mermaid"></div>
        </div>
    </div>
  `;

  nextTick(async () => {
    mermaid.initialize({ startOnLoad: false });

    const element = document.getElementById(id);
    if (!element) return;

    const mermaidElement = element.querySelector('.mermaid') as HTMLElement | null;
    if (!mermaidElement) return;

    const uniqueGraphId = `graph-${uuidv4()}`;

    try {
      const {svg} = await mermaid.render(uniqueGraphId, text);
      mermaidElement.innerHTML = svg;
    } catch (e) {
      const {svg} = await mermaid.render(uniqueGraphId,`
      graph TD
        A["Error: Syntax!"]
      `);
      mermaidElement.innerHTML = svg;
    }

    markdownActions(element, raw);
  });

  return mermaidDiv;
}
