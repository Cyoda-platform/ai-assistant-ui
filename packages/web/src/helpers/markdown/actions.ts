import HelperCopy from "../HelperCopy";
import _ from "lodash";

export default function markdownActions(element: HTMLElement, raw) {
  const copyButton = element.querySelector('.copy') as HTMLAnchorElement | null;
  const zoomInButton = element.querySelector('.zoom-in') as HTMLAnchorElement | null;
  const zoomOutButton = element.querySelector('.zoom-out') as HTMLAnchorElement | null;
  const zoomResetButton = element.querySelector('.zoom-reset') as HTMLAnchorElement | null;
  const copySpan = copyButton?.querySelector('span') as HTMLSpanElement | null;
  const containerDiv = zoomInButton.closest('.wrapper').querySelector('.diagram-container');
  const currentZoomEl = element.querySelector('.current-zoom');

  if (copyButton && copySpan) {
    copyButton.addEventListener("click", (e) => {
      e.preventDefault();

      HelperCopy.copy(raw).then(() => {
        copySpan.textContent = 'copied!';
        setTimeout(() => {
          copySpan.textContent = 'copy';
        }, 2000);
      })
    });
  }

  if (zoomInButton) {
    zoomInButton.addEventListener("click", (e) => {
      e.preventDefault();
      let currentValue = parseFloat(currentZoomEl.textContent);
      currentValue = +(currentValue + 0.1).toFixed(1);
      containerDiv.style.transform = `scale(${currentValue})`;
      currentZoomEl.textContent = currentValue;
    });
  }

  if (zoomOutButton) {
    zoomOutButton.addEventListener("click", (e) => {
      e.preventDefault();
      let currentValue = parseFloat(currentZoomEl.textContent);
      currentValue = +(currentValue - 0.1).toFixed(1);
      if (currentValue < 0.1) {
        currentValue = 0.1;
      }
      containerDiv.style.transform = `scale(${currentValue})`;
      currentZoomEl.textContent = currentValue;
    });
  }

  if (zoomResetButton) {
    zoomResetButton.addEventListener("click", (e) => {
      e.preventDefault();
      containerDiv.style.transform = `scale(1)`;
      currentZoomEl.textContent = 1;
    });
  }
}
