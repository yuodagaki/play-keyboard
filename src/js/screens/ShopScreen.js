import { LittleKnight } from '../components/LittleKnight.js';
import { html } from 'https://esm.sh/htm/react';
import { useState, useEffect, useRef } from 'https://esm.sh/react';
import { getItems } from '../data/loader.js';
import { playSound, startBgm, stopBgm } from '../utils/sound.js';

function ItemRow({ item, owned, equipped, coins, canAfford, onShortfall, onBuy, onEquip }) {
  const isEquipped = equipped === item.id;
  const isOwned = owned.includes(item.id);

  return html`
    <div class=${'shop-item' + (isEquipped ? ' shop-item--equipped' : '')}>
      <div class="shop-display"><img src=${'art/' + (item.atk ? 'forest/' : 'shop/') + item.id + '.png'} alt="" /></div>
      <div class="shop-item__info">
        <div class="shop-item__name">${item.name}</div>
        <div class="shop-item__desc">${item.desc}</div>
        ${!isOwned && !canAfford && html`<div class="coin-gap">あと ${item.cost - coins} まい</div>`}
      </div>
      ${isEquipped ? html`
        <div class="shop-item__badge-equipped">そうびちゅう</div>
      ` : isOwned ? html`
        <button class="shop-item__btn-equip" onClick=${onEquip}>
          そうびする
        </button>
      ` : html`
        <button
          class=${'shop-item__btn-buy shop-item__btn-buy--' + (canAfford ? 'available' : 'disabled')}
          onClick=${canAfford ? onBuy : onShortfall}
        >
          <img class="pixel-icon" src="art/shop/coin.png" alt="コイン" /> ${item.cost}
        </button>
      `}
    </div>
  `;
}

export function ShopScreen({ slot, onBuy, onEquip, onBuySpecial, onClose }) {
  const [items, setItems] = useState(null);
  const [previewWeapon, setPreviewWeapon] = useState(slot.weapon);
  const [previewArmor, setPreviewArmor] = useState(slot.armor);
  const [foxSpeaking, setFoxSpeaking] = useState(false);
  const speechTimer = useRef(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    startBgm('shop');
    return () => {
      clearTimeout(speechTimer.current);
      stopBgm();
    };
  }, []);

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

  const showShortfall = () => {
    clearTimeout(speechTimer.current);
    setFoxSpeaking(true);
    speechTimer.current = setTimeout(() => setFoxSpeaking(false), 2400);
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  };

  const handleBuyWeapon = (item) => {
    playSound('uiClick');
    onBuy('weapon', item);
    showToast(`${item.name} をかった！`);
    setPreviewWeapon(item.id);
  };

  const handleBuyArmor = (item) => {
    playSound('uiClick');
    onBuy('armor', item);
    showToast(`${item.name} をかった！`);
    setPreviewArmor(item.id);
  };

  const handleEquipWeapon = (item) => {
    playSound('uiClick');
    onEquip('weapon', item);
    setPreviewWeapon(item.id);
  };

  const handleEquipArmor = (item) => {
    playSound('uiClick');
    onEquip('armor', item);
    setPreviewArmor(item.id);
  };

  return html`
    <div class="screen shop-screen">
      <!-- ヘッダー -->
      <div class="header">
        <button class="pixel-button" onClick=${onClose}>
          <img src="art/ui/back.png" alt="" /> もどる <span class="kbd">Esc</span>
        </button>
        <span style=${{ fontSize:'22px', fontWeight:'900', color:'white', marginLeft:'16px' }}>森のどうぐ屋</span>
        <span style=${{ marginLeft:'auto', fontSize:'20px', fontWeight:'900', color:'#FFD700' }}><img class="pixel-icon" src="art/shop/coin.png" alt="コイン" /> ${slot.coins}</span>
      </div>

      <div class="shop-body">
        <!-- キャラクタープレビュー -->
        <div class="shop-preview">
          <div class="shop-counter">
            <img src="art/shop/merchant.png" alt="きつねの店主" />
            <span role="status" class="shop-counter__speech">${foxSpeaking ? 'おかねがたりないよー' : ''}</span>
          </div>
          <div class="shop-preview__label">ゆうしゃのすがた</div>
          <${LittleKnight} weapon=${previewWeapon} armor=${previewArmor} />
        </div>

        <!-- アイテムリスト -->
        <div class="shop-items">
          ${!items ? html`
            <div style=${{ fontSize:'18px', color:'var(--color-muted)', textAlign:'center', marginTop:'40px' }}>
              よみこみちゅう...
            </div>
          ` : html`
            <div class="shop-items__section-title">ぶき</div>
            ${items.weapons.map(item => html`
              <${ItemRow}
                key=${item.id}
                item=${item}
                coins=${slot.coins}
                owned=${slot.ownedWeapons}
                equipped=${slot.weapon}
                onShortfall=${showShortfall}
                canAfford=${slot.coins >= item.cost}
                onBuy=${() => handleBuyWeapon(item)}
                onEquip=${() => handleEquipWeapon(item)}
              />
            `)}

            <div class="shop-items__section-title" style=${{ marginTop:'24px' }}>ぼうぐ</div>
            ${items.armors.map(item => html`
              <${ItemRow}
                key=${item.id}
                item=${item}
                coins=${slot.coins}
                owned=${slot.ownedArmors}
                equipped=${slot.armor}
                onShortfall=${showShortfall}
                canAfford=${slot.coins >= item.cost}
                onBuy=${() => handleBuyArmor(item)}
                onEquip=${() => handleEquipArmor(item)}
              />
            `)}

            ${items.specials?.length > 0 && html`
              <div class="shop-items__section-title" style=${{ marginTop:'24px' }}>とくべつ</div>
              ${items.specials.map(item => {
                const owned = slot.ownedSpecials?.includes(item.id);
                return html`
                  <div key=${item.id} class=${'shop-item' + (owned ? ' shop-item--equipped' : '')}>
                    <div class="shop-display"><img src="art/shop/endless.png" alt="" /></div>
                    <div class="shop-item__info">
                      <div class="shop-item__name">${item.name}</div>
                      <div class="shop-item__desc">${item.desc}</div>
                    </div>
                    ${owned ? html`
                      <div class="shop-item__badge-equipped">かいほうずみ</div>
                    ` : html`
                      <button
                        class=${'shop-item__btn-buy shop-item__btn-buy--' + (slot.coins >= item.cost ? 'available' : 'disabled')}
                        onClick=${slot.coins >= item.cost ? () => {
                          onBuySpecial(item);
                          showToast(`${item.name} をかった！`);
                        } : undefined}
                      >
                        <img class="pixel-icon" src="art/shop/coin.png" alt="コイン" /> ${item.cost}
                      </button>
                    `}
                  </div>
                `;
              })}
            `}
          `}
        </div>
      </div>

      ${toast && html`<div class="shop-toast">${toast}</div>`}
    </div>
  `;
}
