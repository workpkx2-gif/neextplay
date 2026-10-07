/**
 * NeextPlay Aviator Flight Arena Canvas
 * 60 FPS Canvas with 3D-styled Red Monoplane, Aerodynamic Flight Physics,
 * Dynamic Multi-Stage Sky (Radar -> Stratosphere -> Cosmic Nebula -> Orbital Void),
 * Procedural Cloud Drift, Supersonic Wind Streaks, Rotating Radar Sweeper,
 * Continuous Soaring Airborne Flight, Screen Shake & Shockwave on Crash.
 */

import React, { useEffect, useRef } from 'react';

interface AviatorCanvasProps {
  gameState: 'WAITING' | 'FLYING' | 'CRASHED';
  currentMultiplier: number;
  countdownRemaining: number;
  crashPoint: number;
  className?: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
}

interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  alpha: number;
  twinklePhase: number;
}

interface Cloud {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  alpha: number;
}

interface SpeedStreak {
  x: number;
  y: number;
  length: number;
  speed: number;
  alpha: number;
  width: number;
}

interface Shockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
}

interface MilestoneSpark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
}

export const AviatorCanvas: React.FC<AviatorCanvasProps> = ({
  gameState,
  currentMultiplier,
  countdownRemaining,
  crashPoint,
  className,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const starsRef = useRef<Star[]>([]);
  const cloudsRef = useRef<Cloud[]>([]);
  const speedStreaksRef = useRef<SpeedStreak[]>([]);
  const shockwavesRef = useRef<Shockwave[]>([]);
  const sparksRef = useRef<MilestoneSpark[]>([]);

  const animFrameRef = useRef<number | null>(null);
  const planeRotationRef = useRef<number>(-0.25);
  const flyAwayProgressRef = useRef<number>(0);
  const radarAngleRef = useRef<number>(0);
  const shakeTimerRef = useRef<number>(0);
  const lastMilestoneRef = useRef<number>(1);

  // Initialize starfield, clouds, and speed streaks
  useEffect(() => {
    // 1. Stars with twinkle phases
    const stars: Star[] = [];
    for (let i = 0; i < 70; i++) {
      stars.push({
        x: Math.random() * 1000,
        y: Math.random() * 600,
        size: Math.random() * 2.2 + 0.6,
        speed: Math.random() * 0.9 + 0.3,
        alpha: Math.random() * 0.8 + 0.2,
        twinklePhase: Math.random() * Math.PI * 2,
      });
    }
    starsRef.current = stars;

    // 2. Volumetric drifting clouds
    const clouds: Cloud[] = [];
    for (let i = 0; i < 6; i++) {
      clouds.push({
        x: Math.random() * 1000,
        y: 60 + Math.random() * 320,
        width: 140 + Math.random() * 160,
        height: 40 + Math.random() * 45,
        speed: 0.3 + Math.random() * 0.5,
        alpha: 0.08 + Math.random() * 0.12,
      });
    }
    cloudsRef.current = clouds;

    // 3. Supersonic wind streaks
    const streaks: SpeedStreak[] = [];
    for (let i = 0; i < 16; i++) {
      streaks.push({
        x: Math.random() * 1000,
        y: Math.random() * 600,
        length: 40 + Math.random() * 120,
        speed: 4 + Math.random() * 9,
        alpha: 0.15 + Math.random() * 0.35,
        width: 1 + Math.random() * 1.5,
      });
    }
    speedStreaksRef.current = streaks;
  }, []);

  // Multiplier milestone spark trigger
  useEffect(() => {
    const milestones = [2, 5, 10, 25, 50, 100, 250, 500];
    for (const m of milestones) {
      if (currentMultiplier >= m && lastMilestoneRef.current < m) {
        lastMilestoneRef.current = m;
        // Burst 25 golden sparks on milestone
        const canvas = canvasRef.current;
        if (canvas) {
          const cx = canvas.width * 0.55;
          const cy = canvas.height * 0.45;
          for (let i = 0; i < 24; i++) {
            const angle = Math.random() * Math.PI * 2;
            const spd = Math.random() * 4.5 + 2.0;
            sparksRef.current.push({
              x: cx,
              y: cy,
              vx: Math.cos(angle) * spd,
              vy: Math.sin(angle) * spd,
              size: Math.random() * 3.5 + 2.0,
              alpha: 1.0,
              color: i % 2 === 0 ? '#fbbf24' : '#f43f5e',
            });
          }
        }
        break;
      }
    }
    if (gameState === 'WAITING') {
      lastMilestoneRef.current = 1;
    }
  }, [currentMultiplier, gameState]);

  // Main 60 FPS Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRunning = true;

    const render = () => {
      if (!isRunning) return;

      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const displayWidth = Math.floor(rect.width * dpr);
      const displayHeight = Math.floor(rect.height * dpr);

      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
      }

      const width = canvas.width;
      const height = canvas.height;

      ctx.save();
      ctx.scale(dpr, dpr);
      const w = width / dpr;
      const h = height / dpr;

      // Handle Screen Shake on Crash
      if (gameState === 'CRASHED' && shakeTimerRef.current < 20) {
        shakeTimerRef.current++;
        const shakeMag = Math.max(0, (20 - shakeTimerRef.current) * 0.6);
        const sx = (Math.random() - 0.5) * shakeMag;
        const sy = (Math.random() - 0.5) * shakeMag;
        ctx.translate(sx, sy);
      } else if (gameState !== 'CRASHED') {
        shakeTimerRef.current = 0;
      }

      // ==========================================
      // 1. DYNAMIC SKY BACKGROUND (Altitude Themed)
      // ==========================================
      const isFlying = gameState === 'FLYING';
      const isCrashed = gameState === 'CRASHED';
      const logMult = Math.log(Math.max(1, currentMultiplier));

      const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
      if (isFlying || isCrashed) {
        if (currentMultiplier < 2.0) {
          // Low Altitude Flight
          bgGrad.addColorStop(0, '#090e17');
          bgGrad.addColorStop(0.5, '#0d131f');
          bgGrad.addColorStop(1, '#111827');
        } else if (currentMultiplier < 5.0) {
          // Stratosphere Ascent
          bgGrad.addColorStop(0, '#060c1d');
          bgGrad.addColorStop(0.6, '#0f172a');
          bgGrad.addColorStop(1, '#1e1b4b');
        } else if (currentMultiplier < 15.0) {
          // Ionosphere Deep Violet
          bgGrad.addColorStop(0, '#0f0728');
          bgGrad.addColorStop(0.5, '#1e1035');
          bgGrad.addColorStop(1, '#2e1065');
        } else {
          // Orbital Void & Cosmic Radiance
          bgGrad.addColorStop(0, '#030712');
          bgGrad.addColorStop(0.5, '#180424');
          bgGrad.addColorStop(1, '#4c0519');
        }
      } else {
        // Pre-Flight Radar Grid Ambient
        bgGrad.addColorStop(0, '#070b13');
        bgGrad.addColorStop(0.5, '#0a0f1d');
        bgGrad.addColorStop(1, '#0e1626');
      }

      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // ==========================================
      // 2. STARFIELD PARALLAX & TWINKLE
      // ==========================================
      ctx.save();
      starsRef.current.forEach(star => {
        const starSpeedFactor = isFlying ? 1 + logMult * 1.5 : 0.4;
        star.x -= star.speed * starSpeedFactor;
        if (star.x < 0) {
          star.x = w + 10;
          star.y = Math.random() * h;
        }

        const twinkle = 0.5 + 0.5 * Math.sin(Date.now() / 400 + star.twinklePhase);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha * twinkle})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();

      // ==========================================
      // 3. DRIFTING CLOUDS (PARALLAX)
      // ==========================================
      cloudsRef.current.forEach(cloud => {
        const cloudSpeed = isFlying ? cloud.speed * (1 + logMult * 1.2) : cloud.speed * 0.5;
        cloud.x -= cloudSpeed;
        if (cloud.x + cloud.width < 0) {
          cloud.x = w + Math.random() * 80;
          cloud.y = 40 + Math.random() * (h * 0.6);
        }

        ctx.save();
        const cloudGrad = ctx.createRadialGradient(
          cloud.x + cloud.width * 0.5,
          cloud.y + cloud.height * 0.5,
          cloud.height * 0.2,
          cloud.x + cloud.width * 0.5,
          cloud.y + cloud.height * 0.5,
          cloud.width * 0.5
        );
        cloudGrad.addColorStop(0, `rgba(148, 163, 184, ${cloud.alpha})`);
        cloudGrad.addColorStop(1, 'rgba(148, 163, 184, 0)');
        ctx.fillStyle = cloudGrad;
        ctx.beginPath();
        ctx.ellipse(
          cloud.x + cloud.width * 0.5,
          cloud.y + cloud.height * 0.5,
          cloud.width * 0.5,
          cloud.height * 0.5,
          0,
          0,
          Math.PI * 2
        );
        ctx.fill();
        ctx.restore();
      });

      // ==========================================
      // 4. SUPERSONIC SPEED WIND STREAKS (High Speed Flight)
      // ==========================================
      if (isFlying && currentMultiplier >= 2.0) {
        ctx.save();
        speedStreaksRef.current.forEach(streak => {
          streak.x -= streak.speed * (1 + logMult * 0.8);
          if (streak.x + streak.length < 0) {
            streak.x = w + Math.random() * 100;
            streak.y = Math.random() * h;
          }

          const streakGrad = ctx.createLinearGradient(streak.x, streak.y, streak.x + streak.length, streak.y);
          streakGrad.addColorStop(0, `rgba(244, 63, 94, ${streak.alpha * 0.8})`);
          streakGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.strokeStyle = streakGrad;
          ctx.lineWidth = streak.width;
          ctx.beginPath();
          ctx.moveTo(streak.x, streak.y);
          ctx.lineTo(streak.x + streak.length, streak.y);
          ctx.stroke();
        });
        ctx.restore();
      }

      // ==========================================
      // 5. RADAR CIRCLES & ROTATING SWEEPER BEAM
      // ==========================================
      radarAngleRef.current += isFlying ? 0.024 : 0.012;
      const radarCenterX = w * 0.45;
      const radarCenterY = h * 0.50;
      const maxRadarRadius = Math.min(w, h) * 0.65;

      ctx.save();
      ctx.strokeStyle = 'rgba(51, 65, 85, 0.28)';
      ctx.lineWidth = 1;
      [0.3, 0.6, 0.9].forEach(r => {
        ctx.beginPath();
        ctx.arc(radarCenterX, radarCenterY, maxRadarRadius * r, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Rotating radar sweep cone
      const sweepAngle = radarAngleRef.current;
      const sweepGrad = ctx.createRadialGradient(
        radarCenterX,
        radarCenterY,
        0,
        radarCenterX,
        radarCenterY,
        maxRadarRadius
      );
      sweepGrad.addColorStop(0, 'rgba(239, 68, 68, 0.08)');
      sweepGrad.addColorStop(1, 'rgba(239, 68, 68, 0.0)');

      ctx.fillStyle = sweepGrad;
      ctx.beginPath();
      ctx.moveTo(radarCenterX, radarCenterY);
      ctx.arc(radarCenterX, radarCenterY, maxRadarRadius, sweepAngle, sweepAngle + 0.45);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // ==========================================
      // 6. MODERN RADAR GRID & FLIGHT AXES
      // ==========================================
      ctx.save();
      ctx.strokeStyle = 'rgba(51, 65, 85, 0.25)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);

      // Vertical radar grid columns
      const vCols = 6;
      for (let i = 1; i < vCols; i++) {
        const x = (w / vCols) * i;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }

      // Horizontal radar grid rows
      const hRows = 5;
      for (let i = 1; i <= hRows; i++) {
        const y = (h / hRows) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Flight Origin Base Point (Bottom Left Coordinates)
      const originX = 50;
      const originY = h - 55;

      // ==========================================
      // 7. COMPUTE AIRCRAFT POSITION & DYNAMICS
      // ==========================================
      // Continuous Airborne Flight: Plane is ALWAYS flying gracefully during the round before crash!
      let planeX = originX;
      let planeY = originY;
      let targetRotation = -0.32; // Default climb pitch (~ -18 deg)

      if (isFlying) {
        flyAwayProgressRef.current = 0;

        // Smooth takeoff into active airborne flight:
        // As multiplier starts, plane immediately lifts off and soars into the arena!
        const climbFactor = Math.min(1.0, (currentMultiplier - 1.0) / 0.12);
        const progressX = Math.min(0.85, 0.18 + (1 - Math.exp(-logMult * 0.95)) * 0.65);
        const progressY = Math.min(0.82, 0.20 * climbFactor + (1 - Math.exp(-logMult * 0.88)) * 0.60);

        planeX = originX + (w - originX - 85) * progressX;
        planeY = originY - (originY - 55) * progressY;

        // Dynamic aerodynamic turbulence wobble (sine sway)
        const wobble = Math.sin(Date.now() / 220) * 3.5;
        planeY += wobble;

        // Tangent angle of climb with micro adjustments
        const dx = (w - originX - 85) * 0.22;
        const dy = -(originY - 55) * 0.24;
        targetRotation = Math.atan2(dy, dx) + Math.sin(Date.now() / 320) * 0.04;
      } else if (isCrashed) {
        // Plane rockets away at hypervelocity off the top-right screen
        flyAwayProgressRef.current += 0.048;
        const crashLog = Math.log(crashPoint || currentMultiplier);
        const lastX = originX + (w - originX - 85) * Math.min(0.85, 0.18 + (1 - Math.exp(-crashLog * 0.95)) * 0.65);
        const lastY = originY - (originY - 55) * Math.min(0.82, 0.20 + (1 - Math.exp(-crashLog * 0.88)) * 0.60);

        planeX = lastX + flyAwayProgressRef.current * 900;
        planeY = lastY - flyAwayProgressRef.current * 550;
        targetRotation = -0.62;

        // Spawn expanding supersonic shockwave ring on crash start
        if (shockwavesRef.current.length === 0 && flyAwayProgressRef.current < 0.1) {
          shockwavesRef.current.push({
            x: lastX,
            y: lastY,
            radius: 8,
            maxRadius: 200,
            alpha: 0.95,
          });
        }
      } else {
        // WAITING: Plane rests ready at takeoff position with subtle breathing suspension
        const suspensionBob = Math.sin(Date.now() / 420) * 1.5;
        planeX = originX + 15;
        planeY = originY + suspensionBob;
        targetRotation = -0.15;
        flyAwayProgressRef.current = 0;
        shockwavesRef.current = [];
      }

      // Smooth rotation dampening
      planeRotationRef.current += (targetRotation - planeRotationRef.current) * 0.16;

      // ==========================================
      // 8. EXPANDING SUPERSONIC SHOCKWAVE (On Crash)
      // ==========================================
      shockwavesRef.current.forEach((sw, idx) => {
        sw.radius += 5.5;
        sw.alpha -= 0.025;

        if (sw.alpha <= 0 || sw.radius >= sw.maxRadius) {
          shockwavesRef.current.splice(idx, 1);
          return;
        }

        ctx.save();
        ctx.strokeStyle = `rgba(239, 68, 68, ${sw.alpha})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = `rgba(251, 146, 60, ${sw.alpha * 0.6})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius * 0.7, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      });

      // ==========================================
      // 9. FLIGHT BEZIER CURVE & RADIANT RED GLOW
      // ==========================================
      if (isFlying || isCrashed) {
        const startX = originX;
        const startY = originY;
        const controlX = startX + (planeX - startX) * 0.55;
        const controlY = startY;

        // Radiant Area Gradient Fill Under Flight Curve
        const areaGrad = ctx.createLinearGradient(0, planeY, 0, h);
        areaGrad.addColorStop(0, 'rgba(225, 29, 72, 0.42)'); // Crimson glow
        areaGrad.addColorStop(0.40, 'rgba(225, 29, 72, 0.18)');
        areaGrad.addColorStop(1, 'rgba(225, 29, 72, 0.0)');

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(controlX, controlY, planeX, planeY);
        ctx.lineTo(planeX, h);
        ctx.lineTo(startX, h);
        ctx.closePath();
        ctx.fillStyle = areaGrad;
        ctx.fill();

        // High-Intensity Neon Crimson Flight Arc Curve
        ctx.save();
        ctx.shadowColor = '#e11d48';
        ctx.shadowBlur = 24;
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 4.2;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(controlX, controlY, planeX, planeY);
        ctx.stroke();
        ctx.restore();

        // Dynamic Exhaust Particle Emission
        if (isFlying && Math.random() < 0.85) {
          const tailAngle = planeRotationRef.current + Math.PI;
          const tailX = planeX + Math.cos(tailAngle) * 36;
          const tailY = planeY + Math.sin(tailAngle) * 36;

          particlesRef.current.push({
            x: tailX,
            y: tailY,
            vx: Math.cos(tailAngle) * (Math.random() * 2.8 + 2.2) + (Math.random() - 0.5) * 1.2,
            vy: Math.sin(tailAngle) * (Math.random() * 2.8 + 2.2) + (Math.random() - 0.5) * 1.2,
            size: Math.random() * 4.2 + 2.5,
            alpha: 0.95,
            color: Math.random() > 0.5 ? '#f43f5e' : Math.random() > 0.3 ? '#fb923c' : '#fef08a',
          });
        }
      }

      // ==========================================
      // 10. UPDATE & RENDER JET EXHAUST PARTICLES
      // ==========================================
      particlesRef.current.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.024;
        p.size *= 0.96;

        if (p.alpha <= 0) {
          particlesRef.current.splice(idx, 1);
          return;
        }

        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      // ==========================================
      // 11. RENDER MILESTONE CELEBRATION SPARKS
      // ==========================================
      sparksRef.current.forEach((sp, idx) => {
        sp.x += sp.vx;
        sp.y += sp.vy;
        sp.vy += 0.08;
        sp.alpha -= 0.02;
        sp.size *= 0.97;

        if (sp.alpha <= 0) {
          sparksRef.current.splice(idx, 1);
          return;
        }

        ctx.fillStyle = sp.color;
        ctx.globalAlpha = Math.max(0, sp.alpha);
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      // ==========================================
      // 12. DRAW 3D-STYLED RED MONOPLANE AIRCRAFT
      // ==========================================
      if (!isCrashed || flyAwayProgressRef.current < 1.4) {
        ctx.save();
        ctx.translate(planeX, planeY);
        ctx.rotate(planeRotationRef.current);

        // Aircraft aerodynamic glow halo
        ctx.save();
        ctx.shadowColor = '#dc2626';
        ctx.shadowBlur = 18;
        ctx.fillStyle = 'rgba(239, 68, 68, 0.12)';
        ctx.beginPath();
        ctx.ellipse(0, 0, 48, 22, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // --- A. Main Airplane Fuselage Body (Sculpted 3D Metallic Red) ---
        ctx.save();
        const fuseGrad = ctx.createLinearGradient(0, -11, 0, 11);
        fuseGrad.addColorStop(0, '#f87171');   // Light highlight top
        fuseGrad.addColorStop(0.35, '#dc2626'); // Rich racing crimson
        fuseGrad.addColorStop(0.85, '#991b1b'); // Deep underside shadow
        fuseGrad.addColorStop(1, '#7f1d1d');

        ctx.fillStyle = fuseGrad;
        ctx.beginPath();
        ctx.moveTo(34, 0); // Nose apex
        // Top cowl curve
        ctx.bezierCurveTo(28, -8, 10, -11, -8, -10);
        // Cockpit transition & dorsal spine
        ctx.bezierCurveTo(-22, -9, -32, -6, -42, -2);
        // Empennage & tail tip
        ctx.lineTo(-44, 2);
        // Ventral belly curve
        ctx.bezierCurveTo(-34, 8, -20, 10, -6, 9);
        // Lower chin curve to nose
        ctx.bezierCurveTo(12, 8, 26, 6, 34, 0);
        ctx.closePath();
        ctx.fill();

        // White aviation race trim stripe along fuselage
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(24, 0);
        ctx.bezierCurveTo(8, -1.5, -15, -1, -36, 0.5);
        ctx.stroke();
        ctx.restore();

        // --- B. Swept Main Monoplane Wings ---
        ctx.save();
        // Lower / Port Main Wing (Swept aerodynamic foil)
        const wingGrad = ctx.createLinearGradient(-15, 0, -15, 28);
        wingGrad.addColorStop(0, '#ef4444');
        wingGrad.addColorStop(0.5, '#dc2626');
        wingGrad.addColorStop(1, '#991b1b');

        ctx.fillStyle = wingGrad;
        ctx.beginPath();
        ctx.moveTo(10, 3);
        ctx.lineTo(-8, 26);
        ctx.lineTo(-24, 25);
        ctx.lineTo(-14, 4);
        ctx.closePath();
        ctx.fill();

        // Upper / Starboard Main Wing (Back perspective)
        const upperWingGrad = ctx.createLinearGradient(0, -3, -12, -26);
        upperWingGrad.addColorStop(0, '#b91c1c');
        upperWingGrad.addColorStop(1, '#7f1d1d');

        ctx.fillStyle = upperWingGrad;
        ctx.beginPath();
        ctx.moveTo(8, -4);
        ctx.lineTo(-10, -24);
        ctx.lineTo(-22, -23);
        ctx.lineTo(-12, -3);
        ctx.closePath();
        ctx.fill();

        // Starboard & Port Wingtip Navigation Strobes
        // Port: Red strobe light
        const strobePhase = Math.sin(Date.now() / 150) > 0;
        ctx.fillStyle = strobePhase ? '#ef4444' : '#7f1d1d';
        ctx.beginPath();
        ctx.arc(-8, 26, 2.2, 0, Math.PI * 2);
        ctx.fill();

        // Starboard: Green strobe light
        ctx.fillStyle = strobePhase ? '#10b981' : '#064e3b';
        ctx.beginPath();
        ctx.arc(-10, -24, 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // --- C. Vertical Stabilizer & Rudder Tail Fin ---
        ctx.save();
        const finGrad = ctx.createLinearGradient(-35, 0, -42, -22);
        finGrad.addColorStop(0, '#dc2626');
        finGrad.addColorStop(1, '#991b1b');

        ctx.fillStyle = finGrad;
        ctx.beginPath();
        ctx.moveTo(-32, -4);
        ctx.lineTo(-44, -20);
        ctx.lineTo(-49, -19);
        ctx.lineTo(-41, -1);
        ctx.closePath();
        ctx.fill();

        // Horizontal tail stabilizer
        ctx.fillStyle = '#b91c1c';
        ctx.beginPath();
        ctx.moveTo(-35, 1);
        ctx.lineTo(-46, 12);
        ctx.lineTo(-50, 11);
        ctx.lineTo(-42, 2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // --- D. Aerodynamic Glass Bubble Cockpit Canopy ---
        ctx.save();
        const canopyGrad = ctx.createLinearGradient(-4, -12, 10, -2);
        canopyGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)'); // Sun glint
        canopyGrad.addColorStop(0.3, 'rgba(56, 189, 248, 0.75)'); // Cyan tinted glass
        canopyGrad.addColorStop(0.8, 'rgba(15, 23, 42, 0.85)');
        canopyGrad.addColorStop(1, 'rgba(2, 6, 23, 0.95)');

        ctx.fillStyle = canopyGrad;
        ctx.beginPath();
        ctx.moveTo(14, -4);
        ctx.bezierCurveTo(10, -12, -4, -13, -12, -7);
        ctx.lineTo(-12, -3);
        ctx.bezierCurveTo(-2, -3, 6, -3, 14, -4);
        ctx.closePath();
        ctx.fill();

        // Chrome canopy frame edge
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 1.0;
        ctx.stroke();

        // Pilot silhouette & helmet inside canopy
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(0, -7, 3.2, 0, Math.PI * 2);
        ctx.fill();

        // Pilot glowing visor
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(1, -7.5, 2.2, 1.4);
        ctx.restore();

        // --- E. Engine Cowl & Metallic Nose Bullet ---
        ctx.save();
        const cowlGrad = ctx.createLinearGradient(32, -6, 39, 6);
        cowlGrad.addColorStop(0, '#ffffff');
        cowlGrad.addColorStop(0.5, '#94a3b8');
        cowlGrad.addColorStop(1, '#475569');

        ctx.fillStyle = cowlGrad;
        ctx.beginPath();
        ctx.ellipse(34, 0, 3.8, 5.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Glossy red spinner cone
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.arc(37, 0, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // --- F. Spinning Propeller Disc & Motion Blur ---
        ctx.save();
        const propSpeed = isFlying ? 12 : 28;
        const propPhase = (Date.now() / propSpeed) % (Math.PI * 2);

        // Motion blur transparent propeller disc
        ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
        ctx.beginPath();
        ctx.ellipse(38, 0, 3, 20, 0, 0, Math.PI * 2);
        ctx.fill();

        // Rotating twin blade gleams
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.lineWidth = 2.2;
        const bladeLen = 19 * Math.abs(Math.sin(propPhase));
        ctx.beginPath();
        ctx.moveTo(38, -bladeLen);
        ctx.lineTo(38, bladeLen);
        ctx.stroke();

        // Yellow painted propeller blade tips tracing orbit
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(38, -bladeLen, 1.6, 0, Math.PI * 2);
        ctx.arc(38, bladeLen, 1.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // --- G. Dual Jet Afterburner / Exhaust Nozzle Thrust Flares ---
        if (isFlying || isCrashed) {
          ctx.save();
          const flameLength = 16 + Math.min(35, logMult * 14) + Math.sin(Date.now() / 35) * 4;
          const flameWidth = 5 + Math.min(6, logMult * 2.5);

          // Outer fiery crimson aura
          ctx.fillStyle = 'rgba(244, 63, 94, 0.8)';
          ctx.beginPath();
          ctx.moveTo(-42, -flameWidth * 0.5);
          ctx.lineTo(-42 - flameLength, 0);
          ctx.lineTo(-42, flameWidth * 0.5);
          ctx.closePath();
          ctx.fill();

          // Intermediate bright orange flare
          ctx.fillStyle = 'rgba(251, 146, 60, 0.9)';
          ctx.beginPath();
          ctx.moveTo(-42, -flameWidth * 0.35);
          ctx.lineTo(-42 - flameLength * 0.7, 0);
          ctx.lineTo(-42, flameWidth * 0.35);
          ctx.closePath();
          ctx.fill();

          // Electric white-hot core
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.moveTo(-42, -flameWidth * 0.2);
          ctx.lineTo(-42 - flameLength * 0.4, 0);
          ctx.lineTo(-42, flameWidth * 0.2);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }

        ctx.restore();
      }

      // ==========================================
      // 13. AXIS TIME & MULTIPLIER TICKS (Radar HUD)
      // ==========================================
      ctx.fillStyle = 'rgba(148, 163, 184, 0.45)';
      ctx.font = '10px monospace';
      ctx.fillText('0s', originX, h - 15);
      ctx.fillText('5s', originX + (w - originX) * 0.35, h - 15);
      ctx.fillText('10s', originX + (w - originX) * 0.70, h - 15);

      ctx.fillText('1.00x', 8, originY + 4);
      ctx.fillText('2.00x', 8, originY - (originY - 55) * 0.35);
      ctx.fillText('5.00x', 8, originY - (originY - 55) * 0.70);

      ctx.restore();

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      isRunning = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [gameState, currentMultiplier, crashPoint]);

  // Compute Spribe-authentic color theme for the central multiplier number
  const getMultiplierColorClass = (mult: number) => {
    if (mult < 2.0) return 'text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.4)]';
    if (mult < 5.0) return 'text-sky-300 drop-shadow-[0_0_35px_rgba(56,189,248,0.7)]';
    if (mult < 10.0) return 'text-purple-300 drop-shadow-[0_0_40px_rgba(168,85,247,0.8)]';
    if (mult < 50.0) return 'text-amber-300 drop-shadow-[0_0_45px_rgba(245,158,11,0.85)]';
    return 'text-rose-400 drop-shadow-[0_0_55px_rgba(244,63,94,0.95)]';
  };

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden bg-[#070b14] border border-slate-800 shadow-[0_10px_40px_rgba(0,0,0,0.6)] flex items-center justify-center select-none ${
        className || 'h-[320px] sm:h-[380px]'
      }`}
    >
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* ============================================================== */}
      {/* COMPOSED TOP RADAR TELEMETRY: CONTINUOUS FLIGHT STATUS DISPLAY  */}
      {/* ============================================================== */}
      <div className="absolute top-3 left-4 flex items-center gap-2.5 px-3 py-1 rounded-full bg-slate-950/80 border border-slate-700/60 backdrop-blur-md shadow-lg pointer-events-none z-10">
        <span
          className={`w-2 h-2 rounded-full ${
            gameState === 'FLYING'
              ? 'bg-emerald-400 animate-pulse'
              : gameState === 'CRASHED'
              ? 'bg-rose-500'
              : 'bg-amber-400'
          }`}
        />
        <span className="text-[11px] font-mono font-bold tracking-wider text-slate-200 uppercase">
          {gameState === 'FLYING'
            ? `AERODYNAMIC CLIMB • ${((currentMultiplier - 1.0) * 850 + 140).toFixed(0)}m`
            : gameState === 'CRASHED'
            ? 'SUPERSONIC FLEW AWAY'
            : 'PRE-FLIGHT READY'}
        </span>
      </div>

      {/* ========================================== */}
      {/* HUD OVERLAYS ACCORDING TO GAME STATE       */}
      {/* ========================================== */}

      {/* A. WAITING FOR NEXT ROUND OVERLAY */}
      {gameState === 'WAITING' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/45 backdrop-blur-[2px] z-10 space-y-3 pointer-events-none animate-in fade-in">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700/80 shadow-md">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-200">
              WAITING FOR NEXT ROUND
            </span>
          </div>

          {/* Spribe-authentic glowing countdown progress bar */}
          <div className="w-60 sm:w-80 h-3 bg-slate-900/90 rounded-full border border-slate-700/80 overflow-hidden shadow-inner p-0.5">
            <div
              className="h-full bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 transition-all duration-100 ease-linear rounded-full shadow-lg shadow-red-500/50"
              style={{
                width: `${Math.max(0, Math.min(100, (countdownRemaining / 5.0) * 100))}%`,
              }}
            />
          </div>

          <div className="text-2xl sm:text-3xl font-black font-mono text-white tracking-wider drop-shadow-md">
            {countdownRemaining.toFixed(1)}s
          </div>
        </div>
      )}

      {/* B. FLYING STATE HUD: PURE, CLEAN GIANT CENTER MULTIPLIER (UNOBSTRUCTED) */}
      {gameState === 'FLYING' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
          <div
            className={`text-6xl sm:text-7xl lg:text-8xl font-black font-mono tracking-tighter transform scale-100 transition-all duration-75 ${getMultiplierColorClass(
              currentMultiplier
            )}`}
          >
            {currentMultiplier.toFixed(2)}x
          </div>
        </div>
      )}

      {/* C. CRASHED / FLEW AWAY OVERLAY */}
      {gameState === 'CRASHED' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10 space-y-1 animate-in zoom-in-95 duration-200">
          <div className="text-3xl sm:text-5xl font-black tracking-widest text-red-500 uppercase drop-shadow-[0_0_30px_rgba(239,68,68,0.9)] animate-pulse">
            FLEW AWAY!
          </div>
          <div className="text-5xl sm:text-7xl font-black font-mono text-slate-100 drop-shadow-lg">
            {crashPoint.toFixed(2)}x
          </div>
        </div>
      )}
    </div>
  );
};
