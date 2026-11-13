// Low-poly meshes for the tractor, the trailer and traffic cars, built from boxes and cylinders.
import * as THREE from 'three';
import { TRUCK } from './physics.js';

const mat = (color, extra = {}) => new THREE.MeshLambertMaterial({ color, ...extra });
const box = (w, h, d, material) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);

const wheelGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.45, 14);
wheelGeo.rotateZ(Math.PI / 2);
const wheelMat = mat(0x1d1f22);
const rimMat = mat(0xb9bec4);
const rimGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.47, 10);
rimGeo.rotateZ(Math.PI / 2);

function wheel() {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(wheelGeo, wheelMat));
  g.add(new THREE.Mesh(rimGeo, rimMat));
  return g;
}

function shadowBlob(w, l) {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d');
  const grd = ctx.createRadialGradient(32, 32, 4, 32, 32, 32);
  grd.addColorStop(0, 'rgba(0,0,0,0.55)');
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, 64, 64);
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w, l),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }),
  );
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.06;
  return m;
}

/**
 * Tractor unit. Origin = midpoint between its axles on the ground, facing +z.
 * Returns { group, paint, frontWheels, wheels, headlights, brakeLights }.
 */
export function createTractor(color = 0xd23c2f) {
  const group = new THREE.Group();
  const paint = mat(color);
  const dark = mat(0x2a2d31);
  const chrome = mat(0xcfd3d8);
  const glass = mat(0x26394a, { emissive: 0x0a1018 });
  const half = TRUCK.wheelbase / 2;

  const chassis = box(2.1, 0.45, 7.2, dark);
  chassis.position.set(0, 0.85, 0.2);
  group.add(chassis);

  const cab = box(2.5, 2.4, 2.4, paint);
  cab.position.set(0, 2.25, half + 0.9);
  group.add(cab);
  const roof = box(2.5, 0.9, 1.9, paint);
  roof.position.set(0, 3.85, half + 0.65);
  group.add(roof);
  const windshield = box(2.3, 1.05, 0.08, glass);
  windshield.position.set(0, 2.85, half + 2.12);
  group.add(windshield);
  for (const sx of [-1.26, 1.26]) {
    const side = box(0.06, 0.9, 1.1, glass);
    side.position.set(sx, 2.85, half + 1.35);
    group.add(side);
    const mirror = box(0.12, 0.5, 0.2, dark);
    mirror.position.set(sx * 1.12, 2.9, half + 2.15);
    group.add(mirror);
  }
  const grille = box(2.1, 1.0, 0.1, chrome);
  grille.position.set(0, 1.55, half + 2.12);
  group.add(grille);
  const bumper = box(2.5, 0.4, 0.3, dark);
  bumper.position.set(0, 0.85, half + 2.1);
  group.add(bumper);

  const headMat = new THREE.MeshBasicMaterial({ color: 0xfff3c4 });
  const headlights = [];
  for (const sx of [-0.95, 0.95]) {
    const h = box(0.45, 0.25, 0.08, headMat);
    h.position.set(sx, 1.15, half + 2.18);
    group.add(h);
    headlights.push(h);
  }
  const brakeMat = new THREE.MeshBasicMaterial({ color: 0x5a0d0d });
  for (const sx of [-0.9, 0.9]) {
    const b = box(0.3, 0.2, 0.06, brakeMat);
    b.position.set(sx, 1.0, -3.42);
    group.add(b);
  }

  // Tanks, exhaust stacks and fifth wheel.
  for (const sx of [-1.15, 1.15]) {
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 1.3, 12), chrome);
    tank.rotation.x = Math.PI / 2;
    tank.position.set(sx, 0.75, half - 1.2);
    group.add(tank);
    const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 2.2, 8), chrome);
    stack.position.set(sx * 1.05, 3.2, half - 0.45);
    group.add(stack);
  }
  const fifth = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.15, 16), dark);
  fifth.position.set(0, 1.15, -half + TRUCK.hitchOffset);
  group.add(fifth);

  const frontWheels = [];
  const wheels = [];
  for (const sx of [-1.05, 1.05]) {
    const pivot = new THREE.Group();
    pivot.position.set(sx, 0.55, half);
    const w = wheel();
    pivot.add(w);
    group.add(pivot);
    frontWheels.push(pivot);
    wheels.push(w);
    for (const z of [-half - 0.3, -half + 0.85]) {
      const r = wheel();
      r.position.set(sx, 0.55, z);
      group.add(r);
      wheels.push(r);
    }
  }
  group.add(shadowBlob(3.6, 9));
  return { group, paint, frontWheels, wheels, headlights, brakeMat };
}

/** Trailer. Origin = kingpin on the ground, the body extends toward -z. */
export function createTrailer(cargoColor = 0xe8edf2) {
  const group = new THREE.Group();
  const bodyMat = mat(cargoColor);
  const dark = mat(0x2a2d31);
  const L = TRUCK.trailerLength;
  const body = box(2.55, 2.9, L + 3.2, bodyMat);
  body.position.set(0, 2.75, -(L + 3.2) / 2 + 1.2);
  group.add(body);
  const stripe = box(2.57, 0.25, L + 3.2, mat(0x2e4057));
  stripe.position.set(0, 1.45, body.position.z);
  group.add(stripe);
  const frame = box(1.8, 0.3, L + 2.6, dark);
  frame.position.set(0, 1.15, body.position.z);
  group.add(frame);
  const legs = box(1.9, 0.9, 0.2, dark);
  legs.position.set(0, 0.7, -1.8);
  group.add(legs);
  const wheels = [];
  for (const sx of [-1.05, 1.05]) {
    for (const dz of [-0.65, 0.65]) {
      const w = wheel();
      w.position.set(sx, 0.55, -L + dz);
      group.add(w);
      wheels.push(w);
    }
  }
  const lights = new THREE.MeshBasicMaterial({ color: 0x8a1111 });
  for (const sx of [-1.0, 1.0]) {
    const l = box(0.35, 0.2, 0.06, lights);
    l.position.set(sx, 1.25, -L - 0.82);
    group.add(l);
  }
  const shadow = shadowBlob(3.6, L + 4);
  shadow.position.z = -L / 2;
  group.add(shadow);
  return { group, bodyMat, wheels, lights };
}

const CAR_COLORS = [0x3d6fb6, 0xf0f0f0, 0x222428, 0xc8a13a, 0x7a2f2f, 0x5c8f6a, 0x9aa1a8, 0xd86f2a];

export function createCar(i) {
  const group = new THREE.Group();
  const paint = mat(CAR_COLORS[i % CAR_COLORS.length]);
  const glass = mat(0x2b3a48);
  const isVan = i % 5 === 0;
  const bodyLen = isVan ? 5.2 : 4.3;
  const body = box(1.85, isVan ? 1.6 : 0.75, bodyLen, paint);
  body.position.y = isVan ? 1.25 : 0.75;
  group.add(body);
  if (!isVan) {
    const top = box(1.6, 0.6, 2.2, glass);
    top.position.set(0, 1.4, -0.2);
    group.add(top);
  } else {
    const ws = box(1.7, 0.6, 0.06, glass);
    ws.position.set(0, 1.55, bodyLen / 2 + 0.01);
    group.add(ws);
  }
  const head = new THREE.MeshBasicMaterial({ color: 0xfff1c2 });
  const tail = new THREE.MeshBasicMaterial({ color: 0x8a1111 });
  for (const sx of [-0.65, 0.65]) {
    const h = box(0.35, 0.15, 0.05, head);
    h.position.set(sx, 0.8, bodyLen / 2 + 0.01);
    group.add(h);
    const t = box(0.35, 0.15, 0.05, tail);
    t.position.set(sx, 0.85, -bodyLen / 2 - 0.01);
    group.add(t);
  }
  for (const sx of [-0.9, 0.9]) {
    for (const z of [-bodyLen / 2 + 0.85, bodyLen / 2 - 0.85]) {
      const w = wheel();
      w.scale.setScalar(0.62);
      w.position.set(sx, 0.36, z);
      group.add(w);
    }
  }
  group.add(shadowBlob(2.6, bodyLen + 1));
  return { group, length: bodyLen };
}
