import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useVisualEffects } from "@/hooks/useVisualEffects";
import { useMouseParallax } from "@/hooks/useMouseParallax";
import { getAtmosphere } from "@/lib/page-atmosphere";
import { generateStars, generateParticles } from "./starfield";

const PLANETS = [
  { size: 320, top: -8, left: -6, depth: 8, float: "a", gradientDark: "circle at 35% 30%, #4c1d95, #1e1b4b 70%", gradientLight: "circle at 35% 30%, #c7d2fe, #e0e7ff 70%" },
  { size: 220, top: 55, left: 82, depth: 14, float: "b", gradientDark: "circle at 40% 35%, #1e3a8a, #0b1220 70%", gradientLight: "circle at 40% 35%, #bfdbfe, #eff6ff 70%" },
  { size: 160, top: 78, left: 8, depth: 20, float: "a", gradientDark: "circle at 45% 40%, #164e3d, #0b1220 70%", gradientLight: "circle at 45% 40%, #bbf7d0, #ecfdf5 70%" },
  { size: 130, top: 8, left: 70, depth: 26, float: "b", gradientDark: "circle at 40% 30%, #7c2d12, #1c0f0a 70%", gradientLight: "circle at 40% 30%, #fed7aa, #fff7ed 70%" },
] as const;

/**
 * Renders behind all page content (see AppShell). Every layer is optional and
 * independently controlled from Settings > Visual Effects; the master
 * `ambientBackground` toggle gates the whole thing including the base gradient.
 */
export function AmbientBackground() {
  const { pathname } = useLocation();
  const atmosphere = getAtmosphere(pathname);
  const effects = useVisualEffects();
  const parallaxRef = useMouseParallax(effects.mouseParallax);

  const stars = useMemo(() => generateStars(55), []);
  const particles = useMemo(() => generateParticles(14), []);

  if (!effects.ambientBackground) return null;

  return (
    <div ref={parallaxRef} className="ambient-root" data-atmosphere={atmosphere} aria-hidden="true">
      <div className="ambient-layer ambient-space-gradient" />
      <div className="ambient-layer ambient-nebula" />
      <div className="ambient-layer ambient-atmosphere-tint" />

      {effects.starField && (
        <div className="ambient-layer">
          {stars.map((s) => (
            <span
              key={s.id}
              className="ambient-star"
              style={
                {
                  top: `${s.top}%`,
                  left: `${s.left}%`,
                  width: `${s.size}px`,
                  height: `${s.size}px`,
                  "--star-duration": `${s.duration}s`,
                  "--star-delay": `${s.delay}s`,
                  "--star-min": s.minOpacity,
                  "--star-max": s.maxOpacity,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
      )}

      {effects.floatingPlanets &&
        PLANETS.map((p, i) => (
          <div
            key={i}
            className="ambient-planet-wrap"
            style={{ top: `${p.top}%`, left: `${p.left}%`, "--depth": p.depth } as React.CSSProperties}
          >
            <div
              className={`ambient-planet ${p.float === "a" ? "ambient-planet-float-a" : "ambient-planet-float-b"}`}
              style={
                {
                  width: p.size,
                  height: p.size,
                  "--planet-light": `radial-gradient(${p.gradientLight})`,
                  "--planet-dark": `radial-gradient(${p.gradientDark})`,
                } as React.CSSProperties
              }
            />
          </div>
        ))}

      {effects.floatingParticles && (
        <div className="ambient-layer">
          {particles.map((p) => (
            <span
              key={p.id}
              className="ambient-particle"
              style={
                {
                  top: `${p.top}%`,
                  left: `${p.left}%`,
                  width: `${p.size}px`,
                  height: `${p.size}px`,
                  "--particle-duration": `${p.duration}s`,
                  "--particle-delay": `${p.delay}s`,
                  "--particle-dx": `${p.dx}px`,
                  "--particle-dy": "-160px",
                  "--particle-opacity": p.opacity,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
