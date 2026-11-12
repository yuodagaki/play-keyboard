import { html } from 'https://esm.sh/htm/react';
import { useEffect, useRef, useState } from 'https://esm.sh/react';
import { RomajiGuide } from '../components/RomajiGuide.js';
import { KeyboardGuide } from '../components/KeyboardGuide.js';
import { PixelText } from '../components/PixelText.js';
import { createRomajiQuestion, romajiGuide } from '../utils/romaji.js';
import { playSound } from '../utils/sound.js';

// Keep this course fixed so saved times remain comparable.
const questions = ['ちず', 'さんぽ', 'ほんや', 'みんな', 'いっしょにいこう'].map(createRomajiQuestion);
const seconds = ms => (ms / 1000).toFixed(2) + 'びょう';

export function FiveWordScreen({ record, onFinish, onBack }) {
  const run = useRef(null);
  const [view, setView] = useState(null);
  const [result, setResult] = useState(null);

  function begin() {
    const initial = { index: 0, typed: '', start: null, miss: false, misses: 0 };
    run.current = initial;
    setView(initial);
    setResult(null);
  }

  useEffect(() => {
    function handleKey(event) {
      if (event.key === 'Escape') { onBack(); return; }
      const current = run.current;
      if (!current || event.repeat || event.ctrlKey || event.metaKey || event.altKey || !/^[a-z]$/i.test(event.key)) return;
      const now = performance.now();
      const start = current.start ?? now;
      const typed = current.typed + event.key.toLowerCase();
      const guide = romajiGuide(questions[current.index].tokens, typed);
      let next;
      if (guide === null) {
        playSound('miss');
        next = { ...current, start, miss: true, misses: current.misses + 1 };
      } else if (typed === guide && current.index === questions.length - 1) {
        run.current = null;
        const elapsed = Math.round(now - start);
        setResult({ elapsed, perfect: current.misses === 0, previous: record?.lastMs, best: Math.min(record?.bestMs ?? elapsed, elapsed) });
        onFinish(elapsed);
        playSound('stageClear');
        return;
      } else {
        playSound('correct');
        const complete = typed === guide;
        next = { ...current, index: current.index + Number(complete), typed: complete ? '' : typed, start, miss: false };
      }
      run.current = next;
      setView(next);
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [record, onFinish, onBack]);

  const question = view && questions[view.index];
  const guide = question && romajiGuide(question.tokens, view.typed);
  return html`<div class="screen five-word-screen">
    <div class="header"><button class="pixel-button" onClick=${onBack}>もどる <span class="kbd">Esc</span></button></div>
    <div class="five-word-panel">
      <h1><${PixelText} scale=${2}>おなじ5もんチャレンジ<//></h1>
      ${result ? html`
        ${result.perfect && html`<p><${PixelText} color="#875324">5もんぜんぶ ミスなし！<//></p>`}
        <p>今回　${seconds(result.elapsed)}</p>
        <p>${result.previous == null ? 'はじめてのきろく！' : 'まえのきろく　' + seconds(result.previous)}</p>
        <p>じこベスト　${seconds(result.best)}</p>
        <button class="pixel-button" onClick=${begin}>もういちど</button>
      ` : view ? html`
        <p>${view.index + 1} / 5</p>
        <div class="battle-question__hira">${question.text}</div>
        <${RomajiGuide} guide=${guide} typed=${view.typed} />
      ` : html`
        <p>いつも おなじ5もん。さいしょのキーを うつと スタート！</p>
        ${record && html`<p>じこベスト　${seconds(record.bestMs)}</p>`}
        <button class="pixel-button" onClick=${begin}>ちょうせんする</button>
      `}
    </div>
    ${view && !result && html`<${KeyboardGuide} nextChar=${guide[view.typed.length]} flashError=${view.miss} />`}
  </div>`;
}
