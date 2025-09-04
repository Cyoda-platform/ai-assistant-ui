import HelperCopy from "../HelperCopy";

export default function markdownActions(element: HTMLElement, raw) {
  const copyButton = element.querySelector('.copy') as HTMLAnchorElement | null;
  const zoomInButton = element.querySelector('.zoom-in') as HTMLAnchorElement | null;
  const zoomOutButton = element.querySelector('.zoom-out') as HTMLAnchorElement | null;
  const zoomResetButton = element.querySelector('.zoom-reset') as HTMLAnchorElement | null;
  const copySpan = copyButton?.querySelector('span') as HTMLSpanElement | null;
  const containerDiv = zoomInButton?.closest('.wrapper')?.querySelector('.diagram-container') as HTMLElement;
  const wrapContainer = element.querySelector('.wrap-container') as HTMLElement;
  const currentZoomEl = element.querySelector('.current-zoom');

  // Drag functionality
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let currentTranslateX = 0;
  let currentTranslateY = 0;

  // Update transform with both scale and translate
  function updateTransform() {
    const currentScale = parseFloat(currentZoomEl?.textContent || '1');
    containerDiv.style.transform = `scale(${currentScale}) translate(${currentTranslateX}px, ${currentTranslateY}px)`;
  }

  // Mouse events for dragging
  if (wrapContainer && containerDiv) {
    wrapContainer.style.cursor = 'grab';
    wrapContainer.style.overflow = 'hidden';

    wrapContainer.addEventListener('mousedown', (e) => {
      if (e.button === 0) { // Left mouse button
        isDragging = true;
        wrapContainer.style.cursor = 'grabbing';
        dragStartX = e.clientX - currentTranslateX;
        dragStartY = e.clientY - currentTranslateY;
        e.preventDefault();
      }
    });

    document.addEventListener('mousemove', (e) => {
      if (isDragging) {
        currentTranslateX = e.clientX - dragStartX;
        currentTranslateY = e.clientY - dragStartY;
        updateTransform();
      }
    });

    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        wrapContainer.style.cursor = 'grab';
      }
    });
  }

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
      if (!currentZoomEl) return;
      
      let currentValue = parseFloat(currentZoomEl.textContent || '1');
      currentValue = +(currentValue + 0.1).toFixed(1);
      currentZoomEl.textContent = currentValue.toString();
      updateTransform();
    });
  }

  if (zoomOutButton) {
    zoomOutButton.addEventListener("click", (e) => {
      e.preventDefault();
      if (!currentZoomEl) return;
      
      let currentValue = parseFloat(currentZoomEl.textContent || '1');
      currentValue = +(currentValue - 0.1).toFixed(1);
      if (currentValue < 0.1) {
        currentValue = 0.1;
      }
      currentZoomEl.textContent = currentValue.toString();
      updateTransform();
    });
  }

  if (zoomResetButton) {
    zoomResetButton.addEventListener("click", (e) => {
      e.preventDefault();
      if (!currentZoomEl) return;
      
      currentTranslateX = 0;
      currentTranslateY = 0;
      currentZoomEl.textContent = '1';
      updateTransform();
    });
  }
}
