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

  // Unified drag functionality for mouse and touch events
  if (wrapContainer && containerDiv) {
    wrapContainer.style.cursor = 'grab';
    wrapContainer.style.overflow = 'hidden';

    const getEventCoordinates = (e: MouseEvent | TouchEvent) => {
      if (e instanceof TouchEvent) {
        return {
          clientX: e.touches[0]?.clientX || 0,
          clientY: e.touches[0]?.clientY || 0
        };
      }
      return { clientX: e.clientX, clientY: e.clientY };
    };

    const handleDragStart = (e: MouseEvent | TouchEvent) => {
      const isValidMouseEvent = e instanceof MouseEvent && e.button === 0;
      const isValidTouchEvent = e instanceof TouchEvent && e.touches.length === 1;
      
      if (isValidMouseEvent || isValidTouchEvent) {
        isDragging = true;
        wrapContainer.style.cursor = 'grabbing';
        const { clientX, clientY } = getEventCoordinates(e);
        dragStartX = clientX - currentTranslateX;
        dragStartY = clientY - currentTranslateY;
        e.preventDefault();
      }
    };

    const handleDragMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      
      const isValidTouchEvent = e instanceof TouchEvent && e.touches.length === 1;
      if (e instanceof TouchEvent && !isValidTouchEvent) return;

      const { clientX, clientY } = getEventCoordinates(e);
      currentTranslateX = clientX - dragStartX;
      currentTranslateY = clientY - dragStartY;
      updateTransform();
      e.preventDefault();
    };

    const handleDragEnd = () => {
      if (isDragging) {
        isDragging = false;
        wrapContainer.style.cursor = 'grab';
      }
    };

    wrapContainer.addEventListener('mousedown', handleDragStart);
    wrapContainer.addEventListener('touchstart', handleDragStart);
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('touchmove', handleDragMove, { passive: false });
    document.addEventListener('mouseup', handleDragEnd);
    document.addEventListener('touchend', handleDragEnd);
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
