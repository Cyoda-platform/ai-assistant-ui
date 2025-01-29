import {marked} from "marked";
import {renderMermaid} from "./markdown/mermaid";
import {renderPlantUML} from "./markdown/plantuml";

export default class HelperMarkdown {
  static parseMarkdown(text) {
    text=`
 \`\`\`plantuml
       @startuml
       Alice -> Bob: Привет!
       Bob -> Alice: Привет, как дела?
       @enduml
\`\`\`
`;
    const renderer = new marked.Renderer();

    renderer.link = function ({href, title, text}) {
      const target = '_blank';
      const rel = 'noopener noreferrer';
      return `<a href="${href}" title="${title || ''}" target="${target}" rel="${rel}">${text}</a>`;
    };

    renderer.code = function ({text, lang, raw}) {
      if (lang === "mermaid") {
       return renderMermaid(text, raw);
      }

      if (lang === "plantuml") {
        return renderPlantUML(text, raw);
      }

      return `<pre><code>${text}</code></pre>`;
    };

    return marked.parse(text, {renderer});
  }
}
