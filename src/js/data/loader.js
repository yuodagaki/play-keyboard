const cache = {};

async function load(path) {
  if (cache[path]) return cache[path];
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  cache[path] = await res.json();
  return cache[path];
}

export async function getStages()  { return load('data/stages.json'); }
export async function getWorlds()  { return load('data/worlds.json'); }
export async function getWords()   { return load('data/words.json'); }
export async function getItems()   { return load('data/items.json'); }

export async function getStage(id) {
  const stages = await getStages();
  return stages.find(s => s.id === id) ?? null;
}

export async function getWorld(id) {
  const worlds = await getWorlds();
  return worlds.find(w => w.id === id) ?? null;
}

export async function preloadAll() {
  await Promise.all([getStages(), getWorlds(), getWords(), getItems()]);
}
