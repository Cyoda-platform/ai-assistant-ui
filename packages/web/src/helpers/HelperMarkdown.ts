import {marked} from "marked";
import {renderMermaid} from "./markdown/mermaid";
import {renderPlantUML} from "./markdown/plantuml";
import {renderBash} from "./markdown/bash";

export default class HelperMarkdown {
  static parseMarkdown(text) {

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

      if (lang === "bash") {
        return renderBash(text, raw);
      }

      return `<pre><code>${text}</code></pre>`;
    };

    return marked.parse(text, {renderer, breaks: true});
  }
}
