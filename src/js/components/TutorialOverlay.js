import { html } from 'https://esm.sh/htm/react';
import { useEffect } from 'https://esm.sh/react';

const STEPS = {
  1: {
    text: 'ここをおすとバトルができるよ！まずはS1からはじめよう！',
    targetSelector: '.stage-node',
    bubbleStyle: { top: '42%', left: '40px' },
    arrow: 'top',
    btn: 'つぎへ →',
  },
  2: {
    text: 'バトルにかつとコインがもらえるよ！コインをためてショップでぶきをつよくしよう！',
    targetSelector: '.header',
    bubbleStyle: { top: '76px', right: '20px' },
    arrow: 'top',
    btn: 'つぎへ →',
  },
  3: {
    text: 'この色の指でキーをおしてね！キーボードの同じ色のキーをさがそう！',
    targetSelector: '.hands-area',
    bubbleStyle: { bottom: '256px', left: '50%', transform: 'translateX(-50%)' },
    arrow: 'bottom',
    btn: 'つぎへ →',
  },
  4: {
    text: 'ここがホームポジション！人差し指を F と J の上においてね！',
    targetSelector: '.hands-area',
    bubbleStyle: { bottom: '256px', left: '50%', transform: 'translateX(-50%)' },
    arrow: 'bottom',
    btn: 'はじめる！',
  },
};

export function TutorialOverlay({ step, onNext }) {
  const info = STEPS[step];

  useEffect(() => {
    if (!info) return;
    const el = document.querySelector(info.targetSelector);
    if (!el) return;
    el.classList.add('tutorial-highlight');
    return () => el.classList.remove('tutorial-highlight');
  }, [step]);

  useEffect(() => {
    if (!info) return;
    const handler = (e) => {
      if (e.key === 'Enter') {
        e.stopPropagation();
        onNext();
      }
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [onNext, step]);

  if (!info) return null;

  return html`
    <div class="tutorial-overlay">
      <div class=${'tutorial-bubble tutorial-bubble--' + info.arrow} style=${info.bubbleStyle}>
        <p class="tutorial-bubble__text">${info.text}</p>
        <button class="btn-primary tutorial-bubble__btn" onClick=${onNext}>
          ${info.btn} <span class="kbd">Enter</span>
        </button>
      </div>
    </div>
  `;
}
