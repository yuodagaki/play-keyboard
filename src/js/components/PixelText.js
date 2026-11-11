import { html } from 'https://esm.sh/htm/react';
import { useRef, useLayoutEffect } from 'https://esm.sh/react';

// Draw on a small bitmap first so the same lettering works for live scores too.
export function PixelText({ children, scale = 1, color = '#46363b' }) {
  const ref = useRef(null);
  const text = String(children);
  useLayoutEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext('2d');
    const font = 'bold 16px "Hiragino Sans", "Yu Gothic", sans-serif';
    ctx.font = font;
    canvas.width = Math.ceil(ctx.measureText(text).width) + 2;
    canvas.height = 21;
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.fillText(text, 1, 16);
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
    for (let i = 3; i < pixels.data.length; i += 4) {
      pixels.data[i] = pixels.data[i] >= 96 ? 255 : 0;
    }
    ctx.putImageData(pixels, 0, 0);
    canvas.style.width = canvas.width * scale + 'px';
    canvas.style.height = canvas.height * scale + 'px';
  }, [text, scale, color]);
  return html`<canvas ref=${ref} role="img" aria-label=${text}>${text}</canvas>`;
}
