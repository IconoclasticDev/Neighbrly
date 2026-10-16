// Neighbrly palette: light theme, warm neutrals + green/amber/terracotta.
// RULE: no blue or purple hues anywhere (checked by scripts/palette-lint.js).
export const c = {
  bg: '#FAF7F0',
  surface: '#FFFFFF',
  text: '#2A2A26',
  muted: '#6B6B63',
  border: '#E4DFD3',
  track: '#EDE8DB',
  primary: '#2F7D5B',
  primaryDark: '#1F5C42',
  primarySoft: '#E3F1E8',
  accent: '#F2A900',
  accentSoft: '#FCF0CF',
  caution: '#E8A33D',
  risk: '#D9553A',
  riskSoft: '#F8E1DB',
  good: '#4E9A66',
  white: '#FFFFFF',
};
export const radius = 14;
export function scoreFill(v:number|null){return v===null?c.muted:v>=75?c.good:v>=55?c.caution:c.risk;}
export function scoreColor(v: number | null) {
  if (v === null) return c.muted;
  return c.text;
}
export function scoreLabel(v: number | null) {
  if (v === null) return 'Insufficient data';
  if (v >= 75) return 'Strong';
  if (v >= 55) return 'Mixed';
  return 'Weak';
}
