// Camion Express: game loop, jobs, stations, collisions, camera and day/night.
import * as THREE from 'three';
import { createAudio } from './audio.js';
import { createHud, fmtClock, fmtDist, fmtDuration, fmtMoney } from './hud.js';
import { createInput } from './input.js';
import { CARGOS, generateOffers, payout } from './jobs.js';
import { createTractor, createTrailer } from './models.js';
import {
  ENGINE_LEVELS,
  TANK_LEVELS,
  TRUCK,
  createTruckState,
  hitchPosition,
  stepTruck,
  wrapAngle,
} from './physics.js';
import { createRng } from './rng.js';
import { DEFAULT_SAVE, loadSave, resetSave, writeSave } from './save.js';
import { createTraffic } from './traffic.js';
import { buildWorldMeshes } from './world-mesh.js';
import { WORLD_HALF, generateWorld, inPad, resolveCircle } from './worldgen.js';

const FUEL_PRICE = 2.2; // $ per liter
const REPAIR_PRICE = 28; // $ per damage point
const TOW_PRICE = 900;
const ENGINE_PRICES = [0, 9000, 20000, 38000];
const TANK_PRICES = [0, 6000, 15000];
const PAINT_PRICE = 600;
const PAINTS = [0xd23c2f, 0x2f6fd0, 0xf2b631, 0x2e9d5b, 0xf4f4f0, 0x23262b, 0x8a3fc4, 0xe86f2a];
const GAME_MINUTES_PER_SECOND = 1;

// ---------------------------------------------------------------------------- setup

const canvas = document.getElementById('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const skyDay = new THREE.Color(0x9cc9ee);
const skyDusk = new THREE.Color(0xf0a167);
const skyNight = new THREE.Color(0x0b1424);
scene.background = skyDay.clone();
scene.fog = new THREE.Fog(skyDay.clone(), 250, 1400);

const camera = new THREE.PerspectiveCamera(62, 1, 0.5, 4000);
const hemiDay = new THREE.Color(0xdfefff);
const hemiNight = new THREE.Color(0x6a7fb0);
const hemi = new THREE.HemisphereLight(0xdfefff, 0x4a5a3a, 1.1);
const sun = new THREE.DirectionalLight(0xfff2d6, 1.6);
sun.position.set(400, 800, 200);
scene.add(hemi, sun);

const world = generateWorld();
const { beacon } = buildWorldMeshes(world, scene);
const traffic = createTraffic(world, scene, createRng(99));
const hud = createHud(world);
const input = createInput();
const audio = createAudio();

let save = loadSave();

const tractor = createTractor(save.color);
scene.add(tractor.group);
let trailer = null;

// Headlights: one spotlight, switched on at night.
const headlight = new THREE.SpotLight(0xfff1cc, 0, 90, 0.55, 0.5, 1.2);
headlight.position.set(0, 2.2, 3);
headlight.target.position.set(0, 0, 30);
tractor.group.add(headlight, headlight.target);

const truck = createTruckState();
let job = null; // active job
let paused = true;
let cameraMode = 0; // 0 chase, 1 far, 2 cab, 3 top
let hitCooldown = 0;
let saveTimer = 0;
let offerSeed = 1;
let lastZone = null;
let warnedFuel = false;
let warnedBroken = false;
let elapsed = 0;

function tankSize() {
  return TANK_LEVELS[save.tankLevel];
}

function placeAtDepot(townId) {
  const t = world.byId[townId] ?? world.towns[0];
  const pad = t.depot;
  // Park on the pad, facing the plaza center (away from the warehouse).
  truck.heading = wrapAngle(pad.angle + Math.PI);
  truck.trailerHeading = truck.heading;
  truck.x = pad.x;
  truck.z = pad.z;
  truck.speed = 0;
  truck.steer = 0;
}

function attachTrailer(cargo) {
  if (trailer) scene.remove(trailer.group);
  trailer = createTrailer(cargo.color);
  scene.add(trailer.group);
  truck.hasTrailer = true;
  truck.cargoMass = cargo.mass;
  truck.trailerHeading = truck.heading;
}

function detachTrailer() {
  if (trailer) scene.remove(trailer.group);
  trailer = null;
  truck.hasTrailer = false;
  truck.cargoMass = 0;
}

function applySave() {
  truck.fuel = Math.min(save.fuel, tankSize());
  tractor.paint.color.setHex(save.color);
  input.setTilt(save.tilt, save.tiltInvert);
  audio.setEnabled(save.sound);
  placeAtDepot(save.town);
  job = null;
  detachTrailer();
  if (save.job) {
    const cargo = CARGOS.find((c) => c.id === save.job.cargoId);
    if (cargo && world.byId[save.job.to]) {
      job = { ...save.job, cargo };
      attachTrailer(cargo);
    }
  }
}

function persist() {
  save.fuel = truck.fuel;
  save.town = nearestTown(truck.x, truck.z).id;
  save.job = job
    ? { ...job, cargo: undefined, cargoId: job.cargo.id }
    : null;
  writeSave(save);
}

function nearestTown(x, z, filter = () => true) {
  let best = null;
  let bestD = Infinity;
  for (const t of world.towns) {
    if (!filter(t)) continue;
    const d = Math.hypot(t.x - x, t.z - z);
    if (d < bestD) {
      bestD = d;
      best = t;
    }
  }
  return best;
}

function addDamage(points, reason) {
  if (points <= 0) return;
  save.damage = Math.min(100, save.damage + points);
  if (job) job.cargoDamage = Math.min(100, job.cargoDamage + points * job.cargo.fragile);
  audio.thud(points / 6);
  if (navigator.vibrate) navigator.vibrate(Math.min(200, 30 + points * 15));
  if (points >= 2) hud.toast(`${reason} −${Math.round(points)} %`, 'bad');
}

// ---------------------------------------------------------------------------- panels

function offersHtml(offers) {
  return `<div class="list">${offers
    .map(
      (o, i) => `<div class="row">
        <span class="swatch" style="background:#${o.cargo.color.toString(16).padStart(6, '0')}"></span>
        <div class="grow"><b>${o.cargo.name}</b>
          <small>→ ${world.byId[o.to].name} · ${fmtDist(o.distance)} · ${(o.cargo.mass / 1000).toFixed(0)} t · ${fmtDuration(o.minutes)}${
            o.cargo.fragile >= 1.5 ? ' · fragile' : ''
          }</small></div>
        <span class="pay">${fmtMoney(o.pay)}</span>
        <button class="btn" data-action="take" data-arg="${i}">Prendre</button>
      </div>`,
    )
    .join('')}</div>`;
}

function openFreight(town) {
  if (job) {
    hud.openPanel(
      `Dépôt de ${town.name}`,
      `<p>Tu transportes déjà <b>${job.cargo.name}</b> pour ${world.byId[job.to].name}.</p>
       <div class="menu"><button class="btn ghost" data-action="close">Continuer la livraison</button>
       <button class="btn" data-action="abandon">Abandonner (−${fmtMoney(Math.round(job.pay * 0.25))})</button></div>`,
      (action) => {
        if (action === 'abandon') {
          save.money = Math.max(0, save.money - Math.round(job.pay * 0.25));
          job = null;
          detachTrailer();
          hud.toast('Livraison abandonnée', 'bad');
          hud.closePanel();
          persist();
        }
      },
    );
    return;
  }
  const rng = createRng(offerSeed * 7919 + town.id.length * 31 + save.deliveries);
  const offers = generateOffers(rng, town, world.towns, world.routeDistance);
  hud.openPanel(`Bourse de fret · ${town.name}`, offersHtml(offers), (action, arg) => {
    if (action !== 'take') return;
    const o = offers[Number(arg)];
    job = {
      from: o.from,
      to: o.to,
      cargo: o.cargo,
      pay: o.pay,
      distance: o.distance,
      deadline: save.clock + o.minutes,
      cargoDamage: 0,
    };
    attachTrailer(o.cargo);
    offerSeed++;
    hud.closePanel();
    hud.toast(`Chargement : ${o.cargo.name} → ${world.byId[o.to].name}`, 'good');
    audio.jingle([392, 523]);
    persist();
  });
}

function stationHtml() {
  const tank = tankSize();
  const missing = Math.max(0, tank - truck.fuel);
  const fuelCost = Math.ceil(missing * FUEL_PRICE);
  const repairCost = Math.ceil(save.damage * REPAIR_PRICE);
  const eNext = save.engineLevel + 1;
  const tNext = save.tankLevel + 1;
  const engineRow =
    eNext < ENGINE_LEVELS.length
      ? `<button class="btn" data-action="engine" ${save.money < ENGINE_PRICES[eNext] ? 'disabled' : ''}>${fmtMoney(ENGINE_PRICES[eNext])}</button>`
      : '<small>Max</small>';
  const tankRow =
    tNext < TANK_LEVELS.length
      ? `<button class="btn" data-action="tank" ${save.money < TANK_PRICES[tNext] ? 'disabled' : ''}>${fmtMoney(TANK_PRICES[tNext])}</button>`
      : '<small>Max</small>';
  return `<div class="list">
    <div class="row"><span>⛽</span><div class="grow"><b>Faire le plein</b><small>${Math.round(truck.fuel)} / ${tank} L · ${FUEL_PRICE} $/L</small></div>
      <button class="btn" data-action="fuel" ${missing < 1 || save.money < 1 ? 'disabled' : ''}>${fmtMoney(fuelCost)}</button></div>
    <div class="row"><span>🔧</span><div class="grow"><b>Réparer</b><small>Dégâts ${Math.round(save.damage)} %</small></div>
      <button class="btn" data-action="repair" ${save.damage < 1 || save.money < 1 ? 'disabled' : ''}>${fmtMoney(repairCost)}</button></div>
    <div class="row"><span>⚙️</span><div class="grow"><b>Moteur</b><small>${ENGINE_LEVELS[save.engineLevel].label}${
      eNext < ENGINE_LEVELS.length ? ` → ${ENGINE_LEVELS[eNext].label}` : ''
    }</small></div>${engineRow}</div>
    <div class="row"><span>🛢️</span><div class="grow"><b>Réservoir</b><small>${tank} L${
      tNext < TANK_LEVELS.length ? ` → ${TANK_LEVELS[tNext]} L` : ''
    }</small></div>${tankRow}</div>
    <div class="row"><span>🎨</span><div class="grow"><b>Peinture</b><small>${fmtMoney(PAINT_PRICE)}</small>
      <div class="colors">${PAINTS.map(
        (c) =>
          `<button data-action="paint" data-arg="${c}" class="${c === save.color ? 'on' : ''}" style="background:#${c
            .toString(16)
            .padStart(6, '0')}" aria-label="Couleur"></button>`,
      ).join('')}</div></div></div>
  </div>`;
}

function openStation(town) {
  const refresh = () => hud.setPanelBody(stationHtml());
  hud.openPanel(`Station · ${town.name}`, stationHtml(), (action, arg) => {
    if (action === 'fuel') {
      const liters = Math.min(tankSize() - truck.fuel, save.money / FUEL_PRICE);
      truck.fuel += liters;
      save.money -= Math.ceil(liters * FUEL_PRICE);
      warnedFuel = false;
      hud.toast('Plein effectué', 'good');
    } else if (action === 'repair') {
      const points = Math.min(save.damage, save.money / REPAIR_PRICE);
      save.damage -= points;
      save.money -= Math.ceil(points * REPAIR_PRICE);
      warnedBroken = false;
      hud.toast('Camion réparé', 'good');
    } else if (action === 'engine') {
      save.money -= ENGINE_PRICES[save.engineLevel + 1];
      save.engineLevel++;
      audio.jingle();
      hud.toast(`Nouveau moteur : ${ENGINE_LEVELS[save.engineLevel].label}`, 'good');
    } else if (action === 'tank') {
      save.money -= TANK_PRICES[save.tankLevel + 1];
      save.tankLevel++;
      audio.jingle();
      hud.toast(`Réservoir de ${tankSize()} L`, 'good');
    } else if (action === 'paint') {
      const c = Number(arg);
      if (c === save.color || save.money < PAINT_PRICE) return;
      save.money -= PAINT_PRICE;
      save.color = c;
      tractor.paint.color.setHex(c);
    } else {
      return;
    }
    save.money = Math.max(0, Math.round(save.money));
    persist();
    refresh();
  });
}

function deliver() {
  const late = Math.max(0, save.clock - job.deadline);
  const p = payout(job, job.cargoDamage, late);
  save.money += p.total;
  save.earned += p.total;
  save.deliveries++;
  const done = job;
  job = null;
  detachTrailer();
  audio.jingle();
  persist();
  hud.openPanel(
    `Livré à ${world.byId[done.to].name} !`,
    `<table class="result">
      <tr><td>${done.cargo.name} · ${fmtDist(done.distance)}</td><td>${fmtMoney(p.base)}</td></tr>
      <tr><td>Dégâts sur la marchandise (${Math.round(done.cargoDamage)} %)</td><td>−${fmtMoney(p.damageCut)}</td></tr>
      <tr><td>Retard${late > 0 ? ` (${fmtDuration(late)})` : ' : aucun'}</td><td>−${fmtMoney(p.lateCut)}</td></tr>
      <tr class="total"><td>Total</td><td>${fmtMoney(p.total)}</td></tr>
    </table>
    <div class="menu"><button class="btn ghost" data-action="close">Continuer</button>
    <button class="btn" data-action="freight">Bourse de fret</button></div>`,
    (action) => {
      if (action === 'freight') openFreight(world.byId[done.to]);
    },
  );
}

function tow() {
  const t = nearestTown(truck.x, truck.z, (t) => t.stationPad);
  save.money = Math.max(0, save.money - TOW_PRICE);
  placeAtDepot(t.id);
  // Park on the station pad instead of the depot.
  const pad = t.stationPad;
  truck.x = pad.x;
  truck.z = pad.z;
  truck.heading = wrapAngle(pad.angle + Math.PI);
  truck.trailerHeading = truck.heading;
  truck.fuel = Math.max(truck.fuel, 25);
  if (save.damage >= 100) save.damage = 90;
  warnedFuel = false;
  warnedBroken = false;
  hud.toast(`Dépanné à ${t.name} (−${fmtMoney(TOW_PRICE)})`, 'bad');
  persist();
}

function openMenu() {
  paused = true;
  audio.horn(false);
  const render = () => `
    <img id="bigmap" src="${hud.bigMap(truck.x, truck.z, job ? world.byId[job.to].depot : null)}" alt="Carte" />
    <p>Livraisons : <b>${save.deliveries}</b> · Gains : <b>${fmtMoney(save.earned)}</b> · Distance : <b>${fmtDist(save.distance)}</b></p>
    <div class="menu">
      <button class="btn" data-action="close">Reprendre</button>
      <button class="btn ghost" data-action="tow">Dépanneuse (${fmtMoney(TOW_PRICE)})</button>
      <button class="btn ghost" data-action="tilt">Direction : ${save.tilt ? 'inclinaison' : 'boutons'}</button>
      <button class="btn ghost" data-action="invert" ${save.tilt ? '' : 'disabled'}>Inverser l'inclinaison${save.tiltInvert ? ' ✓' : ''}</button>
      <button class="btn ghost" data-action="sound">Son : ${save.sound ? 'activé' : 'coupé'}</button>
      <button class="btn ghost" data-action="reset">Nouvelle partie</button>
    </div>`;
  hud.openPanel('Pause', render(), (action) => {
    if (action === 'closed') {
      paused = false;
      return;
    }
    if (action === 'tow') {
      tow();
      hud.closePanel();
      return;
    }
    if (action === 'tilt') save.tilt = !save.tilt;
    if (action === 'invert') save.tiltInvert = !save.tiltInvert;
    if (action === 'sound') save.sound = !save.sound;
    if (action === 'reset') {
      if (!confirm('Effacer la progression et recommencer ?')) return;
      resetSave();
      save = { ...DEFAULT_SAVE };
      applySave();
      hud.closePanel();
      return;
    }
    input.setTilt(save.tilt, save.tiltInvert);
    audio.setEnabled(save.sound);
    persist();
    hud.setPanelBody(render());
  });
}

// ---------------------------------------------------------------------------- controls

input.bindHold(document.getElementById('btn-left'), 'left');
input.bindHold(document.getElementById('btn-right'), 'right');
input.bindHold(document.getElementById('btn-gas'), 'gas');
input.bindHold(document.getElementById('btn-brake'), 'brake');
input.bindHold(document.getElementById('btn-hand'), 'handbrake');
input.bindHold(document.getElementById('btn-horn'), 'horn');

const tap = (id, fn) =>
  document.getElementById(id).addEventListener('pointerdown', (e) => {
    e.preventDefault();
    fn();
  });
tap('btn-cam', () => {
  cameraMode = (cameraMode + 1) % 4;
  hud.toast(['Caméra : poursuite', 'Caméra : éloignée', 'Caméra : cabine', 'Caméra : dessus'][cameraMode]);
});
tap('btn-pause', openMenu);
tap('btn-action', () => {
  if (!lastZone || paused) return;
  if (lastZone.kind === 'depot') openFreight(world.byId[lastZone.town]);
  else openStation(world.byId[lastZone.town]);
});

window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyC') cameraMode = (cameraMode + 1) % 4;
  if (e.code === 'Escape' || e.code === 'KeyP') {
    if (hud.panelOpen) hud.closePanel();
    else if (!paused) openMenu();
  }
  if (e.code === 'KeyE' || e.code === 'Enter') document.getElementById('btn-action').dispatchEvent(new PointerEvent('pointerdown'));
});

document.getElementById('btn-play').addEventListener('click', async () => {
  audio.start();
  document.getElementById('start').hidden = true;
  document.getElementById('hud').hidden = false;
  // The Android app is already fullscreen and landscape; in a browser, ask for both.
  if (!navigator.userAgent.includes('CamionExpressApp')) {
    try {
      await document.documentElement.requestFullscreen?.();
      await screen.orientation?.lock?.('landscape');
    } catch {
      // Not allowed in every browser.
    }
  }
  paused = false;
  if (save.deliveries === 0 && !job) hud.toast('Arrête-toi sur le dépôt FRET pour choisir un chargement');
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    persist();
    audio.suspend();
    if (!paused && !hud.panelOpen) openMenu();
  } else {
    audio.resume();
  }
});
window.addEventListener('pagehide', persist);

// ---------------------------------------------------------------------------- simulation

const tractorCircles = [
  [0, TRUCK.wheelbase / 2 + 1.4, 1.35],
  [0, -0.6, 1.35],
];
const trailerCircles = [-2.5, -6.5, -10.5].map((d) => [0, d, 1.35]);

function bodyPoints() {
  const pts = [];
  const sh = Math.sin(truck.heading);
  const ch = Math.cos(truck.heading);
  for (const [, d, r] of tractorCircles) pts.push({ x: truck.x + sh * d, z: truck.z + ch * d, r, part: 'tractor' });
  if (truck.hasTrailer) {
    const h = hitchPosition(truck);
    const st = Math.sin(truck.trailerHeading);
    const ct = Math.cos(truck.trailerHeading);
    for (const [, d, r] of trailerCircles) pts.push({ x: h.x + st * d, z: h.z + ct * d, r, part: 'trailer' });
  }
  return pts;
}

function collide(dt) {
  hitCooldown = Math.max(0, hitCooldown - dt);
  let hit = false;
  let pushX = 0;
  let pushZ = 0;
  let reason = 'Choc';
  const pts = bodyPoints();
  for (const p of pts) {
    const r = resolveCircle(world, p.x, p.z, p.r);
    if (r.hit) {
      hit = true;
      pushX += r.px;
      pushZ += r.pz;
    }
  }
  for (const car of traffic.cars) {
    if (Math.abs(car.x - truck.x) > 30 || Math.abs(car.z - truck.z) > 30) continue;
    const fx = Math.sin(car.heading);
    const fz = Math.cos(car.heading);
    for (const d of [-car.length / 4, car.length / 4]) {
      const cx = car.x + fx * d;
      const cz = car.z + fz * d;
      for (const p of pts) {
        const dx = p.x - cx;
        const dz = p.z - cz;
        const dist = Math.hypot(dx, dz);
        const min = p.r + 1.1;
        if (dist < min && dist > 1e-4) {
          hit = true;
          reason = 'Accident';
          pushX += (dx / dist) * (min - dist) * 0.7;
          pushZ += (dz / dist) * (min - dist) * 0.7;
          car.stunned = 3;
          car.speed = 0;
        }
      }
    }
  }
  if (hit) {
    truck.x += pushX;
    truck.z += pushZ;
    const impact = Math.abs(truck.speed);
    // Only the part of the speed that drives into the obstacle is lost.
    const along = (Math.sin(truck.heading) * pushX + Math.cos(truck.heading) * pushZ) * Math.sign(truck.speed);
    if (along < -0.001) truck.speed *= impact > 4 ? -0.15 : 0.2;
    if (hitCooldown === 0 && impact > 2.5) {
      addDamage((impact - 2.5) * 0.9, reason);
      hitCooldown = 0.6;
    }
  }
  // World edge.
  const lim = WORLD_HALF - 20;
  if (Math.abs(truck.x) > lim || Math.abs(truck.z) > lim) {
    truck.x = Math.max(-lim, Math.min(lim, truck.x));
    truck.z = Math.max(-lim, Math.min(lim, truck.z));
    truck.speed *= 0.5;
  }
}

function currentZone() {
  for (const t of world.towns) {
    if (Math.hypot(t.x - truck.x, t.z - truck.z) > 80) continue;
    if (inPad(t.depot, truck.x, truck.z, 2)) return t.depot;
    if (t.stationPad && inPad(t.stationPad, truck.x, truck.z, 2)) return t.stationPad;
  }
  return null;
}

function simulate(dt) {
  const raw = input.read(dt);
  const broken = save.damage >= 100;
  const control = { ...raw, throttle: broken ? 0 : raw.throttle };
  if (broken) control.brake = raw.brake && truck.speed > 0.3 ? raw.brake : 0;
  audio.horn(raw.horn);

  const beforeX = truck.x;
  const beforeZ = truck.z;
  const offroad = world.isOffroad(truck.x, truck.z);
  const res = stepTruck(truck, control, { offroad, engineLevel: save.engineLevel }, dt);
  if (res.jackknifeHit) addDamage(3, 'Mise en portefeuille');
  if (offroad && Math.abs(truck.speed) > 12) save.damage = Math.min(100, save.damage + dt * 0.15);
  collide(dt);
  save.distance += Math.hypot(truck.x - beforeX, truck.z - beforeZ);

  save.clock += dt * GAME_MINUTES_PER_SECOND;
  traffic.update(dt, bodyPoints());

  if (truck.fuel <= 0 && !warnedFuel) {
    warnedFuel = true;
    hud.toast('Panne sèche ! Menu ☰ → Dépanneuse', 'bad');
  }
  if (broken && !warnedBroken) {
    warnedBroken = true;
    hud.toast('Camion en panne ! Menu ☰ → Dépanneuse', 'bad');
  }

  // Zones: depot (freight / delivery) and station.
  const zone = currentZone();
  const stopped = Math.abs(truck.speed) < 1.2;
  lastZone = zone && stopped ? zone : null;
  if (job && zone && zone.kind === 'depot' && zone.town === job.to && Math.abs(truck.speed) < 0.6) {
    lastZone = null;
    deliver();
    return;
  }
  hud.action(lastZone ? (lastZone.kind === 'depot' ? '📦 Bourse de fret' : '⛽ Station') : null);

  audio.updateEngine(truck.rpm, truck.throttle);
  saveTimer += dt;
  if (saveTimer > 5) {
    saveTimer = 0;
    persist();
  }
}

// ---------------------------------------------------------------------------- rendering

const camPos = new THREE.Vector3();
const camLook = new THREE.Vector3();
let camInit = false;

function updateCamera(dt) {
  const sh = Math.sin(truck.heading);
  const ch = Math.cos(truck.heading);
  let pos;
  let look;
  if (cameraMode === 2) {
    // Driver seat (left-hand drive: +x is the truck's left).
    const side = 0.6;
    const fwd = TRUCK.wheelbase / 2 + 1.3;
    const x = truck.x + sh * fwd + ch * side;
    const z = truck.z + ch * fwd - sh * side;
    camera.position.set(x, 3.05, z);
    camera.lookAt(x + sh * 20, 2.4, z + ch * 20);
    camInit = false;
    return;
  }
  if (cameraMode === 3) {
    pos = new THREE.Vector3(truck.x - sh * 6, 70, truck.z - ch * 6);
    look = new THREE.Vector3(truck.x + sh * 6, 0, truck.z + ch * 6);
  } else {
    const far = cameraMode === 1;
    const back = (truck.hasTrailer ? 30 : 13) * (far ? 1.5 : 1);
    const height = (truck.hasTrailer ? 11 : 5.5) * (far ? 1.5 : 1);
    // Follow the rig's average direction so the trailer stays in frame.
    const dir = truck.hasTrailer ? truck.heading + wrapAngle(truck.trailerHeading - truck.heading) * 0.5 : truck.heading;
    pos = new THREE.Vector3(truck.x - Math.sin(dir) * back, height, truck.z - Math.cos(dir) * back);
    look = new THREE.Vector3(truck.x + sh * 8, 2.5, truck.z + ch * 8);
  }
  if (!camInit) {
    camPos.copy(pos);
    camLook.copy(look);
    camInit = true;
  }
  const k = 1 - Math.exp(-dt * 4);
  camPos.lerp(pos, k);
  camLook.lerp(look, 1 - Math.exp(-dt * 8));
  camera.position.copy(camPos);
  // Small shake off-road.
  if (world.isOffroad(truck.x, truck.z) && Math.abs(truck.speed) > 3) {
    camera.position.y += (Math.random() - 0.5) * Math.min(0.25, Math.abs(truck.speed) * 0.02);
  }
  camera.lookAt(camLook);
}

function updateLighting() {
  const minute = ((save.clock % 1440) + 1440) % 1440;
  const h = minute / 60;
  // Daylight from 6h to 20h, dusk and dawn blend over an hour.
  const day = THREE.MathUtils.clamp(Math.min(h - 5.5, 20.5 - h), 0, 1);
  const dusk = 1 - Math.abs(day - 0.5) * 2;
  const sky = skyNight.clone().lerp(skyDay, day).lerp(skyDusk, dusk * 0.45);
  scene.background.copy(sky);
  scene.fog.color.copy(sky);
  sun.intensity = 0.05 + 1.55 * day;
  hemi.intensity = 0.12 + 1.0 * day;
  hemi.color.copy(hemiNight).lerp(hemiDay, day);
  const sunAngle = ((h - 6) / 14) * Math.PI;
  sun.position.set(Math.cos(sunAngle) * 800, Math.max(100, Math.sin(sunAngle) * 800), 300);
  const night = day < 0.6;
  headlight.intensity = night ? 60 : 0;
  for (const l of tractor.headlights) l.material.color.setHex(night ? 0xffffff : 0xd8d2b8);
}

function render(dt) {
  tractor.group.position.set(truck.x, 0, truck.z);
  tractor.group.rotation.y = truck.heading;
  for (const fw of tractor.frontWheels) fw.rotation.y = truck.steer;
  const spin = (truck.speed * dt) / 0.55;
  for (const w of tractor.wheels) w.rotation.x += spin;
  tractor.brakeMat.color.setHex(input.read(0).brake && truck.speed > 0.3 ? 0xff2020 : 0x5a0d0d);
  if (trailer) {
    const h = hitchPosition(truck);
    trailer.group.position.set(h.x, 0, h.z);
    trailer.group.rotation.y = truck.trailerHeading;
    for (const w of trailer.wheels) w.rotation.x += spin;
  }

  if (job) {
    const pad = world.byId[job.to].depot;
    beacon.visible = true;
    beacon.position.x = pad.x;
    beacon.position.z = pad.z;
    beacon.material.opacity = 0.22 + Math.sin(elapsed * 3) * 0.08;
  } else {
    beacon.visible = false;
  }

  updateLighting();
  updateCamera(dt);
  renderer.render(scene, camera);
}

function updateHud() {
  hud.update({
    money: save.money,
    clock: save.clock,
    speed: truck.speed,
    gear: truck.gear,
    fuel: truck.fuel,
    tank: tankSize(),
    damage: save.damage,
  });
  let target = null;
  if (job) {
    const t = world.byId[job.to];
    target = t.depot;
    const dist = Math.hypot(target.x - truck.x, target.z - truck.z);
    const left = job.deadline - save.clock;
    const bearing = Math.atan2(target.x - truck.x, target.z - truck.z);
    const rel = wrapAngle(bearing - truck.heading);
    hud.mission(
      `${job.cargo.name} → ${t.name}`,
      `${fmtDist(dist)} · ${
        left >= 0 ? `livrer avant ${fmtClock(job.deadline)} (${fmtDuration(left)})` : `<span class="late">en retard de ${fmtDuration(-left)}</span>`
      } · marchandise ${Math.round(100 - job.cargoDamage)} %`,
      -rel,
    );
  } else {
    const t = nearestTown(truck.x, truck.z);
    const pad = t.depot;
    const near = Math.hypot(pad.x - truck.x, pad.z - truck.z);
    const rel = wrapAngle(Math.atan2(pad.x - truck.x, pad.z - truck.z) - truck.heading);
    hud.mission('Aucune livraison', `Dépôt FRET de ${t.name} : ${fmtDist(near)}`, near > 15 ? -rel : null);
  }
  hud.minimap(truck.x, truck.z, truck.heading, target);
}

// ---------------------------------------------------------------------------- loop

function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.fov = w / h < 1.4 ? 70 : 60;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

applySave();

let last = performance.now();
let hudTimer = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  elapsed += dt;
  if (!paused && !hud.panelOpen) {
    // Fixed physics steps keep the trailer stable at low frame rates.
    const steps = Math.ceil(dt / (1 / 60));
    for (let i = 0; i < steps && !hud.panelOpen; i++) simulate(dt / steps);
  } else {
    audio.updateEngine(800, 0);
    audio.horn(false);
  }
  render(dt);
  hudTimer += dt;
  if (hudTimer > 0.1) {
    hudTimer = 0;
    updateHud();
  }
  requestAnimationFrame(frame);
}
updateHud();
requestAnimationFrame(frame);

// Android back button (called from MainActivity): close a panel, else open the pause menu.
window.__onBack = () => {
  if (hud.panelOpen) {
    hud.closePanel();
    return 'ok';
  }
  if (!document.getElementById('start').hidden) return 'exit';
  openMenu();
  return 'ok';
};

// Exposed for automated tests in a browser.
window.__game = { truck, world, get save() { return save; }, get job() { return job; }, deliver: () => job && deliver() };
