// World layout as plain data: towns, curved roads between them, buildings, trees and the
// spatial queries the game needs (off-road test, collisions, route distances).
import { createRng } from './rng.js';

export const ROAD_WIDTH = 11;
export const PLAZA_RADIUS = 52;
export const WORLD_HALF = 1900;

const TOWN_DEFS = [
  { id: 'port', name: 'Port-Sud', x: 0, z: -1150, size: 1.3, station: true },
  { id: 'valrouge', name: 'Valrouge', x: -950, z: -520, size: 1.0, station: false },
  { id: 'montclair', name: 'Mont-Clair', x: 900, z: -430, size: 1.0, station: true },
  { id: 'rivebelle', name: 'Rivebelle', x: 150, z: 250, size: 1.4, station: true },
  { id: 'pins', name: 'Les Pins', x: -1050, z: 650, size: 0.8, station: true },
  { id: 'sabliere', name: 'Sablière', x: 1050, z: 900, size: 0.9, station: false },
  { id: 'bourg', name: 'Bourg-Neuf', x: -120, z: 1300, size: 1.1, station: true },
];

const ROAD_DEFS = [
  ['port', 'valrouge'],
  ['port', 'montclair'],
  ['port', 'rivebelle'],
  ['valrouge', 'rivebelle'],
  ['valrouge', 'pins'],
  ['montclair', 'rivebelle'],
  ['montclair', 'sabliere'],
  ['rivebelle', 'pins'],
  ['rivebelle', 'sabliere'],
  ['rivebelle', 'bourg'],
  ['pins', 'bourg'],
  ['bourg', 'sabliere'],
];

function catmull(p0, p1, p2, p3, t) {
  const t2 = t * t;
  const t3 = t2 * t;
  const f = (a, b, c, d) =>
    0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
  return { x: f(p0.x, p1.x, p2.x, p3.x), z: f(p0.z, p1.z, p2.z, p3.z) };
}

/** Resample a polyline every `step` meters. */
function resample(points, step) {
  const out = [points[0]];
  let carry = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const len = Math.hypot(b.x - a.x, b.z - a.z);
    let d = step - carry;
    while (d <= len) {
      const t = d / len;
      out.push({ x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t });
      d += step;
    }
    carry = len - (d - step);
  }
  const last = points[points.length - 1];
  const tail = out[out.length - 1];
  if (Math.hypot(last.x - tail.x, last.z - tail.z) > step * 0.3) out.push(last);
  else out[out.length - 1] = last;
  return out;
}

function buildRoad(rng, id, a, b) {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const len = Math.hypot(dx, dz);
  const px = -dz / len;
  const pz = dx / len;
  const ctrl = [{ x: a.x, z: a.z }];
  const n = Math.max(2, Math.round(len / 260));
  for (let i = 1; i < n; i++) {
    const t = i / n;
    const off = rng.range(-1, 1) * Math.min(160, len * 0.12);
    ctrl.push({ x: a.x + dx * t + px * off, z: a.z + dz * t + pz * off });
  }
  ctrl.push({ x: b.x, z: b.z });
  const dense = [];
  for (let i = 0; i < ctrl.length - 1; i++) {
    const p0 = ctrl[Math.max(0, i - 1)];
    const p3 = ctrl[Math.min(ctrl.length - 1, i + 2)];
    for (let k = 0; k < 20; k++) dense.push(catmull(p0, ctrl[i], ctrl[i + 1], p3, k / 20));
  }
  dense.push({ x: b.x, z: b.z });
  const points = resample(dense, 5);
  const cum = [0];
  for (let i = 1; i < points.length; i++) {
    cum.push(cum[i - 1] + Math.hypot(points[i].x - points[i - 1].x, points[i].z - points[i - 1].z));
  }
  return { id, a: a.id, b: b.id, points, cum, length: cum[cum.length - 1] };
}

/** Uniform grid that buckets items by the cells their bounding box covers. */
function createGrid(cell) {
  const map = new Map();
  const key = (i, j) => i * 100003 + j;
  return {
    add(item, minX, minZ, maxX, maxZ) {
      for (let i = Math.floor(minX / cell); i <= Math.floor(maxX / cell); i++) {
        for (let j = Math.floor(minZ / cell); j <= Math.floor(maxZ / cell); j++) {
          const k = key(i, j);
          if (!map.has(k)) map.set(k, []);
          map.get(k).push(item);
        }
      }
    },
    query(x, z, r) {
      const found = new Set();
      for (let i = Math.floor((x - r) / cell); i <= Math.floor((x + r) / cell); i++) {
        for (let j = Math.floor((z - r) / cell); j <= Math.floor((z + r) / cell); j++) {
          const list = map.get(key(i, j));
          if (list) for (const it of list) found.add(it);
        }
      }
      return found;
    },
  };
}

function segmentDistance(x, z, ax, az, bx, bz) {
  const dx = bx - ax;
  const dz = bz - az;
  const l2 = dx * dx + dz * dz;
  const t = l2 > 0 ? Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l2)) : 0;
  return Math.hypot(x - (ax + dx * t), z - (az + dz * t));
}

/** Pad facing the plaza center, placed in the widest gap between roads leaving the town. */
function placePads(town, roads) {
  const angles = [];
  for (const r of roads) {
    if (r.a !== town.id && r.b !== town.id) continue;
    const pts = r.a === town.id ? r.points : [...r.points].reverse();
    const p = pts[Math.min(pts.length - 1, 12)];
    angles.push(Math.atan2(p.x - town.x, p.z - town.z));
  }
  angles.sort((a, b) => a - b);
  const gaps = angles.map((a, i) => {
    const next = i === angles.length - 1 ? angles[0] + Math.PI * 2 : angles[i + 1];
    return { mid: a + (next - a) / 2, size: next - a };
  });
  gaps.sort((a, b) => b.size - a.size);
  const pad = (angle, kind) => {
    const r = PLAZA_RADIUS - 16;
    return {
      kind,
      town: town.id,
      x: town.x + Math.sin(angle) * r,
      z: town.z + Math.cos(angle) * r,
      angle, // the pad's long side points to the plaza center
      w: 14,
      l: 20,
    };
  };
  town.depot = pad(gaps[0].mid, 'depot');
  if (town.station) {
    const g = gaps[1] ?? { mid: gaps[0].mid + Math.PI };
    // Keep the station away from the depot when the town has a single big gap.
    const angle = gaps[1] && gaps[1].size > 0.9 ? g.mid : gaps[0].mid + Math.min(1.1, gaps[0].size / 3);
    town.stationPad = pad(angle, 'station');
  }
}

export function generateWorld(seed = 20261113) {
  const rng = createRng(seed);
  const towns = TOWN_DEFS.map((t) => ({ ...t }));
  const byId = Object.fromEntries(towns.map((t) => [t.id, t]));
  const roads = ROAD_DEFS.map(([a, b], i) => buildRoad(rng, i, byId[a], byId[b]));

  const roadGrid = createGrid(40);
  for (const road of roads) {
    for (let i = 1; i < road.points.length; i++) {
      const a = road.points[i - 1];
      const b = road.points[i];
      const seg = { road, i, ax: a.x, az: a.z, bx: b.x, bz: b.z };
      roadGrid.add(seg, Math.min(a.x, b.x), Math.min(a.z, b.z), Math.max(a.x, b.x), Math.max(a.z, b.z));
    }
  }
  const distanceToRoad = (x, z, r = 30) => {
    let best = Infinity;
    for (const s of roadGrid.query(x, z, r)) best = Math.min(best, segmentDistance(x, z, s.ax, s.az, s.bx, s.bz));
    return best;
  };

  for (const t of towns) placePads(t, roads);

  // Solid props on the pads (see world-mesh.js): the warehouse, crates, the station posts and pumps.
  const colliderGrid = createGrid(30);
  const addCircle = (x, z, r) => {
    const c = { x, z, r, type: 'circle' };
    colliderGrid.add(c, x - r, z - r, x + r, z + r);
  };
  const local = (pad, lx, lz) => ({
    x: pad.x + lx * Math.cos(pad.angle) + lz * Math.sin(pad.angle),
    z: pad.z - lx * Math.sin(pad.angle) + lz * Math.cos(pad.angle),
  });
  for (const t of towns) {
    const d = t.depot;
    for (let lx = -(d.w + 12) / 2 + 2; lx <= (d.w + 12) / 2 - 2; lx += 3) {
      const p = local(d, lx, d.l / 2 + 14);
      addCircle(p.x, p.z, 3.5);
    }
    const crates = local(d, d.w / 2 + 3.9, d.l / 2 - 1);
    addCircle(crates.x, crates.z, 1.8);
    t.shed = local(d, 0, d.l / 2 + 14);
    if (t.stationPad) {
      const sp = t.stationPad;
      for (const sx of [-1, 1]) {
        for (const lz of [0, 2.2]) {
          const p = local(sp, sx * (sp.w / 2 + 1.2), lz);
          addCircle(p.x, p.z, 0.8);
        }
      }
    }
  }

  const nearTown = (x, z, r) => towns.some((t) => Math.hypot(x - t.x, z - t.z) < r);

  // Buildings around each plaza.
  const buildings = [];
  for (const t of towns) {
    const count = Math.round(34 * t.size);
    let tries = 0;
    while (buildings.filter((b) => b.town === t.id).length < count && tries++ < 600) {
      const ang = rng.range(0, Math.PI * 2);
      const rad = rng.range(PLAZA_RADIUS + 14, PLAZA_RADIUS + 70 + 60 * t.size);
      const x = t.x + Math.sin(ang) * rad;
      const z = t.z + Math.cos(ang) * rad;
      const w = rng.range(8, 18);
      const d = rng.range(8, 18);
      const h = rng.range(5, 10 + 16 * t.size * (1 - (rad - PLAZA_RADIUS) / 200));
      const half = Math.max(w, d) / 2;
      if (distanceToRoad(x, z, 40) < ROAD_WIDTH / 2 + half + 3) continue;
      if (Math.hypot(x - t.shed.x, z - t.shed.z) < half + 18) continue;
      const box = { minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2 };
      const overlap = buildings.some(
        (b) => b.minX < box.maxX + 3 && b.maxX > box.minX - 3 && b.minZ < box.maxZ + 3 && b.maxZ > box.minZ - 3,
      );
      if (overlap) continue;
      const b = { ...box, x, z, w, d, h, town: t.id, hue: rng.next(), type: 'box' };
      buildings.push(b);
      colliderGrid.add(b, box.minX, box.minZ, box.maxX, box.maxZ);
    }
  }

  // Trees in the countryside.
  const trees = [];
  for (let i = 0; i < 2600 && trees.length < 1400; i++) {
    const x = rng.range(-WORLD_HALF, WORLD_HALF);
    const z = rng.range(-WORLD_HALF, WORLD_HALF);
    if (nearTown(x, z, PLAZA_RADIUS + 150)) continue;
    if (distanceToRoad(x, z, 30) < ROAD_WIDTH / 2 + 6) continue;
    const tree = { x, z, r: 0.9, scale: rng.range(0.8, 1.6), kind: rng.next() < 0.35 ? 'pine' : 'round', type: 'circle' };
    trees.push(tree);
    colliderGrid.add(tree, x - 1, z - 1, x + 1, z + 1);
  }

  // Road graph and shortest route distances between towns.
  const adj = Object.fromEntries(towns.map((t) => [t.id, []]));
  for (const r of roads) {
    adj[r.a].push({ to: r.b, road: r });
    adj[r.b].push({ to: r.a, road: r });
  }
  const routeCache = new Map();
  const routeDistance = (from, to) => {
    const k = `${from}>${to}`;
    if (routeCache.has(k)) return routeCache.get(k);
    const dist = Object.fromEntries(towns.map((t) => [t.id, Infinity]));
    dist[from] = 0;
    const open = new Set(towns.map((t) => t.id));
    while (open.size) {
      let u = null;
      for (const id of open) if (u === null || dist[id] < dist[u]) u = id;
      open.delete(u);
      for (const e of adj[u]) dist[e.to] = Math.min(dist[e.to], dist[u] + e.road.length);
    }
    routeCache.set(k, Math.round(dist[to]));
    return Math.round(dist[to]);
  };

  return {
    towns,
    byId,
    roads,
    adj,
    buildings,
    trees,
    distanceToRoad,
    routeDistance,
    isOffroad(x, z) {
      if (nearTown(x, z, PLAZA_RADIUS)) return false;
      return distanceToRoad(x, z, 20) > ROAD_WIDTH / 2 + 0.8;
    },
    collidersNear(x, z, r) {
      return colliderGrid.query(x, z, r);
    },
  };
}

/** Push a circle out of the world's obstacles. Returns the push vector and whether it hit. */
export function resolveCircle(world, x, z, r) {
  let px = 0;
  let pz = 0;
  let hit = false;
  for (const c of world.collidersNear(x, z, r + 2)) {
    if (c.type === 'circle') {
      const dx = x + px - c.x;
      const dz = z + pz - c.z;
      const d = Math.hypot(dx, dz);
      const min = r + c.r;
      if (d < min && d > 1e-6) {
        px += (dx / d) * (min - d);
        pz += (dz / d) * (min - d);
        hit = true;
      }
    } else {
      const cx = Math.max(c.minX, Math.min(x + px, c.maxX));
      const cz = Math.max(c.minZ, Math.min(z + pz, c.maxZ));
      const dx = x + px - cx;
      const dz = z + pz - cz;
      const d = Math.hypot(dx, dz);
      if (d < r) {
        if (d > 1e-6) {
          px += (dx / d) * (r - d);
          pz += (dz / d) * (r - d);
        } else {
          // Center inside the box: push out along the shortest axis.
          const opts = [
            [c.minX - r - (x + px), 0],
            [c.maxX + r - (x + px), 0],
            [0, c.minZ - r - (z + pz)],
            [0, c.maxZ + r - (z + pz)],
          ];
          opts.sort((a, b) => Math.abs(a[0] + a[1]) - Math.abs(b[0] + b[1]));
          px += opts[0][0];
          pz += opts[0][1];
        }
        hit = true;
      }
    }
  }
  return { px, pz, hit };
}

/** Is the point inside a pad (rotated rectangle)? */
export function inPad(pad, x, z, margin = 0) {
  const dx = x - pad.x;
  const dz = z - pad.z;
  const c = Math.cos(pad.angle);
  const s = Math.sin(pad.angle);
  const along = dx * s + dz * c; // toward the plaza edge
  const across = dx * c - dz * s;
  return Math.abs(along) <= pad.l / 2 + margin && Math.abs(across) <= pad.w / 2 + margin;
}
