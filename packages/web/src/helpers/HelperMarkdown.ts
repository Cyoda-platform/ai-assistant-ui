import {marked} from "marked";

export default class HelperMarkdown {
  static parseMarkdown(text) {
    const renderer = new marked.Renderer();

    renderer.link = function ({href, title, text}) {
      const target = '_blank';
      const rel = 'noopener noreferrer';
      return `<a href="${href}" title="${title || ''}" target="${target}" rel="${rel}">${text}</a>`;
    };

    return marked.parse(text, { renderer });
  }
}
