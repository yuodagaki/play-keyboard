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
  if (!slot) {
    return html`
      <div class="save-slot-card save-slot-card--empty" onClick=${onSelect}>
        <div style=${{ position:'absolute', top:'8px', right:'10px', fontSize:'11px', color:'rgba(255,255,255,0.4)', fontFamily:'monospace', fontWeight:'700' }}>${index + 1}</div>
        <div style=${{ textAlign:'center', color:'rgba(255,255,255,0.5)', fontSize:'32px', marginBottom:'8px' }}>＋</div>
        <div style=${{ textAlign:'center', color:'rgba(255,255,255,0.5)', fontSize:'16px', fontWeight:'700' }}>あたらしくはじめる</div>
      </div>
    `;
  }
  return html`
    <div class="save-slot-card" onClick=${onSelect}>
      <div style=${{ position:'absolute', top:'8px', right:'36px', fontSize:'11px', color:'var(--color-muted)', fontFamily:'monospace', fontWeight:'700' }}>${index + 1}</div>
      <div class="save-slot-card__label">ファイル ${index + 1}</div>
      <div class="save-slot-card__stage">ステージ ${slot.maxUnlocked}</div>
      <div class="save-slot-card__meta">
        <div><img class="pixel-icon" src="art/shop/coin.png" alt="" /> ${slot.coins} コイン</div>
        <div>さいごにあそんだ日　${formatDate(slot.lastPlayedAt)}</div>
      </div>
      <button class="save-slot-card__delete" onClick=${(e) => { e.stopPropagation(); onDelete(); }}>✕</button>
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

      <!-- セーブスロット選択 -->
      ${showSlots && html`
        <div class="save-slots">
          <div class="save-slots__title">ファイルをえらんでね</div>
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
          <button class="pixel-button" onClick=${() => setShowSlots(false)}>
            <img src="art/ui/back.png" alt="" /> もどる <span class="kbd">Esc</span>
          </button>
        </div>
      `}

      <!-- 削除確認ダイアログ -->
      ${confirmDelete && html`
        <div class="confirm-overlay">
          <div class="confirm-dialog">
            <div class="confirm-dialog__title">ほんとうにけす？</div>
            <div class="confirm-dialog__sub">このデータはもとにもどせません</div>
            <div class="confirm-dialog__btns">
              <button class="btn-ghost" onClick=${() => setConfirmDelete(null)}>
                やめる <span class="kbd">Esc</span>
              </button>
              <button class="btn-primary" style=${{ background:'#FF5252', boxShadow:'0 4px 0 #C62828' }}
                onClick=${() => handleDelete(confirmDelete)}>
                けす <span class="kbd">D</span>
              </button>
            </div>
          </div>
        </div>
      `}
    </div>
  `;
}
