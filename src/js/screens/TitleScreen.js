import { PixelText } from '../components/PixelText.js';
import { ResultButton } from '../components/ResultButton.js';
import { html } from 'https://esm.sh/htm/react';
import { useState, useEffect } from 'https://esm.sh/react';
import { LittleKnight } from '../components/LittleKnight.js';
import { loadAllSlots, createSlot, deleteSlot } from '../utils/save.js';
import { startBgm, stopBgm, playSound } from '../utils/sound.js';

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getMonth()+1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`;
}

function SlotCard({ slot, index, onSelect, onDelete }) {
  return html`
    <div class="save-slot-card">
      <button class="save-slot-card__select" onClick=${onSelect}>
        <${PixelText} color="#795433">${'ファイル ' + (index + 1)}<//>
        ${slot ? html`
          <${LittleKnight} weapon=${slot.weapon} armor=${slot.armor} />
          <${PixelText} scale=${2}>${'ステージ ' + slot.maxUnlocked}<//>
          <span><img class="pixel-icon" src="art/shop/coin.png" alt="" /> <${PixelText}>${slot.coins + ' コイン'}<//></span>
          <${PixelText}>さいごにあそんだ日<//>
          <${PixelText}>${formatDate(slot.lastPlayedAt)}<//>
        ` : html`
          <img class="save-slot-star" src="art/shop/star.png" alt="" />
          <${PixelText}>あたらしくはじめる<//>
        `}
      </button>
      ${slot && html`<button class="stage-action save-delete" aria-label=${'ファイル ' + (index + 1) + ' をけす'} onClick=${onDelete}><${PixelText} color="#852f29">けす<//></button>`}
    </div>
  `;
}

export function TitleScreen({ onSelectSlot }) {
  const [showSlots, setShowSlots] = useState(false);
  const [slots, setSlots] = useState(() => loadAllSlots());
  const [confirmDelete, setConfirmDelete] = useState(null);

  const refreshSlots = () => setSlots(loadAllSlots());

  useEffect(() => {
    startBgm('title');
    return () => stopBgm();
  }, []);

  const handleSelect = (slot, idx) => {
    playSound('uiClick');
    if (slot) {
      onSelectSlot(slot);
    } else {
      const name = `ファイル ${idx + 1}`;
      const newSlot = createSlot(name);
      if (newSlot) onSelectSlot(newSlot);
    }
  };

  const handleDelete = (id) => {
    deleteSlot(id);
    refreshSlots();
    setConfirmDelete(null);
  };

  const displaySlots = [slots[0] ?? null, slots[1] ?? null, slots[2] ?? null];

  useEffect(() => {
    const handler = (e) => {
      const key = e.key;
      if (confirmDelete) {
        if (key === 'Escape') { setConfirmDelete(null); return; }
        if (key === 'd' || key === 'D') { handleDelete(confirmDelete); return; }
        return;
      }
      if (showSlots) {
        if (key === 'Escape') { setShowSlots(false); return; }
        if (key === '1') { handleSelect(displaySlots[0], 0); return; }
        if (key === '2') { handleSelect(displaySlots[1], 1); return; }
        if (key === '3') { handleSelect(displaySlots[2], 2); return; }
        return;
      }
      if (key === 'Enter') { setShowSlots(true); return; }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showSlots, confirmDelete, slots]);

  return html`
    <div class="screen title-screen">
      <div class="title-logo">
        <h1 class="title-logo__text"><img src="art/title/logo.png" alt="リトルナイトのキーボードぼうけん" /></h1>
        <div class="title-logo__sub">タイピングでモンスターをたおそう！</div>
      </div>

      <div class="title-hero">
        <${LittleKnight} weapon="wooden" armor="hat" />
      </div>

      <div class="title-buttons">
        <button class="pixel-button" onClick=${() => setShowSlots(true)}>
          <img src="art/shop/star.png" alt="" /> はじめる <span class="kbd">Enter</span>
        </button>
      </div>

      <p class="title-save-note">
        <${PixelText} color="#fff6da">このゲームのセーブデータはぜんぶみんなのところにほぞんされるよ<//>
        <small><${PixelText} color="#c6d0bd">保護者の方へ　ブラウザに自動で保存されます<//></small>
      </p>

      <!-- セーブスロット選択 -->
      ${showSlots && html`
        <div class="save-slots" inert=${confirmDelete ? true : undefined}>
          <div class="save-slots__title"><${PixelText} scale=${2} color="#fff1cd">ファイルをえらんでね<//></div>
          <div class="save-slots__list">
            ${displaySlots.map((slot, idx) => html`
              <${SlotCard}
                key=${idx}
                slot=${slot}
                index=${idx}
                onSelect=${() => handleSelect(slot, idx)}
                onDelete=${() => setConfirmDelete(slot?.id)}
              />
            `)}
          </div>
          <${ResultButton} label="もどる" shortcut="Esc" icon="back" onClick=${() => setShowSlots(false)} />
        </div>
      `}

      <!-- 削除確認ダイアログ -->
      ${confirmDelete && html`
        <div class="confirm-overlay">
          <div class="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-title">
            <div id="delete-title" class="confirm-dialog__title"><${PixelText} scale=${2}>${'ファイル ' + (slots.findIndex(slot => slot.id === confirmDelete) + 1) + ' をけす？'}<//></div>
            <div class="confirm-dialog__sub"><${PixelText}>このデータはもとにもどせません<//></div>
            <div class="confirm-dialog__btns">
              <button class="stage-action" autoFocus onClick=${() => setConfirmDelete(null)}><${PixelText}>やめる<//> <kbd><${PixelText}>Esc<//></kbd></button>
              <button class="stage-action save-delete" onClick=${() => handleDelete(confirmDelete)}><${PixelText} color="#852f29">けす<//> <kbd><${PixelText}>D<//></kbd></button>
            </div>
          </div>
        </div>
      `}
    </div>
  `;
}
