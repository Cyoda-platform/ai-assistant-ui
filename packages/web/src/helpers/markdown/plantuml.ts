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
    <div class="wrapper-plantuml" id="${id}">
    <div class="actions">
            <a class="copy" href="#">
                <span>copy</span>
            </a>
        </div>
    <img src="${diagramUrl}" alt="PlantUML Diagram">
    </div>
    `;
  nextTick(() => {
    const element = document.getElementById(id);
    if (!element) return;

    markdownActions(element, raw);
  });

  return plantUmlDiv;
}
