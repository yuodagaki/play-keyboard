const STORAGE_KEY = 'kba-saves';
const MAX_SLOTS = 3;

function defaultGameState() {
  return {
    coins: 80,
    weapon: 'wooden',
    armor: 'hat',
    ownedWeapons: ['wooden'],
    ownedArmors: ['hat'],
    progress: {},
    maxUnlocked: 1,
  };
}

function now() {
  return new Date().toISOString();
}

export function loadAllSlots() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return [];
}

export function loadSlot(id) {
  return loadAllSlots().find(s => s.id === id) ?? null;
}

export function createSlot(name) {
  const slots = loadAllSlots();
  if (slots.length >= MAX_SLOTS) return null;
  const slot = {
    id: String(Date.now()),
    name,
    createdAt: now(),
    lastPlayedAt: now(),
    playtimeMin: 0,
    ...defaultGameState(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...slots, slot]));
  return slot;
}

export function saveSlot(slot) {
  const slots = loadAllSlots();
  const idx = slots.findIndex(s => s.id === slot.id);
  const updated = { ...slot, lastPlayedAt: now() };
  if (idx >= 0) {
    slots[idx] = updated;
  } else {
    slots.push(updated);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(slots));
}

export function deleteSlot(id) {
  const slots = loadAllSlots().filter(s => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(slots));
}

export function availableSlotCount() {
  return MAX_SLOTS - loadAllSlots().length;
}
