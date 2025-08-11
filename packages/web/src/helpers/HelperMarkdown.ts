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

        renderer.table = function (token) {
            const header = token.header;
            const body = token.rows;
            
            let headerHTML = '';
            if (header && header.length > 0) {
                const headerCells = header.map(cell => `<th>${cell.text}</th>`).join('');
                headerHTML = `<thead><tr>${headerCells}</tr></thead>`;
            }
            
            let bodyHTML = '';
            if (body && body.length > 0) {
                const bodyRows = body.map(row => {
                    const rowCells = row.map(cell => `<td>${cell.text}</td>`).join('');
                    return `<tr>${rowCells}</tr>`;
                }).join('');
                bodyHTML = `<tbody>${bodyRows}</tbody>`;
            }
            
            return `<div class="table-wrap"><table class="markdown-table">${headerHTML}${bodyHTML}</table></div>`;
        };

        renderer.tablerow = function (token) {
            return `<tr>${token.text}</tr>`;
        };

        renderer.tablecell = function (token) {
            const tag = token.header ? 'th' : 'td';
            const align = token.align ? ` style="text-align: ${token.align}"` : '';
            return `<${tag}${align}>${token.text}</${tag}>`;
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

        return marked.parse(text, {
            renderer, 
            breaks: true,
            gfm: true
        });
    }
}
