// Traffic cars that drive on the right lane of the roads and hop to another road at each town.
import { createCar } from './models.js';

const LANE = 2.7;

function sampleRoad(road, s) {
  const cum = road.cum;
  let lo = 0;
  let hi = cum.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (cum[mid] <= s) lo = mid;
    else hi = mid;
  }
  const a = road.points[lo];
  const b = road.points[hi];
  const seg = cum[hi] - cum[lo] || 1;
  const t = Math.max(0, Math.min(1, (s - cum[lo]) / seg));
  return { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t, dx: (b.x - a.x) / seg, dz: (b.z - a.z) / seg };
}

export function createTraffic(world, scene, rng, count = 18) {
  const cars = [];
  for (let i = 0; i < count; i++) {
    const road = world.roads[i % world.roads.length];
    const { group, length } = createCar(i);
    scene.add(group);
    cars.push({
      road,
      dir: i % 2 === 0 ? 1 : -1,
      s: rng.range(80, road.length - 80),
      speed: 0,
      cruise: rng.range(12, 17),
      length,
      x: 0,
      z: 0,
      heading: 0,
      group,
      stunned: 0,
    });
  }

  function nextRoad(car, townId) {
    const options = world.adj[townId].filter((e) => e.road !== car.road);
    const e = options.length ? options[Math.floor(rng.next() * options.length)] : world.adj[townId][0];
    car.road = e.road;
    car.dir = e.road.a === townId ? 1 : -1;
    car.s = car.dir > 0 ? 0 : e.road.length;
  }

  /** obstacles: points {x, z} of the player's truck to stop behind. */
  function update(dt, obstacles) {
    for (const car of cars) {
      const town = world.byId[car.dir > 0 ? car.road.b : car.road.a];
      const remaining = car.dir > 0 ? car.road.length - car.s : car.s;
      const done = car.road.length - remaining;
      let target = car.cruise;
      if (remaining < 90 || done < 60) target = Math.min(target, 8);

      const fx = Math.sin(car.heading);
      const fz = Math.cos(car.heading);
      const check = (px, pz, gap) => {
        const dx = px - car.x;
        const dz = pz - car.z;
        const ahead = dx * fx + dz * fz;
        const side = Math.abs(dx * fz - dz * fx);
        if (ahead > 0 && ahead < gap && side < 3.6) target = Math.min(target, Math.max(0, (ahead - 8) * 0.6));
      };
      for (const p of obstacles) check(p.x, p.z, 26);
      for (const o of cars) if (o !== car) check(o.x, o.z, 16);

      if (car.stunned > 0) {
        car.stunned -= dt;
        target = 0;
      }
      const accel = target > car.speed ? 2.5 : 7;
      car.speed += Math.max(-accel * dt, Math.min(accel * dt, target - car.speed));
      car.s += car.dir * car.speed * dt;
      if (car.s > car.road.length || car.s < 0) nextRoad(car, town.id);

      const p = sampleRoad(car.road, car.s);
      const dx = p.dx * car.dir;
      const dz = p.dz * car.dir;
      car.x = p.x - dz * LANE;
      car.z = p.z + dx * LANE;
      car.heading = Math.atan2(dx, dz);
      car.group.position.set(car.x, 0, car.z);
      car.group.rotation.y = car.heading;
    }
  }

  return { cars, update };
}
