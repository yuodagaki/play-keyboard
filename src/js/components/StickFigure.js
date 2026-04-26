import { html } from 'https://esm.sh/htm/react';

const POSE_ARMS = {
  idle:    { r:[80, 78], l:[36, 78] },
  attack:  { r:[100,46], l:[44, 76] },
  victory: { r:[78, 32], l:[42, 32] },
  scratch: { r:[72, 40], l:[36, 78] },
};

export function StickFigure({ weapon = 'wooden', armor = 'hat', pose = 'idle', color = '#1A237E', animStyle = {} }) {
  const lw = 3.8;
  const cx = 58, headCy = 22, headR = 17;
  const bodyTop = 40, bodyBot = 84, shY = 54;

  const { r: ra, l: la } = POSE_ARMS[pose] ?? POSE_ARMS.idle;
  const llEnd = [cx - 20, bodyBot + 34];
  const rlEnd = [cx + 20, bodyBot + 34];

  const sLen = 30;
  const sAngle = pose === 'attack' ? 0 : -0.35;
  const sTip = [ra[0] + sLen * Math.cos(sAngle), ra[1] + sLen * Math.sin(sAngle)];
  const s = { stroke: color, strokeWidth: lw, strokeLinecap: 'round', strokeLinejoin: 'round' };

  return html`
    <g style=${animStyle}>
      <!-- 防具（ケープ・ローブ系は体の下に描画） -->
      ${armor === 'cape' && html`
        <polygon
          points="${cx-5},${bodyTop+8} ${cx-32},${bodyBot+8} ${cx+32},${bodyBot+8} ${cx+5},${bodyTop+8}"
          fill="#7B1FA2" opacity="0.82" />
      `}
      ${armor === 'robe' && html`
        <polygon
          points="${cx-5},${bodyTop+6} ${cx-34},${bodyBot+22} ${cx+34},${bodyBot+22} ${cx+5},${bodyTop+6}"
          fill="#1565C0" opacity="0.80" />
        <polygon
          points="${cx-3},${bodyTop+6} ${cx-20},${bodyBot+22} ${cx+20},${bodyBot+22} ${cx+3},${bodyTop+6}"
          fill="#42A5F5" opacity="0.45" />
      `}
      ${armor === 'divine' && html`
        <polygon
          points="${cx-5},${bodyTop+8} ${cx-30},${bodyBot+10} ${cx+30},${bodyBot+10} ${cx+5},${bodyTop+8}"
          fill="#F9A825" opacity="0.75" />
        <circle cx=${cx} cy=${headCy - headR - 9} r="12"
          fill="none" stroke="#FFD700" strokeWidth="3" opacity="0.8" />
      `}

      <!-- 体・骨格 -->
      <circle cx=${cx} cy=${headCy} r=${headR} fill="none" ...${s} />
      <line x1=${cx} y1=${bodyTop} x2=${cx} y2=${bodyBot} ...${s} />
      <line x1=${cx} y1=${shY} x2=${la[0]} y2=${la[1]} ...${s} />
      <line x1=${cx} y1=${shY} x2=${ra[0]} y2=${ra[1]} ...${s} />
      <line x1=${cx} y1=${bodyBot} x2=${llEnd[0]} y2=${llEnd[1]} ...${s} />
      <line x1=${cx} y1=${bodyBot} x2=${rlEnd[0]} y2=${rlEnd[1]} ...${s} />

      <!-- 武器 -->
      ${weapon === 'wooden' && html`
        <line x1=${ra[0]} y1=${ra[1]} x2=${sTip[0]} y2=${sTip[1]}
          stroke="#8B6914" strokeWidth=${lw * 0.85} strokeLinecap="round" />
      `}
      ${weapon === 'iron' && html`
        <line x1=${ra[0]} y1=${ra[1]} x2=${sTip[0]} y2=${sTip[1]}
          stroke="#9E9E9E" strokeWidth=${lw * 1.1} strokeLinecap="round" />
        <line x1=${ra[0]} y1=${ra[1]} x2=${sTip[0]} y2=${sTip[1]}
          stroke="rgba(255,255,255,0.55)" strokeWidth=${lw * 0.3} strokeLinecap="round" />
      `}
      ${weapon === 'flame' && html`
        <line x1=${ra[0]} y1=${ra[1]} x2=${sTip[0]} y2=${sTip[1]}
          stroke="#FF6B35" strokeWidth=${lw * 1.15} strokeLinecap="round" />
        <circle cx=${sTip[0]} cy=${sTip[1]} r="8" fill="#FF9500" opacity="0.85" />
        <circle cx=${sTip[0]} cy=${sTip[1]} r="4.5" fill="#FFE034" opacity="0.95" />
      `}
      ${weapon === 'thunder' && html`
        <line x1=${ra[0]} y1=${ra[1]} x2=${sTip[0]} y2=${sTip[1]}
          stroke="#7E57C2" strokeWidth=${lw * 1.2} strokeLinecap="round" />
        <line x1=${ra[0]} y1=${ra[1]} x2=${sTip[0]} y2=${sTip[1]}
          stroke="#FFD700" strokeWidth=${lw * 0.45} strokeLinecap="round" />
        <circle cx=${sTip[0]} cy=${sTip[1]} r="8" fill="#FFD700" opacity="0.70" />
        <circle cx=${sTip[0]} cy=${sTip[1]} r="4" fill="white" opacity="0.95" />
      `}
      ${weapon === 'ice' && html`
        <line x1=${ra[0]} y1=${ra[1]} x2=${sTip[0]} y2=${sTip[1]}
          stroke="#4FC3F7" strokeWidth=${lw * 1.1} strokeLinecap="round" />
        <line x1=${ra[0]} y1=${ra[1]} x2=${sTip[0]} y2=${sTip[1]}
          stroke="rgba(255,255,255,0.65)" strokeWidth=${lw * 0.35} strokeLinecap="round" />
        <circle cx=${sTip[0]} cy=${sTip[1]} r="7.5" fill="#B3E5FC" opacity="0.90" />
        <circle cx=${sTip[0]} cy=${sTip[1]} r="3.5" fill="white" />
      `}
      ${weapon === 'dragon' && html`
        <line x1=${ra[0]} y1=${ra[1]} x2=${sTip[0]} y2=${sTip[1]}
          stroke="#B71C1C" strokeWidth=${lw * 1.3} strokeLinecap="round" />
        <line x1=${ra[0]} y1=${ra[1]} x2=${sTip[0]} y2=${sTip[1]}
          stroke="#FF8F00" strokeWidth=${lw * 0.4} strokeLinecap="round" />
        <circle cx=${sTip[0]} cy=${sTip[1]} r="9" fill="#FF1744" opacity="0.55" />
        <circle cx=${sTip[0]} cy=${sTip[1]} r="5" fill="#FFAB00" opacity="0.95" />
        <circle cx=${sTip[0]} cy=${sTip[1]} r="2" fill="white" />
      `}
      ${weapon === 'legendary' && html`
        <line x1=${ra[0]} y1=${ra[1]} x2=${sTip[0]} y2=${sTip[1]}
          stroke="#FFD700" strokeWidth=${lw * 1.35} strokeLinecap="round" />
        <line x1=${ra[0]} y1=${ra[1]} x2=${sTip[0]} y2=${sTip[1]}
          stroke="white" strokeWidth=${lw * 0.45} strokeLinecap="round" />
        <circle cx=${sTip[0]} cy=${sTip[1]} r="11" fill="#FFD700" opacity="0.30" />
        <circle cx=${sTip[0]} cy=${sTip[1]} r="7.5" fill="#FFD700" opacity="0.65" />
        <circle cx=${sTip[0]} cy=${sTip[1]} r="4" fill="white" opacity="0.95" />
      `}

      <!-- 防具（頭・体の上に描画） -->
      ${armor === 'helmet' && html`
        <path
          d="M ${cx-headR-3} ${headCy+4} A ${headR+3} ${headR+3} 0 0 1 ${cx+headR+3} ${headCy+4} L ${cx+headR+5} ${headCy+12} L ${cx-headR-5} ${headCy+12} Z"
          fill="#9E9E9E" stroke="#616161" strokeWidth="2" />
      `}
      ${armor === 'hat' && html`
        <polygon
          points="${cx},${headCy-headR-18} ${cx-16},${headCy-headR+1} ${cx+16},${headCy-headR+1}"
          fill="#FFD700" stroke="#F9A825" strokeWidth="1.5" />
      `}
      ${armor === 'armor' && html`
        <rect x=${cx-13} y=${bodyTop+1} width="26" height="${shY - bodyTop + 6}" rx="3"
          fill="#78909C" stroke="#455A64" strokeWidth="1.5" opacity="0.88" />
        <line x1=${cx-13} y1=${bodyTop+10} x2=${cx+13} y2=${bodyTop+10}
          stroke="#455A64" strokeWidth="1.2" />
        <line x1=${cx-13} y1=${bodyTop+20} x2=${cx+13} y2=${bodyTop+20}
          stroke="#455A64" strokeWidth="1.2" />
      `}
      ${armor === 'shield' && html`
        <ellipse cx=${la[0]} cy=${la[1]} rx="10" ry="12"
          fill="#1565C0" stroke="#0D47A1" strokeWidth="1.8" opacity="0.92" />
        <ellipse cx=${la[0]} cy=${la[1]} rx="6" ry="7.5"
          fill="#42A5F5" opacity="0.55" />
        <line x1=${la[0]} y1=${la[1]-9} x2=${la[0]} y2=${la[1]+9}
          stroke="#0D47A1" strokeWidth="1.2" />
        <line x1=${la[0]-8} y1=${la[1]} x2=${la[0]+8} y2=${la[1]}
          stroke="#0D47A1" strokeWidth="1.2" />
      `}
      ${armor === 'divine' && html`
        <rect x=${cx-14} y=${bodyTop} width="28" height="${shY - bodyTop + 4}" rx="4"
          fill="#FFD700" stroke="#F9A825" strokeWidth="2" opacity="0.70" />
        <path
          d="M ${cx-headR-3} ${headCy+4} A ${headR+3} ${headR+3} 0 0 1 ${cx+headR+3} ${headCy+4} L ${cx+headR+5} ${headCy+12} L ${cx-headR-5} ${headCy+12} Z"
          fill="#FFD700" stroke="#F9A825" strokeWidth="1.5" />
      `}
    </g>
  `;
}
