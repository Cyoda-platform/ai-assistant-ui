import {marked} from "marked";
import {renderMermaid} from "./markdown/mermaid";
import {renderPlantUML} from "./markdown/plantuml";
import {renderBash} from "./markdown/bash";
import {renderCodeHighlight} from "./markdown/codeHighlight";

export default class HelperMarkdown {
    static parseMarkdown(text) {

        const renderer = new marked.Renderer();
        const defaultTable = renderer.table.bind(renderer);

        renderer.link = function ({href, title, text}) {
            const target = '_blank';
            const rel = 'noopener noreferrer';
            return `<a href="${href}" title="${title || ''}" target="${target}" rel="${rel}">${text}</a>`;
        };

        renderer.table = (tokens) => {
            return `<div class="markdown-table-wrap">${defaultTable(tokens)}</div>`;
        };

        renderer.code = function ({text, lang, raw}) {
            if (lang === "mermaid") {
                return renderMermaid(text, raw);
            }

            if (lang === "plantuml") {
                return renderPlantUML(text, raw);
            }

            if (lang && ['bash', 'shell', 'markdown'].includes(lang)) {
                return renderBash(text, raw);
            }

            return renderCodeHighlight(text, lang);
        };

        return marked.parse(text, {
            renderer,
            breaks: true,
            gfm: true
        });
    }
}
