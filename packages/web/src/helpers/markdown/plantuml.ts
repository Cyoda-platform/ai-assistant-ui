import pako from "pako";
import {v4 as uuidv4} from "uuid";
import {nextTick} from "vue";
import markdownActions from "./actions";

const krokiBaseUrl = "https://docs.cyoda.org/kroki/";

const encodePlantUML = (text) => {
  const deflated = pako.deflate(text, {level: 9});
  const base64 = btoa(String.fromCharCode.apply(null, deflated));
  return base64.replace(/\+/g, "-").replace(/\//g, "_");
};

export function renderPlantUML(text, raw) {
  const id = `plantuml-${uuidv4()}`;
  const encodedDiagram = encodePlantUML(text);
  const diagramUrl = `${krokiBaseUrl}/plantuml/svg/${encodedDiagram}`;

  const plantUmlDiv = `
  <div class="wrapper wrapper-plantuml" id="${id}">
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
            <img style="transform-origin: top left;" class="diagram-container" src="${diagramUrl}" alt="PlantUML Diagram">
         </div>
    </div>
    `;
  nextTick(() => {
    const element = document.getElementById(id);
    if (!element) return;

    markdownActions(element, raw);
  });

  return plantUmlDiv;
}
