import {v4 as uuidv4} from "uuid";
import {nextTick, watch} from "vue";
import mermaid from "mermaid";
import markdownActions from "./actions";
import {usePreferredDark} from "@vueuse/core";
import {useDetectTheme} from "../HelperTheme";

mermaid.initialize({startOnLoad: false});

export function renderMermaid(text, raw) {
    const id = `mermaid-${uuidv4()}`;
    const mermaidDiv = `
    <div class="wrapper wrapper-mermaid" id="${id}">
        <div class="actions diagram-actions">
            <span class="diagram-actions__zoom">
            Zoom:
            <span class="current-zoom">1</span>
            </span>
            <div class="diagram-actions__controls">
                <div class="diagram-actions__row diagram-actions__row--primary">
                    <a class="zoom-in" href="#">
                        <span>zoom in</span>
                    </a>
                    <a class="zoom-out" href="#">
                        <span>zoom out</span>
                    </a>
                </div>
                <div class="diagram-actions__row diagram-actions__row--secondary">
                    <a class="zoom-reset" href="#">
                        <span>reset</span>
                    </a>
                    <a class="copy" href="#">
                        <span>copy</span>
                    </a>
                </div>
            </div>
        </div>
         <div class="wrap-container">
        <div style="transform-origin: top left;" class="diagram-container mermaid"></div>
        </div>
    </div>
  `;

    // nextTick(async () => {
    //     const detectTheme = useDetectTheme();
    //     mermaid.initialize({
    //         startOnLoad: false,
    //         theme: detectTheme.value === 'dark' ? 'dark' : undefined,
    //     });
    //
    //     const element = document.getElementById(id);
    //     if (!element) return;
    //
    //     const mermaidElement = element.querySelector('.mermaid') as HTMLElement | null;
    //     if (!mermaidElement) return;
    //
    //     const uniqueGraphId = `graph-${uuidv4()}`;
    //
    //     try {
    //         const {svg} = await mermaid.render(uniqueGraphId, text);
    //         mermaidElement.innerHTML = svg;
    //     } catch (e) {
    //         const {svg} = await mermaid.render(uniqueGraphId, `
    //   graph TD
    //     A["Error: Syntax!"]
    //   `);
    //         mermaidElement.innerHTML = svg;
    //     }
    //
    //     markdownActions(element, raw);
    // });

    // return mermaidDiv;


    nextTick(async () => {
        const detectTheme = useDetectTheme();

        async function render() {
            mermaid.initialize({
                startOnLoad: false,
                theme: detectTheme.value === "dark" ? "dark" : undefined,
            });

            const element = document.getElementById(id);
            if (!element) return;

            const mermaidElement = element.querySelector(".mermaid");
            if (!mermaidElement) return;

            const uniqueGraphId = `graph-${uuidv4()}`;

            try {
                const { svg } = await mermaid.render(uniqueGraphId, text);
                mermaidElement.innerHTML = svg;
            } catch {
                const { svg } = await mermaid.render(uniqueGraphId, `
          graph TD
            A["Error: Syntax!"]
        `);
                mermaidElement.innerHTML = svg;
            }

            markdownActions(element, raw);
        }

        await render();

        watch(detectTheme, async () => {
            await render();
        });
    });

    return mermaidDiv;
}
