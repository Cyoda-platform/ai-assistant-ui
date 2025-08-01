import {marked} from "marked";
import {renderMermaid} from "./markdown/mermaid";
import {renderPlantUML} from "./markdown/plantuml";
import {renderBash} from "./markdown/bash";
import {renderCodeHighlight} from "./markdown/codeHighlight";

export default class HelperMarkdown {
    static parseMarkdown(text) {

        const renderer = new marked.Renderer();

        renderer.link = function ({href, title, text}) {
            const target = '_blank';
            const rel = 'noopener noreferrer';
            return `<a href="${href}" title="${title || ''}" target="${target}" rel="${rel}">${text}</a>`;
        };

        renderer.code = function ({text, lang, raw}) {
            // Специальные языки с кастомным рендерингом
            if (lang === "mermaid") {
                return renderMermaid(text, raw);
            }

            if (lang === "plantuml") {
                return renderPlantUML(text, raw);
            }

            if (lang === "bash") {
                return renderBash(text, raw);
            }

            // Обычные языки программирования - подсветка применяется только если язык указан и поддерживается
            return renderCodeHighlight(text, lang);
        };

        return marked.parse(text, {renderer, breaks: true});
    }
}
