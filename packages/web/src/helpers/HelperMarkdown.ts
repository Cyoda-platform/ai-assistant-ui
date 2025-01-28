import {marked} from "marked";
import mermaid from "mermaid";
import {v4 as uuidv4} from "uuid";
import {nextTick} from "vue";
import pako from "pako";

const krokiBaseUrl = "https://docs.cyoda.org/kroki/";

const encodePlantUML = (text) => {
  const deflated = pako.deflate(text, { level: 9 });
  const base64 = btoa(String.fromCharCode.apply(null, deflated));
  return base64.replace(/\+/g, "-").replace(/\//g, "_"); // URL-безопасный формат
};

export default class HelperMarkdown {
  static parseMarkdown(text) {
    const renderer = new marked.Renderer();

    renderer.link = function ({href, title, text}) {
      const target = '_blank';
      const rel = 'noopener noreferrer';
      return `<a href="${href}" title="${title || ''}" target="${target}" rel="${rel}">${text}</a>`;
    };

    renderer.code = function ({text, lang}) {
      if (lang === "mermaid") {
        const id = `mermaid-${uuidv4()}`;

        const mermaidDiv = `<div class="mermaid" id="${id}">${text}</div>`;

        nextTick(() => {
          const element = document.getElementById(id);
          if (element) {
            mermaid.run({nodes: [element]});
          }
        })

        return mermaidDiv;
      }

      if (lang === "plantuml") {
        const encodedDiagram = encodePlantUML(text);
        const diagramUrl = `${krokiBaseUrl}/plantuml/svg/${encodedDiagram}`;

        return `<img src="${diagramUrl}" alt="PlantUML Diagram">`;
      }

      return `<pre><code>${text}</code></pre>`;
    };

    return marked.parse(text, {renderer});
  }
}
