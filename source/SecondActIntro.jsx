import { useEffect, useRef } from 'react';

/* Second Act — opening sequence engine. Canvas 2D, no dependencies. ~6.0s timeline, flat pop-art lips. */
const DUR = 6.0, RED = '#E52232', CREAM = '#F3E4CF', SHADE = '#B8101E', DOT = '#6E0B16', BLK = '#050505', PRINT = '#C21425';
const TAU = Math.PI * 2, C45 = Math.SQRT1_2;
const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const eIO = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const eO = (t) => 1 - Math.pow(1 - t, 3);
const eI = (t) => Math.pow(t, 2.2);
const CUT = 2.62; /* internal time at which the whole screen cuts to red, right after the kiss lands */
const TMAP = [[0, 0], [1.2, 1.2], [2.2, 1.2], [4.6, 2.38], [4.9, 2.68], [6.0, 3.8]];
function tmap(rt) { for (let i = 1; i < TMAP.length; i++) if (rt <= TMAP[i][0]) { const [a, b] = TMAP[i - 1], [c, d] = TMAP[i]; return lerp(b, d, (rt - a) / (c - a)); } return 4.0; }
function hash2(i, j) { let h = (Math.imul(i, 374761393) + Math.imul(j, 668265263)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; }
function vn(x, y, s) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), a = s * 131, b = s * 71;
  return lerp(lerp(hash2(xi + a, yi + b), hash2(xi + 1 + a, yi + b), u), lerp(hash2(xi + a, yi + 1 + b), hash2(xi + 1 + a, yi + 1 + b), u), v);
}
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

/* Lip geometry in unit space. e: 0 = parted smile, 1 = pursed pucker. Real shape change, not a scale. */
function lipShape(e, gap) {
  const w = lerp(1, 0.5, e), c = lerp(-0.07, 0, e), tu = lerp(0.33, 0.3, e), tl = lerp(0.42, 0.36, e);
  const uy = c - gap / 2, ly = c + gap / 2, topY = uy - tu, dipY = uy - tu * lerp(0.72, 0.84, e), botY = ly + tl, cx = w * lerp(0.24, 0.3, e);
  const k1 = lerp(0.8, 1.0, e), k2 = lerp(0.5, 0.66, e), ut = lerp(tu * 0.15, tu * 0.58, e), lt = lerp(tl * 0.15, tl * 0.58, e);
  const upper = new Path2D(), lower = new Path2D(), cav = new Path2D();
  upper.moveTo(-w, c);
  upper.bezierCurveTo(-w * k1, c - ut, -w * k2, topY, -cx, topY);
  upper.bezierCurveTo(-cx * 0.5, topY, -cx * 0.3, dipY, 0, dipY);
  upper.bezierCurveTo(cx * 0.3, dipY, cx * 0.5, topY, cx, topY);
  upper.bezierCurveTo(w * k2, topY, w * k1, c - ut, w, c);
  upper.bezierCurveTo(w * 0.7, c - gap * 0.1, w * 0.35, uy, 0, uy);
  upper.bezierCurveTo(-w * 0.35, uy, -w * 0.7, c - gap * 0.1, -w, c);
  upper.closePath();
  for (const p of [lower, cav]) {
    p.moveTo(-w, c);
    p.bezierCurveTo(-w * 0.7, c + gap * 0.1, -w * 0.35, ly, 0, ly);
    p.bezierCurveTo(w * 0.35, ly, w * 0.7, c + gap * 0.1, w, c);
  }
  lower.bezierCurveTo(w * k1, c + lt, w * lerp(0.35, 0.5, e), botY, 0, botY);
  lower.bezierCurveTo(-w * lerp(0.35, 0.5, e), botY, -w * k1, c + lt, -w, c);
  lower.closePath();
  cav.bezierCurveTo(w * 0.7, c - gap * 0.1, w * 0.35, uy, 0, uy);
  cav.bezierCurveTo(-w * 0.35, uy, -w * 0.7, c - gap * 0.1, -w, c);
  cav.closePath();
  return { upper, lower, cav, w, c, uy, ly, topY, botY, tu, tl };
}

export function createSecondActIntro(host, { onComplete, onSkip, skippable = true, reducedMotion, lockScroll = true, manual = false } = {}) {
  const cv = document.createElement('canvas');
  cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  const ctx = cv.getContext('2d');
  host.appendChild(cv);
  let W = 1, H = 1, dpr = 1, pitch = 6, u0 = 100, uc = 300;
  let raf = 0, t = 0, last = 0, done = false, dead = false, btn = null;
  const prevOverflow = document.documentElement.style.overflow;
  if (lockScroll) document.documentElement.style.overflow = 'hidden';
  host.style.background = '#000'; host.style.overflow = 'hidden';

  function layout() {
    const r = host.getBoundingClientRect();
    W = Math.max(1, r.width); H = Math.max(1, r.height); dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    const portrait = W < H;
    pitch = clamp(Math.min(W, H) / 150, 4.5, 8);
    u0 = ((portrait || W < 700) ? 0.56 : 0.28) * W / 2;
    uc = 1.2 * Math.hypot(W / 2 / 0.52, H / 2 / 0.33) / 0.95; /* scale at which the pursed lips cover the whole viewport */
  }

  /* Flat pop mouth: solid red, hard shadow shapes with halftone tint, cream highlight cut-outs, black key-lines. */
  function drawFlat(cx, cy, ux, uy, rot, prog, rt, alpha) {
    const e = eIO(prog), gap = lerp(0.27 + 0.025 * Math.sin(rt * 6), 0.012, e), S = lipShape(e, gap), w = S.w;
    ctx.save(); ctx.globalAlpha = alpha; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.translate(cx, cy); ctx.rotate(rot); ctx.scale(ux, uy); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.fillStyle = BLK; ctx.fill(S.cav);
    if (gap > 0.06) {
      ctx.save(); ctx.clip(S.cav);
      ctx.fillStyle = '#8E0F1C'; ctx.beginPath(); ctx.ellipse(0, S.ly + gap * 0.05, w * 0.55, gap * 0.55, 0, 0, TAU); ctx.fill();
      const th = gap * 0.62, y0 = S.uy;
      ctx.fillStyle = CREAM; ctx.beginPath(); ctx.moveTo(-w * 0.6, y0 - 0.05); ctx.lineTo(w * 0.6, y0 - 0.05); ctx.lineTo(w * 0.6, y0 + th * 0.6);
      ctx.bezierCurveTo(w * 0.45, y0 + th * 1.1, -w * 0.45, y0 + th * 1.1, -w * 0.6, y0 + th * 0.6); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = BLK; ctx.lineWidth = 0.018;
      for (const x of [-0.3, 0, 0.3]) { ctx.beginPath(); ctx.moveTo(x * w, y0); ctx.lineTo(x * w, y0 + th * 0.95); ctx.stroke(); }
      ctx.restore();
    }
    ctx.fillStyle = RED; ctx.fill(S.upper); ctx.fill(S.lower);
    const zone = (lip, ex, ey, rx, ry, y0, y1) => {
      const sh = new Path2D(); sh.ellipse(ex, ey, rx, ry, 0, 0, TAU);
      ctx.save(); ctx.clip(lip); ctx.fillStyle = SHADE; ctx.fill(sh); ctx.clip(sh);
      ctx.fillStyle = DOT; ctx.beginPath(); const st = 0.036;
      for (let j = 0, y = y0; y < y1; y += st / 2, j++) for (let x = -w * 1.1 + (j & 1 ? st / 2 : 0); x < w * 1.1; x += st) { ctx.moveTo(x + 0.0115, y); ctx.arc(x, y, 0.0115, 0, TAU); }
      ctx.fill(); ctx.restore();
    };
    zone(S.upper, 0, S.uy + S.tu * 0.2, w * 1.3, S.tu * 0.62, S.uy - S.tu * 0.5, S.uy + 0.05);
    zone(S.lower, 0, S.botY + S.tl * 0.28, w * 1.3, S.tl * 0.66, S.botY - S.tl * 0.45, S.botY + 0.05);
    ctx.fillStyle = CREAM;
    ctx.save(); ctx.clip(S.lower);
    ctx.beginPath(); ctx.ellipse(w * 0.02, S.ly + S.tl * 0.42, w * 0.36, S.tl * 0.1, -0.03, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(w * 0.52, S.ly + S.tl * 0.28, w * 0.09, S.tl * 0.055, 0.35, 0, TAU); ctx.fill(); ctx.restore();
    ctx.save(); ctx.clip(S.upper); ctx.beginPath(); ctx.ellipse(-w * 0.34, S.topY + S.tu * 0.4, w * 0.22, S.tu * 0.09, -0.15, 0, TAU); ctx.fill(); ctx.restore();
    ctx.strokeStyle = BLK; ctx.lineWidth = lerp(0.05, 0.012, e); ctx.stroke(S.upper); ctx.stroke(S.lower);
    const eh = sstep(0.3, 0.9, e);
    if (eh > 0) { /* pursed opening: tapered seam + small round hole, with creases radiating from it */
      ctx.fillStyle = BLK; ctx.beginPath(); ctx.moveTo(-w * 0.46, S.c); ctx.quadraticCurveTo(0, S.c - 0.05 * eh, w * 0.46, S.c); ctx.quadraticCurveTo(0, S.c + 0.05 * eh, -w * 0.46, S.c); ctx.fill();
      ctx.beginPath(); ctx.ellipse(0, S.c, w * 0.26 * eh, 0.075 * eh, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = `rgba(5,5,5,${0.9 * eh})`; ctx.lineWidth = 0.012; ctx.lineCap = 'round';
      for (const lip of [S.upper, S.lower]) {
        ctx.save(); ctx.clip(lip);
        for (let k = 0; k < 16; k++) {
          const an = k * TAU / 16 + 0.1, dx = Math.cos(an), dy = Math.sin(an);
          if (Math.abs(dy) < 0.3) continue;
          ctx.beginPath(); ctx.moveTo(dx * 0.2 * 1.9, dy * 0.2 + S.c); ctx.lineTo(dx * 0.3 * 1.9, dy * 0.3 + S.c); ctx.stroke();
        }
        ctx.restore();
      }
    }
    ctx.restore();
  }

  function render(rt) {
    const t = tmap(rt);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.globalAlpha = 1; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    if (t < 0.4) return;
    if (t >= CUT) { solid(); return; }
    const m = Math.min(W, H);
    {
      let u;
      if (t < 1.2) u = u0 * lerp(0.9, 1, eO(clamp((t - 0.4) / 0.8)));
      else if (t < 1.45) u = u0 * lerp(1, 0.94, eIO((t - 1.2) / 0.25));
      else if (t < 2.38) u = u0 * 0.94 * Math.pow(uc / (u0 * 0.94), Math.pow((t - 1.45) / 0.93, 1.6));
      else u = uc * (1 - 0.03 * eO(clamp((t - 2.5) / 0.3)));
      const tc = t - 2.38, sh = tc > 0 ? Math.exp(-tc * 13) : 0, shx = Math.sin(tc * 70) * sh * 0.008 * m, shy = Math.cos(tc * 70) * sh * 0.006 * m;
      let sq = 0;
      if (t >= 2.38) sq = t < 2.45 ? eO((t - 2.38) / 0.07) : Math.cos(22 * (t - 2.45)) * Math.exp(-7 * (t - 2.45));
      const fd = 1 - sstep(1.6, 2.2, t), tk = 1 - eIO(clamp(t - 1.2));
      const rot = (-0.14 + 0.035 * Math.sin(rt * 3.1)) * tk;
      const cx = W / 2 + Math.sin(rt * 2.3 + 1) * W * 0.006 * fd + shx, cy = H / 2 + Math.sin(rt * 3.6) * H * 0.012 * fd + shy;
      const ma = sstep(0.4, 0.62, t);
      drawFlat(cx, cy, u * (1 + 0.06 * sq), u * (1 - 0.08 * sq), rot, clamp((t - 1.25) / 0.7), rt, ma);
    }
  }

  function solid() { ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.globalAlpha = 1; ctx.fillStyle = RED; ctx.fillRect(0, 0, W, H); host.style.background = RED; }
  function finish() {
    if (done) return; done = true; cancelAnimationFrame(raf); solid();
    if (btn) { btn.remove(); btn = null; } window.removeEventListener('keydown', onKey);
    if (onComplete) onComplete();
  }
  function frame(now) {
    if (dead) return;
    t += Math.min((now - (last || now)) / 1000, 0.1); last = now;
    if (btn && t > 0.9) btn.style.opacity = '0.5';
    if (t >= DUR) return finish();
    render(t); raf = requestAnimationFrame(frame);
  }
  function skip() { if (done || dead) return; if (onSkip) onSkip(); finish(); }
  function onKey(e) { if (skippable && e.key === 'Escape') skip(); }
  const ro = new ResizeObserver(() => { layout(); if (done) solid(); });

  layout(); ro.observe(host);
  const reduce = reducedMotion != null ? reducedMotion : window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) { queueMicrotask(() => { if (!dead) finish(); }); }
  else {
    if (skippable) {
      btn = document.createElement('button'); btn.type = 'button'; btn.textContent = 'Skip'; btn.setAttribute('aria-label', 'Skip intro');
      btn.style.cssText = 'position:absolute;right:max(14px,env(safe-area-inset-right));bottom:max(14px,env(safe-area-inset-bottom));padding:12px 14px;background:none;border:0;color:#F3E4CF;font:500 11px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.2em;text-transform:uppercase;cursor:pointer;opacity:0;transition:opacity .6s;-webkit-tap-highlight-color:transparent';
      btn.onmouseenter = () => { btn.style.opacity = '0.95'; }; btn.onmouseleave = () => { btn.style.opacity = '0.5'; };
      btn.onclick = skip; host.appendChild(btn); window.addEventListener('keydown', onKey);
    }
    if (!manual) raf = requestAnimationFrame(frame);
  }
  return {
    renderAt(rt) { render(rt); },
    skip,
    destroy() { dead = true; cancelAnimationFrame(raf); ro.disconnect(); window.removeEventListener('keydown', onKey); cv.remove(); if (btn) btn.remove(); if (lockScroll) document.documentElement.style.overflow = prevOverflow; },
  };
}

/**
 * <SecondActIntro onComplete={() => ...} />
 * Fullscreen ~6s opening film. Holds the solid #E52232 frame and fires onComplete once.
 * Props: onComplete, onSkip, skippable (default true), replayKey (change to replay), zIndex, className, style.
 * Respects prefers-reduced-motion (jumps straight to the red frame, then calls onComplete).
 */
export default function SecondActIntro({ onComplete, onSkip, skippable = true, replayKey = 0, zIndex = 9999, className, style }) {
  const ref = useRef(null);
  const cb = useRef({ onComplete, onSkip });
  cb.current = { onComplete, onSkip };
  useEffect(() => {
    const api = createSecondActIntro(ref.current, {
      skippable,
      onComplete: () => cb.current.onComplete && cb.current.onComplete(),
      onSkip: () => cb.current.onSkip && cb.current.onSkip(),
    });
    return () => api.destroy();
  }, [replayKey, skippable]);
  return (
    <div ref={ref} className={className} role="img" aria-label="Second Act opening animation"
      style={{ position: 'fixed', inset: 0, zIndex, background: '#000', overflow: 'hidden', ...style }} />
  );
}
