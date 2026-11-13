// Truck driving model: a kinematic bicycle model for the tractor, an articulated trailer
// following its hitch, an automatic gearbox and fuel use. No Three.js here so it can be tested in Node.

export const GRAVITY = 9.81;

export const TRUCK = {
  wheelbase: 4.2, // m, front axle to rear axle of the tractor
  hitchOffset: 0.6, // m, fifth wheel ahead of the rear axle
  trailerLength: 9.5, // m, kingpin to trailer axles
  tractorMass: 8500, // kg
  trailerMass: 6000, // kg, empty trailer
  maxSteer: 0.62, // rad, at walking pace
  steerRate: 1.6, // rad/s
  brakeForce: 90000, // N
  reverseForce: 22000, // N
  maxReverse: 4.5, // m/s
  dragCoef: 4.2, // N per (m/s)^2
  rolling: 0.012, // on asphalt
  rollingOffroad: 0.07, // on grass
  gearTops: [5, 9, 13, 17, 21, 25, 29, 33], // m/s at which each gear tops out
  jackknifeAngle: 1.35, // rad between tractor and trailer
};

export const ENGINE_LEVELS = [
  { power: 260000, maxForce: 60000, label: '350 ch' },
  { power: 330000, maxForce: 70000, label: '450 ch' },
  { power: 410000, maxForce: 80000, label: '560 ch' },
  { power: 500000, maxForce: 90000, label: '680 ch' },
];

export const TANK_LEVELS = [120, 180, 260];

export function wrapAngle(a) {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

export function createTruckState(x = 0, z = 0, heading = 0) {
  return {
    x,
    z,
    heading, // forward = (sin h, cos h) on the x/z plane
    speed: 0, // m/s, negative when reversing
    steer: 0, // rad, current front wheel angle
    trailerHeading: heading,
    hasTrailer: false,
    cargoMass: 0,
    gear: 1,
    rpm: 800,
    throttle: 0,
    fuel: TANK_LEVELS[0],
    jackknifed: false,
    stoppedFor: 0, // seconds spent stopped, reverse engages after a short pause
  };
}

/** Position of the fifth wheel (where the trailer pivots). */
export function hitchPosition(s) {
  const back = TRUCK.wheelbase / 2 - TRUCK.hitchOffset;
  return { x: s.x - Math.sin(s.heading) * back, z: s.z - Math.cos(s.heading) * back };
}

/** Center of the trailer's rear axle group. */
export function trailerAxlePosition(s) {
  const h = hitchPosition(s);
  return {
    x: h.x - Math.sin(s.trailerHeading) * TRUCK.trailerLength,
    z: h.z - Math.cos(s.trailerHeading) * TRUCK.trailerLength,
  };
}

export function totalMass(s) {
  return TRUCK.tractorMass + (s.hasTrailer ? TRUCK.trailerMass + s.cargoMass : 0);
}

/**
 * Advance the truck by dt seconds.
 * input: { throttle 0..1, brake 0..1, steer -1..1 (positive = left), handbrake bool }
 * env: { offroad bool, engineLevel int }
 * Returns { jackknifeHit: bool } so the game can apply damage.
 */
export function stepTruck(s, input, env, dt) {
  const engine = ENGINE_LEVELS[env.engineLevel] ?? ENGINE_LEVELS[0];
  const mass = totalMass(s);
  const v = s.speed;
  const absV = Math.abs(v);
  const hasFuel = s.fuel > 0;

  // Steering: less lock at speed, rate limited so it feels like a heavy vehicle.
  const lock = TRUCK.maxSteer / (1 + absV / 11);
  const target = input.steer * lock;
  const maxDelta = TRUCK.steerRate * dt;
  s.steer += Math.max(-maxDelta, Math.min(maxDelta, target - s.steer));

  // Longitudinal forces. The brake pedal reverses once the truck has stopped.
  let force = 0;
  let throttle = 0;
  if (input.throttle > 0 && hasFuel) {
    if (v >= -0.3) {
      throttle = input.throttle;
      force += Math.min(engine.maxForce, engine.power / Math.max(absV, 1.5)) * throttle;
    } else {
      force += TRUCK.brakeForce * input.throttle; // braking while rolling backwards
    }
  }
  if (input.brake > 0) {
    if (v > 0.3) {
      force -= TRUCK.brakeForce * input.brake;
    } else if (hasFuel && v > -TRUCK.maxReverse && s.stoppedFor > 0.35) {
      throttle = input.brake * 0.5;
      force -= TRUCK.reverseForce * input.brake;
    }
  }
  if (input.handbrake) force -= Math.sign(v) * TRUCK.brakeForce * 0.7;

  const rolling = (env.offroad ? TRUCK.rollingOffroad : TRUCK.rolling) * mass * GRAVITY;
  const resist = TRUCK.dragCoef * v * absV + Math.sign(v) * rolling;

  let accel = (force - resist) / mass;
  let newV = v + accel * dt;
  // Friction must not flip the direction of travel on its own.
  const driving = Math.abs(force) > 1;
  if (!driving && Math.sign(newV) !== Math.sign(v)) newV = 0;
  if (driving && v > 0 && newV < 0 && input.brake > 0 && v > 0.3) newV = 0;
  if (driving && v < 0 && newV > 0 && input.throttle > 0) newV = 0;
  if (Math.abs(newV) < 0.02 && !driving) newV = 0;
  s.speed = newV;
  s.stoppedFor = Math.abs(newV) < 0.31 ? s.stoppedFor + dt : 0;
  if (newV < -0.31) s.stoppedFor = 1; // already reversing

  // Kinematics.
  const yawRate = (s.speed / TRUCK.wheelbase) * Math.tan(s.steer);
  s.heading = wrapAngle(s.heading + yawRate * dt);
  s.x += Math.sin(s.heading) * s.speed * dt;
  s.z += Math.cos(s.heading) * s.speed * dt;

  // Trailer: the kingpin is dragged by the hitch, the trailer rotates toward it.
  let jackknifeHit = false;
  if (s.hasTrailer) {
    const rel = wrapAngle(s.heading - s.trailerHeading);
    s.trailerHeading = wrapAngle(s.trailerHeading + (s.speed / TRUCK.trailerLength) * Math.sin(rel) * dt);
    const after = wrapAngle(s.heading - s.trailerHeading);
    if (Math.abs(after) > TRUCK.jackknifeAngle) {
      s.trailerHeading = wrapAngle(s.heading - Math.sign(after) * TRUCK.jackknifeAngle);
      if (!s.jackknifed && Math.abs(s.speed) > 1) jackknifeHit = true;
      s.jackknifed = true;
      s.speed *= 0.9;
    } else {
      s.jackknifed = false;
    }
  } else {
    s.trailerHeading = s.heading;
  }

  // Automatic gearbox, only for the engine sound and the HUD.
  if (s.speed < -0.1) {
    s.gear = -1;
  } else {
    let g = 1;
    while (g < TRUCK.gearTops.length && s.speed > TRUCK.gearTops[g - 1] * 0.92) g++;
    s.gear = g;
  }
  const top = s.gear < 0 ? TRUCK.maxReverse : TRUCK.gearTops[s.gear - 1];
  const low = s.gear <= 1 ? 0 : TRUCK.gearTops[s.gear - 2] * 0.92;
  const ratio = Math.min(1, Math.max(0, (absV - low) / Math.max(0.1, top - low)));
  const targetRpm = 800 + ratio * 1300 + throttle * 250;
  s.rpm += (targetRpm - s.rpm) * Math.min(1, dt * 6);
  s.throttle = throttle;

  // Fuel: idle plus load-dependent use.
  const load = 1 + (s.hasTrailer ? (TRUCK.trailerMass + s.cargoMass) / 30000 : 0);
  s.fuel = Math.max(0, s.fuel - (0.008 + 0.22 * throttle * load) * dt);

  return { jackknifeHit };
}
