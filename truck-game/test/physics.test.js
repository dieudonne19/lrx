import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTruckState, stepTruck } from '../src/physics.js';

const run = (s, input, seconds, env = { offroad: false, engineLevel: 0 }) => {
  for (let t = 0; t < seconds; t += 1 / 60) stepTruck(s, input, env, 1 / 60);
};

test('accelerates forward, then brakes to a stop without rolling back', () => {
  const s = createTruckState();
  run(s, { throttle: 1, brake: 0, steer: 0 }, 10);
  assert.ok(s.speed > 10, `speed ${s.speed}`);
  assert.ok(s.z > 30);
  let t = 0;
  while (s.speed > 0.31 && t < 4) {
    stepTruck(s, { throttle: 0, brake: 1, steer: 0 }, { offroad: false, engineLevel: 0 }, 1 / 60);
    t += 1 / 60;
  }
  assert.ok(t < 4, 'stopped in time');
  assert.ok(s.speed >= 0, `speed ${s.speed}`);
});

test('a loaded trailer slows the acceleration', () => {
  const empty = createTruckState();
  const loaded = createTruckState();
  loaded.hasTrailer = true;
  loaded.cargoMass = 20000;
  run(empty, { throttle: 1, brake: 0, steer: 0 }, 8);
  run(loaded, { throttle: 1, brake: 0, steer: 0 }, 8);
  assert.ok(loaded.speed < empty.speed);
});

test('holding brake when stopped reverses slowly', () => {
  const s = createTruckState();
  run(s, { throttle: 0, brake: 1, steer: 0 }, 5);
  assert.ok(s.speed < 0 && s.speed > -5);
  assert.equal(s.gear, -1);
});

test('the trailer follows the tractor through a turn', () => {
  const s = createTruckState();
  s.hasTrailer = true;
  run(s, { throttle: 0.5, brake: 0, steer: 1 }, 6);
  run(s, { throttle: 0.5, brake: 0, steer: 0 }, 15);
  const rel = Math.abs(Math.atan2(Math.sin(s.heading - s.trailerHeading), Math.cos(s.heading - s.trailerHeading)));
  assert.ok(rel < 0.05, `angle ${rel}`);
});

test('no fuel, no drive', () => {
  const s = createTruckState();
  s.fuel = 0;
  run(s, { throttle: 1, brake: 0, steer: 0 }, 3);
  assert.equal(s.speed, 0);
});

import { CARGOS, deadlineMinutes, payout } from '../src/jobs.js';

test('deadline leaves time to drive at a normal pace', () => {
  // 2 km at 60 km/h takes 120 s = 120 game minutes.
  assert.ok(deadlineMinutes(2000) > 200);
});

test('payout removes damage and lateness', () => {
  const job = { pay: 1000, cargo: CARGOS[0] };
  assert.equal(payout(job, 0, 0).total, 1000);
  assert.equal(payout(job, 20, 0).total, 800);
  assert.equal(payout(job, 20, 5).total, 560);
  assert.equal(payout(job, 150, 0).total, 0);
});
