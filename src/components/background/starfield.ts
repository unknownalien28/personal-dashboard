/** Small mulberry32 PRNG so the star/particle field is stable across re-renders
 *  and hot reloads instead of reshuffling every time the component mounts. */
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Star {
  id: number;
  top: number;
  left: number;
  size: number;
  duration: number;
  delay: number;
  minOpacity: number;
  maxOpacity: number;
}

export interface Particle {
  id: number;
  top: number;
  left: number;
  size: number;
  duration: number;
  delay: number;
  dx: number;
  opacity: number;
}

export function generateStars(count: number, seed = 42): Star[] {
  const rand = mulberry32(seed);
  return Array.from({ length: count }, (_, id) => ({
    id,
    top: rand() * 100,
    left: rand() * 100,
    size: 1 + rand() * 1.6,
    duration: 3 + rand() * 4,
    delay: rand() * 5,
    minOpacity: 0.1 + rand() * 0.15,
    maxOpacity: 0.5 + rand() * 0.4,
  }));
}

export function generateParticles(count: number, seed = 7): Particle[] {
  const rand = mulberry32(seed);
  return Array.from({ length: count }, (_, id) => ({
    id,
    top: 55 + rand() * 45,
    left: rand() * 100,
    size: 2 + rand() * 3,
    duration: 32 + rand() * 26,
    delay: rand() * 30,
    dx: (rand() - 0.5) * 40,
    opacity: 0.25 + rand() * 0.35,
  }));
}
