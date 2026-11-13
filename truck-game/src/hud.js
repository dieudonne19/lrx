// HUD: dashboard, mission banner, minimap, toasts and the modal panel.
import { PLAZA_RADIUS, ROAD_WIDTH, WORLD_HALF } from './worldgen.js';

const $ = (id) => document.getElementById(id);

export const fmtMoney = (n) => `${Math.round(n).toLocaleString('fr-FR')} $`;
export const fmtClock = (min) => {
  const m = ((Math.floor(min) % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};
export const fmtDuration = (min) => {
  const m = Math.max(0, Math.floor(min));
  return m >= 60 ? `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')}` : `${m} min`;
};
export const fmtDist = (m) => (m >= 1000 ? `${(m / 1000).toFixed(1).replace('.', ',')} km` : `${Math.round(m / 10) * 10} m`);

const MAP_PX = 1024;
const MAP_SCALE = MAP_PX / (WORLD_HALF * 2); // px per meter

function renderMap(world) {
  const c = document.createElement('canvas');
  c.width = c.height = MAP_PX;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#2e4527';
  ctx.fillRect(0, 0, MAP_PX, MAP_PX);
  const tx = (x) => (x + WORLD_HALF) * MAP_SCALE;
  // North (+z) is up on the map, +x is to the left so the map matches the 3D view.
  const px = (x) => MAP_PX - tx(x);
  const pz = (z) => MAP_PX - tx(z);
  ctx.fillStyle = 'rgba(30,60,30,0.9)';
  for (const t of world.trees) ctx.fillRect(px(t.x) - 1, pz(t.z) - 1, 2, 2);
  ctx.fillStyle = '#8c8577';
  for (const b of world.buildings) ctx.fillRect(px(b.maxX), pz(b.maxZ), b.w * MAP_SCALE, b.d * MAP_SCALE);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const [color, width] of [
    ['#1d1f22', ROAD_WIDTH * MAP_SCALE + 4],
    ['#d7d2c4', ROAD_WIDTH * MAP_SCALE + 1],
  ]) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    for (const r of world.roads) {
      ctx.beginPath();
      r.points.forEach((p, i) => (i ? ctx.lineTo(px(p.x), pz(p.z)) : ctx.moveTo(px(p.x), pz(p.z))));
      ctx.stroke();
    }
  }
  for (const t of world.towns) {
    ctx.fillStyle = '#d7d2c4';
    ctx.beginPath();
    ctx.arc(px(t.x), pz(t.z), PLAZA_RADIUS * MAP_SCALE + 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f5c542';
    ctx.fillRect(px(t.depot.x) - 3, pz(t.depot.z) - 3, 6, 6);
    if (t.stationPad) {
      ctx.fillStyle = '#4da3ff';
      ctx.fillRect(px(t.stationPad.x) - 3, pz(t.stationPad.z) - 3, 6, 6);
    }
  }
  return { canvas: c, px, pz };
}

function drawLabels(ctx, world, map, scale, ox, oy) {
  ctx.font = `bold ${Math.round(13 * Math.max(1, scale))}px sans-serif`;
  ctx.textAlign = 'center';
  for (const t of world.towns) {
    const x = (map.px(t.x) - ox) * scale;
    const y = (map.pz(t.z) - oy) * scale - 14;
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(0,0,0,0.7)';
    ctx.strokeText(t.name, x, y);
    ctx.fillStyle = '#fff';
    ctx.fillText(t.name, x, y);
  }
}

export function createHud(world) {
  const map = renderMap(world);
  const mini = $('minimap');
  const mctx = mini.getContext('2d');
  const panel = $('panel');
  let panelHandler = null;

  panel.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (!el || el.disabled) return;
    if (el.dataset.action === 'close') {
      closePanel();
      return;
    }
    panelHandler?.(el.dataset.action, el.dataset.arg, el);
  });

  function closePanel() {
    panel.hidden = true;
    const h = panelHandler;
    panelHandler = null;
    h?.('closed');
  }

  return {
    update({ money, clock, speed, gear, fuel, tank, damage }) {
      $('money').textContent = fmtMoney(money);
      $('clock').textContent = fmtClock(clock);
      $('speed').textContent = Math.round(Math.abs(speed) * 3.6);
      $('gear').textContent = gear < 0 ? 'R' : gear;
      const f = $('fuel-bar');
      f.style.width = `${(fuel / tank) * 100}%`;
      f.classList.toggle('low', fuel / tank < 0.2);
      $('damage-bar').style.width = `${damage}%`;
    },
    mission(title, sub, arrowAngle) {
      $('mission-title').textContent = title;
      $('mission-sub').innerHTML = sub;
      const a = $('mission-arrow');
      a.classList.toggle('off', arrowAngle == null);
      a.style.transform = arrowAngle == null ? '' : `rotate(${arrowAngle}rad)`;
    },
    action(label) {
      const b = $('btn-action');
      b.hidden = !label;
      if (label) b.textContent = label;
    },
    toast(text, kind = '') {
      const t = $('toast');
      const d = document.createElement('div');
      d.textContent = text;
      if (kind) d.className = kind;
      t.appendChild(d);
      while (t.children.length > 3) t.firstChild.remove();
      setTimeout(() => d.remove(), 2900);
    },
    /** Minimap centered on the truck, rotating so the truck always points up. */
    minimap(x, z, heading, target) {
      const W = mini.width;
      const zoom = 2.2; // minimap px per map px
      mctx.save();
      mctx.fillStyle = '#2e4527';
      mctx.fillRect(0, 0, W, W);
      mctx.translate(W / 2, W / 2);
      mctx.rotate(heading);
      mctx.scale(zoom, zoom);
      mctx.translate(-map.px(x), -map.pz(z));
      mctx.drawImage(map.canvas, 0, 0);
      if (target) {
        mctx.fillStyle = '#ff3b30';
        mctx.beginPath();
        mctx.arc(map.px(target.x), map.pz(target.z), 6, 0, Math.PI * 2);
        mctx.fill();
      }
      mctx.restore();
      if (target) {
        // Edge marker when the target is outside the minimap.
        const dx = map.px(target.x) - map.px(x);
        const dy = map.pz(target.z) - map.pz(z);
        const r = Math.hypot(dx, dy) * zoom;
        if (r > W / 2 - 8) {
          const ang = Math.atan2(dy, dx) + heading;
          mctx.fillStyle = '#ff3b30';
          mctx.beginPath();
          mctx.arc(W / 2 + Math.cos(ang) * (W / 2 - 9), W / 2 + Math.sin(ang) * (W / 2 - 9), 6, 0, Math.PI * 2);
          mctx.fill();
        }
      }
      mctx.fillStyle = '#ffffff';
      mctx.strokeStyle = '#1a1a1a';
      mctx.lineWidth = 2;
      mctx.beginPath();
      mctx.moveTo(W / 2, W / 2 - 9);
      mctx.lineTo(W / 2 + 6, W / 2 + 7);
      mctx.lineTo(W / 2, W / 2 + 3);
      mctx.lineTo(W / 2 - 6, W / 2 + 7);
      mctx.closePath();
      mctx.fill();
      mctx.stroke();
    },
    /** Full map as a data URL with the truck and the target drawn on top. */
    bigMap(x, z, target) {
      const c = document.createElement('canvas');
      c.width = c.height = 640;
      const ctx = c.getContext('2d');
      const s = 640 / MAP_PX;
      ctx.drawImage(map.canvas, 0, 0, 640, 640);
      drawLabels(ctx, world, map, s, 0, 0);
      if (target) {
        ctx.fillStyle = '#ff3b30';
        ctx.beginPath();
        ctx.arc(map.px(target.x) * s, map.pz(target.z) * s, 8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(map.px(x) * s, map.pz(z) * s, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      return c.toDataURL();
    },
    openPanel(title, html, handler) {
      $('panel-title').textContent = title;
      $('panel-body').innerHTML = html;
      panelHandler = handler;
      panel.hidden = false;
    },
    setPanelBody(html) {
      $('panel-body').innerHTML = html;
    },
    closePanel,
    get panelOpen() {
      return !panel.hidden;
    },
  };
}
