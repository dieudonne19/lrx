import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateWorld, inPad, resolveCircle } from '../src/worldgen.js';

const world = generateWorld();

test('every town has a depot and every town is reachable', () => {
  for (const t of world.towns) {
    assert.ok(t.depot, t.id);
    for (const o of world.towns) {
      if (o.id === t.id) continue;
      const d = world.routeDistance(t.id, o.id);
      assert.ok(Number.isFinite(d) && d > 300, `${t.id} -> ${o.id}: ${d}`);
    }
  }
});

test('the depot pad is on the plaza, not on a building', () => {
  for (const t of world.towns) {
    assert.ok(inPad(t.depot, t.depot.x, t.depot.z));
    assert.equal(resolveCircle(world, t.depot.x, t.depot.z, 3).hit, false, t.id);
    assert.equal(world.isOffroad(t.depot.x, t.depot.z), false);
  }
});

test('roads are drivable and not blocked by obstacles', () => {
  for (const r of world.roads) {
    for (let i = 0; i < r.points.length; i += 1) {
      const p = r.points[i];
      assert.equal(world.isOffroad(p.x, p.z), false);
      assert.equal(resolveCircle(world, p.x, p.z, 2).hit, false, `road ${r.id} point ${i}`);
    }
  }
});

test('a truck with its trailer fits on the depot pad', async () => {
  const { createTruckState, hitchPosition } = await import('../src/physics.js');
  for (const t of world.towns) {
    const s = createTruckState(t.depot.x, t.depot.z, t.depot.angle + Math.PI);
    s.hasTrailer = true;
    const h = hitchPosition(s);
    for (const d of [0, -4, -8, -12]) {
      const x = h.x + Math.sin(s.trailerHeading) * d;
      const z = h.z + Math.cos(s.trailerHeading) * d;
      assert.equal(resolveCircle(world, x, z, 1.4).hit, false, `${t.id} trailer at ${d}`);
    }
  }
});
