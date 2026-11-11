let _ctx = null;

function ctx() {
  if (!_ctx) {
    _ctx = new AudioContext();
    _ctx.addEventListener('statechange', () => {
      if (_ctx.state !== 'running' || _bgmTimer === null) updatePlayback();
    });
  }
  if (_ctx.state === 'suspended') _ctx.resume().catch(() => {});
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

let _bgmTimer = null;
let _currentBgm = null;

const scheduledNotes = new Set();

// 8小節の行進曲。各小節は8分音符8個分。0は休符。
const TITLE_MELODY = [
  [[67,2],[72,3],[71,1],[72,2]], [[76,3],[74,1],[72,2],[0,2]],
  [[69,2],[74,3],[72,1],[74,2]], [[77,3],[76,1],[74,2],[0,2]],
  [[67,2],[72,3],[74,1],[76,2]], [[79,2],[77,2],[76,2],[72,2]],
  [[74,3],[71,1],[67,2],[71,2]], [[72,5],[0,3]],
];
const SONGS = {
  title: {
    bpm: 116, melody: TITLE_MELODY,
    bass: [48,48,50,55,48,53,55,48], reply: [64,67,65,71,64,69,62,64],
    drums: [2,6], leadVolume: 0.034,
  },
  map: {
    bpm: 96,
    melody: [
      [[67,2],[72,2],[76,3],[0,1]], [[74,2],[72,1],[71,1],[67,4]],
      [[65,2],[69,2],[72,3],[0,1]], [[71,3],[69,1],[67,2],[0,2]],
      [[64,2],[67,2],[72,2],[76,2]], [[77,3],[76,1],[72,4]],
      [[74,2],[71,2],[67,3],[0,1]], [[72,6],[0,2]],
    ],
    bass: [48,55,53,55,48,53,55,48], reply: [64,62,65,62,67,65,62,64],
    drums: [6], leadVolume: 0.029,
  },
  shop: {
    bpm: 108,
    melody: [
      [[0,1],[65,1],[69,3],[72,1],[69,2]], [[67,1],[70,1],[74,3],[0,3]],
      [[0,1],[67,1],[70,3],[74,1],[72,2]], [[69,3],[65,1],[64,2],[0,2]],
      [[65,1],[69,1],[72,3],[74,1],[72,2]], [[70,3],[69,1],[67,2],[0,2]],
      [[67,1],[70,1],[72,2],[64,3],[67,1]], [[69,2],[65,4],[0,2]],
    ],
    bass: [41,43,43,41,50,46,48,41], reply: [60,62,62,60,65,62,64,60],
    drums: [2,6], leadVolume: 0.027,
  },
  finalBoss: {
    bpm: 156,
    melody: [
      [[62,1],[69,1],[74,3],[72,1],[74,2]], [[77,2],[76,1],[74,1],[69,3],[0,1]],
      [[70,1],[74,1],[77,3],[76,1],[74,2]], [[73,2],[69,2],[76,3],[0,1]],
      [[65,1],[69,1],[72,2],[77,3],[79,1]], [[81,3],[79,1],[77,2],[74,2]],
      [[79,2],[77,1],[76,1],[74,2],[70,2]], [[69,1],[73,1],[76,2],[81,3],[0,1]],
    ],
    bass: [38,38,46,45,41,46,43,45], reply: [65,69,65,64,69,70,67,73],
    drums: [0,2,5,6,7], leadVolume: 0.029,
  },
  battle: {
    bpm: 144,
    melody: [
      [[64,1],[0,1],[69,2],[72,1],[71,1],[69,2]], [[67,2],[71,1],[74,1],[71,2],[0,2]],
      [[65,1],[0,1],[69,2],[72,2],[74,2]], [[76,3],[74,1],[71,2],[68,2]],
      [[69,1],[72,1],[76,2],[74,1],[72,1],[69,2]], [[77,2],[76,2],[72,3],[0,1]],
      [[74,1],[72,1],[69,2],[65,2],[69,2]], [[71,2],[68,2],[64,3],[0,1]],
    ],
    bass: [45,43,41,40,45,41,50,40], reply: [60,62,60,59,64,60,62,59],
    drums: [2,5,6], leadVolume: 0.025,
  },
};
let pulseWave;
let drumNoise;

function playBgmNote(c, source, start, duration, volume) {
  const gain = c.createGain();
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(volume, start + 0.004);
  gain.gain.setValueAtTime(volume, start + duration * 0.68);
  gain.gain.linearRampToValueAtTime(0, start + duration);
  source.connect(gain);
  gain.connect(c.destination);
  scheduledNotes.add(source);
  source.onended = () => {
    scheduledNotes.delete(source);
    source.disconnect();
    gain.disconnect();
  };
  source.start(start);
  source.stop(start + duration);
}

function loopSong(song, start = ctx().currentTime + 0.03) {
  const c = ctx();
  const step = 60 / song.bpm / 2;
  if (!pulseWave) {
    // デューティ比25%のパルス波。細く明るい主旋律にする。
    const real = new Float32Array(64);
    const imag = new Float32Array(64);
    for (let n = 1; n < real.length; n++) real[n] = Math.sin(n * Math.PI / 4) / n;
    pulseWave = c.createPeriodicWave(real, imag);
    drumNoise = c.createBuffer(1, Math.ceil(c.sampleRate * 0.06), c.sampleRate);
    const samples = drumNoise.getChannelData(0);
    for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
  }
  function tone(type, midi, at, length, volume) {
    const osc = c.createOscillator();
    if (type === 'pulse') osc.setPeriodicWave(pulseWave);
    else osc.type = type;
    osc.frequency.value = 440 * 2 ** ((midi - 69) / 12);
    playBgmNote(c, osc, at, length * step, volume);
  }
  song.melody.forEach((bar, i) => {
    const at = start + i * 8 * step;
    let cursor = at;
    for (const [pitch, length] of bar) {
      if (pitch) tone('pulse', pitch, cursor, length * 0.88, song.leadVolume);
      cursor += length * step;
    }
    for (const beat of [0, 2, 4, 6]) {
      tone('triangle', song.bass[i] + (beat % 4 ? 7 : 0), at + beat * step, 1.45, 0.052);
    }
    for (const tick of song.drums) {
      const noise = c.createBufferSource();
      noise.buffer = drumNoise;
      playBgmNote(c, noise, at + tick * step, 0.045, 0.014);
    }
    tone('square', song.reply[i], at + 6 * step, 0.8, 0.013);
    tone('square', song.reply[i] + (i === 7 ? 3 : 2), at + 7 * step, 0.72, 0.011);
  });
  const end = start + song.melody.length * 8 * step;
  _bgmTimer = setTimeout(() => loopSong(song, Math.max(end, c.currentTime)), (end - c.currentTime - 0.1) * 1000);
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
  if (ctx().state === 'running') loopSong(SONGS[_currentBgm]);
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

function resumeOnInput() {
  if (!_muted && !document.hidden && _currentBgm && _ctx?.state === 'suspended') ctx();
}

window.addEventListener('click', resumeOnInput, true);
window.addEventListener('keydown', resumeOnInput, true);
document.addEventListener('visibilitychange', updatePlayback);
window.addEventListener('pagehide', silenceBgm);
window.addEventListener('storage', event => {
  if (event.key !== 'kba-mute') return;
  _muted = event.newValue === '1';
  updatePlayback();
});
