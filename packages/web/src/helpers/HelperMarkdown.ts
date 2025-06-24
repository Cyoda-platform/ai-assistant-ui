import {marked} from "marked";
import {renderMermaid} from "./markdown/mermaid";
import {renderPlantUML} from "./markdown/plantuml";
import {renderBash} from "./markdown/bash";
import markdownActions from "./markdown/actions";
import {v4 as uuidv4} from "uuid";
import {nextTick} from "vue";

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

        const uuidRegex = /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi;

        renderer.text = ({text}) => {
            const id = `text-${uuidv4()}`;
            const replaced = text.replace(uuidRegex, (uuid) => {
                return `<span class="uuid-block" id="${id}">
                   <span class="uuid-value">${uuid}</span>
                        <a class="copy" href="#"><span>copy</span></a>
                   </span>`;
            });

            nextTick(async () => {
                const element = document.getElementById(id);
                if (!element) return;
                markdownActions(element, element.querySelector('.uuid-value').textContent.trim());
            });
            return replaced;
        };

        return marked.parse(text, {renderer, breaks: true});
    }
}
