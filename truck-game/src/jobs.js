// Freight jobs: cargo types, job offers and the delivery payout.

export const CARGOS = [
  { id: 'bois', name: 'Bois de construction', mass: 14000, rate: 1.0, color: 0x9a6b3f, fragile: 1 },
  { id: 'fruits', name: 'Fruits frais', mass: 9000, rate: 1.25, color: 0xf2a541, fragile: 1.3 },
  { id: 'electro', name: 'Électroménager', mass: 7000, rate: 1.45, color: 0xe8edf2, fragile: 1.6 },
  { id: 'verre', name: 'Verre (fragile)', mass: 11000, rate: 1.8, color: 0x8fd3e8, fragile: 2.5 },
  { id: 'ciment', name: 'Sacs de ciment', mass: 22000, rate: 1.3, color: 0x9ea3a8, fragile: 0.6 },
  { id: 'carburant', name: 'Citerne de carburant', mass: 18000, rate: 1.6, color: 0xd94b3c, fragile: 1.2 },
  { id: 'riz', name: 'Riz en sacs', mass: 16000, rate: 1.1, color: 0xf1e3b5, fragile: 0.8 },
  { id: 'machines', name: 'Machines agricoles', mass: 20000, rate: 1.5, color: 0x3f8f4f, fragile: 1.1 },
];

/**
 * Game minutes allowed for a trip. The clock runs one game minute per real second, so this is
 * the real driving time at an average of 10 m/s (36 km/h), plus 50% and a fixed margin.
 */
export function deadlineMinutes(distanceM) {
  return Math.round(((distanceM / 10) * 1.5 + 45) / 5) * 5;
}

export function basePay(distanceM, cargo) {
  return Math.round((300 + distanceM * 1.1) * cargo.rate / 10) * 10;
}

/**
 * Offers from one town. `routeDistance(fromId, toId)` gives the road distance in meters.
 */
export function generateOffers(rng, fromTown, towns, routeDistance, count = 4) {
  const others = towns.filter((t) => t.id !== fromTown.id);
  const offers = [];
  for (let i = 0; i < count; i++) {
    const to = rng.pick(others);
    const cargo = rng.pick(CARGOS);
    const distance = routeDistance(fromTown.id, to.id);
    offers.push({
      id: `${fromTown.id}-${to.id}-${cargo.id}-${i}`,
      from: fromTown.id,
      to: to.id,
      cargo,
      distance,
      pay: basePay(distance, cargo),
      minutes: deadlineMinutes(distance),
    });
  }
  return offers;
}

/** Pay at delivery: cargo damage takes its share, a late delivery loses 30%. */
export function payout(job, cargoDamage, lateMinutes) {
  const damageCut = Math.round(job.pay * Math.min(1, cargoDamage / 100));
  const lateCut = lateMinutes > 0 ? Math.round((job.pay - damageCut) * 0.3) : 0;
  return { base: job.pay, damageCut, lateCut, total: Math.max(0, job.pay - damageCut - lateCut) };
}
