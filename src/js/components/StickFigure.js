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
      ${armor === 'cape' && html`
        <polygon
          points="${cx-5},${bodyTop+8} ${cx-32},${bodyBot+8} ${cx+32},${bodyBot+8} ${cx+5},${bodyTop+8}"
          fill="#7B1FA2" opacity="0.82" />
      `}

      <circle cx=${cx} cy=${headCy} r=${headR} fill="none" ...${s} />
      <line x1=${cx} y1=${bodyTop} x2=${cx} y2=${bodyBot} ...${s} />
      <line x1=${cx} y1=${shY} x2=${la[0]} y2=${la[1]} ...${s} />
      <line x1=${cx} y1=${shY} x2=${ra[0]} y2=${ra[1]} ...${s} />
      <line x1=${cx} y1=${bodyBot} x2=${llEnd[0]} y2=${llEnd[1]} ...${s} />
      <line x1=${cx} y1=${bodyBot} x2=${rlEnd[0]} y2=${rlEnd[1]} ...${s} />

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
    </g>
  `;
}
