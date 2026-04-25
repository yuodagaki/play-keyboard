import { html } from 'https://esm.sh/htm/react';
import { useState, useEffect } from 'https://esm.sh/react';
import { StickFigure } from '../components/StickFigure.js';
import { getItems } from '../data/loader.js';

function ItemRow({ item, owned, equipped, canAfford, onBuy, onEquip }) {
  const isEquipped = equipped === item.id;
  const isOwned = owned.includes(item.id);

  return html`
    <div class=${'shop-item' + (isEquipped ? ' shop-item--equipped' : '')}>
      <div class="shop-item__info">
        <div class="shop-item__name">${item.name}</div>
        <div class="shop-item__desc">${item.desc}</div>
      </div>
      ${isEquipped ? html`
        <div class="shop-item__badge-equipped">そうちゅう</div>
      ` : isOwned ? html`
        <button class="shop-item__btn-equip" onClick=${onEquip}>
          そうびする
        </button>
      ` : html`
        <button
          class=${'shop-item__btn-buy shop-item__btn-buy--' + (canAfford ? 'available' : 'disabled')}
          onClick=${canAfford ? onBuy : undefined}
        >
          💰 ${item.cost}
        </button>
      `}
    </div>
  `;
}

export function ShopScreen({ slot, onBuy, onEquip, onClose }) {
  const [items, setItems] = useState(null);
  const [previewWeapon, setPreviewWeapon] = useState(slot.weapon);
  const [previewArmor, setPreviewArmor] = useState(slot.armor);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    getItems().then(setItems);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  };

  const handleBuyWeapon = (item) => {
    onBuy('weapon', item);
    showToast(`${item.name} をかった！`);
    setPreviewWeapon(item.id);
  };

  const handleBuyArmor = (item) => {
    onBuy('armor', item);
    showToast(`${item.name} をかった！`);
    setPreviewArmor(item.id);
  };

  const handleEquipWeapon = (item) => {
    onEquip('weapon', item);
    setPreviewWeapon(item.id);
  };

  const handleEquipArmor = (item) => {
    onEquip('armor', item);
    setPreviewArmor(item.id);
  };

  return html`
    <div class="screen shop-screen">
      <!-- ヘッダー -->
      <div class="header">
        <button class="btn-ghost" style=${{ color:'white', borderColor:'rgba(255,255,255,0.4)' }} onClick=${onClose}>
          ← もどる <span class="kbd">Esc</span>
        </button>
        <span style=${{ fontSize:'22px', fontWeight:'900', color:'white', marginLeft:'16px' }}>🛒 ショップ</span>
        <span style=${{ marginLeft:'auto', fontSize:'20px', fontWeight:'900', color:'#FFD700' }}>💰 ${slot.coins}</span>
      </div>

      <div class="shop-body">
        <!-- キャラクタープレビュー -->
        <div class="shop-preview">
          <div class="shop-preview__label">ゆうしゃのすがた</div>
          <svg width="130" height="150" viewBox="0 0 120 160" style=${{ overflow:'visible' }}>
            <${StickFigure}
              weapon=${previewWeapon}
              armor=${previewArmor}
              pose="idle"
              animStyle=${{ animation: 'idle-bob 2.5s ease-in-out infinite' }}
            />
          </svg>
        </div>

        <!-- アイテムリスト -->
        <div class="shop-items">
          ${!items ? html`
            <div style=${{ fontSize:'18px', color:'var(--color-muted)', textAlign:'center', marginTop:'40px' }}>
              よみこみちゅう...
            </div>
          ` : html`
            <div class="shop-items__section-title">⚔️ ぶき</div>
            ${items.weapons.map(item => html`
              <${ItemRow}
                key=${item.id}
                item=${item}
                owned=${slot.ownedWeapons}
                equipped=${slot.weapon}
                canAfford=${slot.coins >= item.cost}
                onBuy=${() => handleBuyWeapon(item)}
                onEquip=${() => handleEquipWeapon(item)}
              />
            `)}

            <div class="shop-items__section-title" style=${{ marginTop:'24px' }}>🛡️ ぼうぐ</div>
            ${items.armors.map(item => html`
              <${ItemRow}
                key=${item.id}
                item=${item}
                owned=${slot.ownedArmors}
                equipped=${slot.armor}
                canAfford=${slot.coins >= item.cost}
                onBuy=${() => handleBuyArmor(item)}
                onEquip=${() => handleEquipArmor(item)}
              />
            `)}
          `}
        </div>
      </div>

      ${toast && html`<div class="shop-toast">${toast}</div>`}
    </div>
  `;
}
