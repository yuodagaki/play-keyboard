let _ctx = null;

function ctx() {
  if (!_ctx) _ctx = new AudioContext();
  if (_ctx.state === 'suspended') _ctx.resume();
  return _ctx;
}

let _muted = localStorage.getItem('kba-mute') === '1';

export function isMuted() { return _muted; }

export function toggleMute() {
  _muted = !_muted;
  localStorage.setItem('kba-mute', _muted ? '1' : '0');
  updatePlayback();
  return _muted;
}

// ─── SE ───────────────────────────────────────────────────

function playCorrect() {
  const c = ctx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.connect(gain); gain.connect(c.destination);
  osc.type = 'triangle';
  osc.frequency.value = 880;
  gain.gain.setValueAtTime(0.32, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.09);
  osc.start(c.currentTime);
  osc.stop(c.currentTime + 0.09);
}

function playMiss() {
  const c = ctx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.connect(gain); gain.connect(c.destination);
  osc.type = 'sawtooth';
  osc.frequency.value = 180;
  gain.gain.setValueAtTime(0.22, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.15);
  osc.start(c.currentTime);
  osc.stop(c.currentTime + 0.16);
}

function playWordComplete() {
  const c = ctx();
  [[392, 0.00, 0.10], [494, 0.08, 0.12]].forEach(([freq, when, dur]) => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain); gain.connect(c.destination);
    osc.type = 'sine';
    osc.frequency.value = freq;
    const t = c.currentTime + when;
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.start(t);
    osc.stop(t + dur + 0.01);
  });
}

function playEnemyDefeat() {
  const c = ctx();
  [[262, 0.00, 0.10], [330, 0.08, 0.10], [392, 0.16, 0.18]].forEach(([freq, when, dur]) => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain); gain.connect(c.destination);
    osc.type = 'square';
    osc.frequency.value = freq;
    const t = c.currentTime + when;
    gain.gain.setValueAtTime(0.13, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.start(t);
    osc.stop(t + dur + 0.01);
  });
}

function playStageClear() {
  const c = ctx();
  [[262, 0.00, 0.12], [330, 0.10, 0.12], [392, 0.20, 0.12], [524, 0.30, 0.30]].forEach(([freq, when, dur]) => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain); gain.connect(c.destination);
    osc.type = 'sine';
    osc.frequency.value = freq;
    const t = c.currentTime + when;
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.start(t);
    osc.stop(t + dur + 0.01);
  });
}

function playStageFail() {
  const c = ctx();
  [[262, 0.00, 0.18], [196, 0.15, 0.25]].forEach(([freq, when, dur]) => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain); gain.connect(c.destination);
    osc.type = 'sine';
    osc.frequency.value = freq;
    const t = c.currentTime + when;
    gain.gain.setValueAtTime(0.14, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.start(t);
    osc.stop(t + dur + 0.01);
  });
}

function playUiClick() {
  const c = ctx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.connect(gain); gain.connect(c.destination);
  osc.type = 'triangle';
  osc.frequency.value = 660;
  gain.gain.setValueAtTime(0.10, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.06);
  osc.start(c.currentTime);
  osc.stop(c.currentTime + 0.07);
}

function playCoinCount() {
  const c = ctx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.connect(gain); gain.connect(c.destination);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(1047, c.currentTime);
  osc.frequency.linearRampToValueAtTime(1319, c.currentTime + 0.07);
  gain.gain.setValueAtTime(0.10, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.07);
  osc.start(c.currentTime);
  osc.stop(c.currentTime + 0.08);
}

const SE_MAP = {
  correct:     playCorrect,
  miss:        playMiss,
  wordComplete: playWordComplete,
  enemyDefeat: playEnemyDefeat,
  stageClear:  playStageClear,
  stageFail:   playStageFail,
  uiClick:     playUiClick,
  coinCount:   playCoinCount,
};

export function playSound(name) {
  if (_muted || document.hidden) return;
  SE_MAP[name]?.();
}

export function playCombo(count) {
  if (_muted || document.hidden) return;
  const c = ctx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.connect(gain); gain.connect(c.destination);
  osc.type = 'triangle';
  osc.frequency.value = 440 * Math.pow(1.12, Math.min(count - 1, 8));
  gain.gain.setValueAtTime(0.18, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.09);
  osc.start(c.currentTime);
  osc.stop(c.currentTime + 0.09);
}

// ─── BGM ──────────────────────────────────────────────────

const BGM_TITLE = [
  [392, 1], [440, 0.5], [392, 0.5], [330, 1], [0, 1],
  [294, 1], [330, 0.5], [294, 0.5], [262, 2],
];

const BGM_BATTLE = [
  [523, 0.5], [523, 0.5], [587, 0.5], [523, 0.5],
  [494, 0.5], [523, 0.5], [0, 0.5],   [392, 0.5],
  [440, 0.5], [440, 0.5], [494, 0.5], [440, 0.5],
  [392, 0.5], [440, 0.5], [0, 1.0],
];

let _bgmTimer = null;
let _currentBgm = null;

const scheduledNotes = new Set();

function scheduleBgm(notes, bpm, startTime) {
  const beatSec = 60 / bpm;
  let t = startTime;

  for (const [freq, beats] of notes) {
    const dur = beats * beatSec;
    if (freq > 0) {
      const c = ctx();
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.connect(gain); gain.connect(c.destination);
      osc.type = 'square';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.02, t);
      gain.gain.setValueAtTime(0.02, t + dur * 0.8);
      gain.gain.linearRampToValueAtTime(0, t + dur);
      osc.start(t);
      osc.stop(t + dur);
      scheduledNotes.add(osc);
      osc.onended = () => scheduledNotes.delete(osc);
    }
    t += dur;
  }
  return t;
}

function loopBgm(notes, bpm) {
  const endTime = scheduleBgm(notes, bpm, ctx().currentTime);
  const loopMs = (endTime - ctx().currentTime) * 1000;
  _bgmTimer = setTimeout(() => loopBgm(notes, bpm), Math.max(loopMs, 100));
}

function silenceBgm() {
  clearTimeout(_bgmTimer);
  _bgmTimer = null;
  for (const note of scheduledNotes) {
    note.disconnect();
    note.stop();
  }
  scheduledNotes.clear();
}

function updatePlayback() {
  silenceBgm();
  if (_muted || document.hidden || !_currentBgm) return;
  if (_currentBgm === 'battle') loopBgm(BGM_BATTLE, 140);
  else loopBgm(BGM_TITLE, 80);
}

export function startBgm(name) {
  if (_currentBgm === name) return;
  _currentBgm = name;
  updatePlayback();
}

export function stopBgm() {
  _currentBgm = null;
  silenceBgm();
}

document.addEventListener('visibilitychange', updatePlayback);
window.addEventListener('pagehide', silenceBgm);
window.addEventListener('storage', event => {
  if (event.key !== 'kba-mute') return;
  _muted = event.newValue === '1';
  updatePlayback();
});
