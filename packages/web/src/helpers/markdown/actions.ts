export default function markdownActions(element: HTMLElement, raw) {
  const copyButton = element.querySelector('.copy') as HTMLAnchorElement | null;
  const copySpan = copyButton?.querySelector('span') as HTMLSpanElement | null;

  if (copyButton && copySpan) {
    copyButton.addEventListener("click", (e) => {
      e.preventDefault();

      if (navigator.clipboard) {
        navigator.clipboard.writeText(raw)
          .then(() => {
            copySpan.textContent = 'copied!';
            setTimeout(() => {
              copySpan.textContent = 'copy';
            }, 2000);
          })
      }
    });
  }
}
