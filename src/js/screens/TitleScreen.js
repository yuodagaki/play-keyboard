import { html } from 'https://esm.sh/htm/react';
import { useState, useEffect } from 'https://esm.sh/react';
import { StickFigure } from '../components/StickFigure.js';
import { loadAllSlots, createSlot, deleteSlot } from '../utils/save.js';

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
        <div>💰 ${slot.coins} コイン</div>
        <div>🕐 ${formatDate(slot.lastPlayedAt)}</div>
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

  const handleSelect = (slot, idx) => {
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
      <!-- 太陽 -->
      <div style=${{ position:'absolute', top:'30px', right:'120px', width:'80px', height:'80px', background:'#FFD700', borderRadius:'50%', boxShadow:'0 0 40px #FFD700' }} />

      <!-- 雲 -->
      ${[{l:50,t:55,s:0},{l:380,t:90,s:5},{l:680,t:45,s:9},{l:980,t:80,s:3}].map((c,i) => html`
        <div key=${i} style=${{ position:'absolute', left:c.l, top:c.t, animation:'cloud-drift 30s linear infinite', animationDelay:`-${c.s}s` }}>
          <div style=${{ width:'200px', height:'76px', background:'white', borderRadius:'50%', opacity:0.92, position:'relative' }}>
            <div style=${{ position:'absolute', top:'-40%', left:'20%', width:'50%', height:'100%', background:'white', borderRadius:'50%' }} />
            <div style=${{ position:'absolute', top:'-25%', left:'50%', width:'35%', height:'80%', background:'white', borderRadius:'50%' }} />
          </div>
        </div>
      `)}

      <!-- 木 -->
      ${[70,260,480,760,1020,1180].map((x,i) => html`
        <div key=${i}>
          <div style=${{ position:'absolute', left:x, bottom:58, width:0, height:0, borderLeft:'22px solid transparent', borderRight:'22px solid transparent', borderBottom:'55px solid #2E7D32' }} />
          <div style=${{ position:'absolute', left:x+8, bottom:38, width:9, height:22, background:'#5D4037' }} />
        </div>
      `)}

      <!-- 地面 -->
      <div style=${{ position:'absolute', bottom:0, left:0, right:0, height:'90px', background:'linear-gradient(to bottom,#4CAF50,#2E7D32)' }}>
        <div style=${{ height:'8px', background:'#66BB6A', borderRadius:'4px 4px 0 0' }} />
      </div>

      <!-- タイトル -->
      <div class="title-logo">
        <div class="title-logo__text">⚔️ キーボードぼうけん ⚔️</div>
        <div class="title-logo__sub">タイピングでモンスターをたおそう！</div>
      </div>

      <!-- ヒーロー -->
      <div class="title-hero">
        <svg width="170" height="195" viewBox="0 0 120 160" style=${{ overflow:'visible' }}>
          <${StickFigure} weapon="wooden" armor="hat" pose="victory"
            animStyle=${{ animation:'idle-bob 2.5s ease-in-out infinite' }} />
        </svg>
      </div>

      <!-- ボタン -->
      <div class="title-buttons">
        <button class="btn-primary" onClick=${() => setShowSlots(true)}>
          🌟 はじめる <span class="kbd">Enter</span>
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
          <button class="save-slots__back" onClick=${() => setShowSlots(false)}>
            ← もどる <span class="kbd">Esc</span>
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
