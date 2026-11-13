// Turns the world data into Three.js meshes.
import * as THREE from 'three';
import { PLAZA_RADIUS, ROAD_WIDTH, WORLD_HALF } from './worldgen.js';
import { createRng } from './rng.js';

function canvasTexture(w, h, draw, repeat = true) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

function noise(ctx, w, h, base, spread, count, rng) {
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < count; i++) {
    const v = Math.floor(rng.range(-spread, spread));
    ctx.fillStyle = `rgba(${v > 0 ? 255 : 0},${v > 0 ? 255 : 0},${v > 0 ? 255 : 0},${Math.abs(v) / 255})`;
    ctx.fillRect(rng.range(0, w), rng.range(0, h), 2, 2);
  }
}

function roadTexture(rng) {
  return canvasTexture(128, 256, (ctx, w, h) => {
    noise(ctx, w, h, '#3b3d40', 40, 1500, rng);
    ctx.fillStyle = '#e9e9e2';
    ctx.fillRect(5, 0, 4, h);
    ctx.fillRect(w - 9, 0, 4, h);
    ctx.fillStyle = '#f2d65a';
    ctx.fillRect(w / 2 - 2, 0, 4, h * 0.55);
  });
}

function ribbon(points, width, y) {
  const pos = [];
  const uv = [];
  const idx = [];
  let v = 0;
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const a = points[Math.max(0, i - 1)];
    const b = points[Math.min(points.length - 1, i + 1)];
    let dx = b.x - a.x;
    let dz = b.z - a.z;
    const l = Math.hypot(dx, dz) || 1;
    dx /= l;
    dz /= l;
    const nx = dz * (width / 2);
    const nz = -dx * (width / 2);
    if (i > 0) v += Math.hypot(p.x - points[i - 1].x, p.z - points[i - 1].z) / 18;
    pos.push(p.x + nx, y, p.z + nz, p.x - nx, y, p.z - nz);
    uv.push(0, v, 1, v);
    if (i > 0) {
      const k = i * 2;
      idx.push(k - 2, k, k - 1, k - 1, k, k + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

export function makeLabel(text, { color = '#ffffff', bg = 'rgba(20,28,38,0.78)', scale = 1 } = {}) {
  const c = document.createElement('canvas');
  const ctx = c.getContext('2d');
  ctx.font = 'bold 56px sans-serif';
  const w = Math.ceil(ctx.measureText(text).width) + 60;
  c.width = w;
  c.height = 96;
  ctx.font = 'bold 56px sans-serif';
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.roundRect(0, 0, w, 96, 24);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, w / 2, 50);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }));
  s.scale.set((w / 96) * 6 * scale, 6 * scale, 1);
  s.renderOrder = 10;
  return s;
}

function padMesh(pad, color, label) {
  const g = new THREE.Group();
  const tex = canvasTexture(
    128,
    180,
    (ctx, w, h) => {
      ctx.fillStyle = '#4a4c50';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = color;
      ctx.lineWidth = 8;
      ctx.strokeRect(6, 6, w - 12, h - 12);
      ctx.fillStyle = color;
      ctx.font = 'bold 30px sans-serif';
      ctx.textAlign = 'center';
      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.rotate(Math.PI);
      ctx.fillText(label, 0, 10);
      ctx.restore();
    },
    false,
  );
  const m = new THREE.Mesh(new THREE.PlaneGeometry(pad.w, pad.l), new THREE.MeshLambertMaterial({ map: tex }));
  m.rotation.x = -Math.PI / 2;
  m.rotation.z = pad.angle;
  m.position.set(pad.x, 0.07, pad.z);
  g.add(m);
  return g;
}

function stationProps(pad) {
  const g = new THREE.Group();
  g.position.set(pad.x, 0, pad.z);
  g.rotation.y = pad.angle;
  const white = new THREE.MeshLambertMaterial({ color: 0xf4f4f0 });
  const blue = new THREE.MeshLambertMaterial({ color: 0x2f6fd0 });
  const roof = new THREE.Mesh(new THREE.BoxGeometry(pad.w + 4, 0.7, pad.l * 0.7), white);
  roof.position.y = 6.5;
  g.add(roof);
  const band = new THREE.Mesh(new THREE.BoxGeometry(pad.w + 4.1, 0.35, pad.l * 0.7 + 0.1), blue);
  band.position.y = 6.3;
  g.add(band);
  for (const sx of [-1, 1]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.5, 6.3, 0.5), white);
    post.position.set(sx * (pad.w / 2 + 1.2), 3.15, 0);
    g.add(post);
    const pump = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.8, 1.2), blue);
    pump.position.set(sx * (pad.w / 2 + 1.2), 0.9, 2.2);
    g.add(pump);
  }
  return g;
}

function depotProps(pad) {
  const g = new THREE.Group();
  g.position.set(pad.x, 0, pad.z);
  g.rotation.y = pad.angle;
  const steel = new THREE.MeshLambertMaterial({ color: 0x8b98a5 });
  const orange = new THREE.MeshLambertMaterial({ color: 0xe48a2a });
  // Warehouse behind the pad, on the side away from the plaza center (local +z).
  const shed = new THREE.Mesh(new THREE.BoxGeometry(pad.w + 12, 6, 8), steel);
  shed.position.set(0, 3, pad.l / 2 + 14);
  g.add(shed);
  const door = new THREE.Mesh(new THREE.BoxGeometry(5, 4.5, 0.2), orange);
  door.position.set(0, 2.25, pad.l / 2 + 9.95);
  g.add(door);
  const crateMat = new THREE.MeshLambertMaterial({ color: 0xb98a4e });
  for (let i = 0; i < 4; i++) {
    const c = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.6, 1.6), crateMat);
    c.position.set(pad.w / 2 + 3 + (i % 2) * 1.8, 0.8 + Math.floor(i / 2) * 1.6, pad.l / 2 - 1);
    g.add(c);
  }
  return g;
}

export function buildWorldMeshes(world, scene) {
  const rng = createRng(7);

  // Ground.
  const grass = canvasTexture(256, 256, (ctx, w, h) => noise(ctx, w, h, '#6c9a4b', 30, 6000, rng));
  grass.repeat.set(300, 300);
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(WORLD_HALF * 2 + 2400, WORLD_HALF * 2 + 2400),
    new THREE.MeshLambertMaterial({ map: grass }),
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  // Roads.
  const roadMat = new THREE.MeshLambertMaterial({ map: roadTexture(rng) });
  const shoulderMat = new THREE.MeshLambertMaterial({ color: 0x9c8f72 });
  world.roads.forEach((r, i) => {
    const y = 0.03 + i * 0.002;
    scene.add(new THREE.Mesh(ribbon(r.points, ROAD_WIDTH + 3, 0.015 + i * 0.001), shoulderMat));
    scene.add(new THREE.Mesh(ribbon(r.points, ROAD_WIDTH, y), roadMat));
  });

  // Plazas, pads and props.
  const plazaTex = canvasTexture(256, 256, (ctx, w, h) => noise(ctx, w, h, '#45474b', 35, 3000, rng));
  plazaTex.repeat.set(8, 8);
  const plazaMat = new THREE.MeshLambertMaterial({ map: plazaTex });
  const curbMat = new THREE.MeshLambertMaterial({ color: 0xbdb7a8 });
  for (const t of world.towns) {
    const plaza = new THREE.Mesh(new THREE.CircleGeometry(PLAZA_RADIUS, 48), plazaMat);
    plaza.rotation.x = -Math.PI / 2;
    plaza.position.set(t.x, 0.06, t.z);
    scene.add(plaza);
    const ring = new THREE.Mesh(new THREE.RingGeometry(PLAZA_RADIUS, PLAZA_RADIUS + 1.5, 48), curbMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(t.x, 0.065, t.z);
    scene.add(ring);
    scene.add(padMesh(t.depot, '#f5c542', 'FRET'));
    scene.add(depotProps(t.depot));
    if (t.stationPad) {
      scene.add(padMesh(t.stationPad, '#4da3ff', 'STATION'));
      scene.add(stationProps(t.stationPad));
    }
    const label = makeLabel(t.name.toUpperCase(), { scale: 2.2 });
    label.position.set(t.x, 34, t.z);
    scene.add(label);
  }

  // Buildings as one instanced mesh, plus flat roofs.
  const boxGeo = new THREE.BoxGeometry(1, 1, 1);
  boxGeo.translate(0, 0.5, 0);
  const windowTex = canvasTexture(64, 64, (ctx, w, h) => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#9aa6b2';
    for (let x = 0; x < 2; x++) for (let y = 0; y < 2; y++) ctx.fillRect(8 + x * 32, 8 + y * 32, 18, 20);
  });
  const bMat = new THREE.MeshLambertMaterial({ map: windowTex });
  const bMesh = new THREE.InstancedMesh(boxGeo, bMat, world.buildings.length);
  const roofMesh = new THREE.InstancedMesh(boxGeo, new THREE.MeshLambertMaterial({ color: 0x5b5f66 }), world.buildings.length);
  const m4 = new THREE.Matrix4();
  const col = new THREE.Color();
  world.buildings.forEach((b, i) => {
    m4.makeScale(b.w, b.h, b.d).setPosition(b.x, 0, b.z);
    bMesh.setMatrixAt(i, m4);
    col.setHSL(b.hue * 0.15 + 0.05, 0.35, 0.72 + (b.hue % 0.1));
    bMesh.setColorAt(i, col);
    m4.makeScale(b.w + 0.6, 0.6, b.d + 0.6).setPosition(b.x, b.h, b.z);
    roofMesh.setMatrixAt(i, m4);
  });
  // Stretch the window texture to the facade size through the instance UVs is not possible;
  // repeat per building size class instead.
  windowTex.repeat.set(3, 4);
  scene.add(bMesh, roofMesh);

  // Trees.
  const trunkGeo = new THREE.CylinderGeometry(0.25, 0.35, 2.4, 6);
  trunkGeo.translate(0, 1.2, 0);
  const roundGeo = new THREE.IcosahedronGeometry(2.2, 0);
  roundGeo.translate(0, 4, 0);
  const pineGeo = new THREE.ConeGeometry(2, 6, 7);
  pineGeo.translate(0, 5, 0);
  const trunks = new THREE.InstancedMesh(trunkGeo, new THREE.MeshLambertMaterial({ color: 0x6b4a2f }), world.trees.length);
  const rounds = world.trees.filter((t) => t.kind === 'round');
  const pines = world.trees.filter((t) => t.kind === 'pine');
  const roundMesh = new THREE.InstancedMesh(roundGeo, new THREE.MeshLambertMaterial({ color: 0x4f8a3a, flatShading: true }), rounds.length);
  const pineMesh = new THREE.InstancedMesh(pineGeo, new THREE.MeshLambertMaterial({ color: 0x2f6b3c, flatShading: true }), pines.length);
  world.trees.forEach((t, i) => {
    m4.makeScale(t.scale, t.scale, t.scale).setPosition(t.x, 0, t.z);
    trunks.setMatrixAt(i, m4);
  });
  rounds.forEach((t, i) => {
    m4.makeScale(t.scale, t.scale, t.scale).setPosition(t.x, 0, t.z);
    roundMesh.setMatrixAt(i, m4);
  });
  pines.forEach((t, i) => {
    m4.makeScale(t.scale, t.scale, t.scale).setPosition(t.x, 0, t.z);
    pineMesh.setMatrixAt(i, m4);
  });
  scene.add(trunks, roundMesh, pineMesh);

  // Mountains around the map edge.
  const mountMat = new THREE.MeshLambertMaterial({ color: 0x7d8f7a, flatShading: true });
  const snowMat = new THREE.MeshLambertMaterial({ color: 0xf2f4f5, flatShading: true });
  for (let i = 0; i < 40; i++) {
    const a = (i / 40) * Math.PI * 2 + rng.range(-0.05, 0.05);
    const r = WORLD_HALF + rng.range(350, 700);
    const h = rng.range(180, 420);
    const rad = rng.range(260, 420);
    const m = new THREE.Mesh(new THREE.ConeGeometry(rad, h, 7), mountMat);
    m.position.set(Math.sin(a) * r * 1.05, h / 2 - 2, Math.cos(a) * r * 1.05);
    scene.add(m);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(rad * 0.25, h * 0.25, 7), snowMat);
    cap.position.set(m.position.x, h - h * 0.125 - 2, m.position.z);
    scene.add(cap);
  }

  // Delivery beacon: a tall translucent column over the target pad.
  const beacon = new THREE.Mesh(
    new THREE.CylinderGeometry(4, 4, 120, 20, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xffd34d, transparent: true, opacity: 0.28, depthWrite: false, side: THREE.DoubleSide }),
  );
  beacon.position.y = 60;
  beacon.visible = false;
  scene.add(beacon);
  return { beacon };
}
