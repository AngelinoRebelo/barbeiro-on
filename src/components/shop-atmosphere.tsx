"use client";

import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  gold: boolean;
  phase: number;
};

type Ripple = {
  x: number;
  y: number;
  r: number;
  max: number;
  gold: boolean;
};

function contentBounds(w: number) {
  const content = Math.min(1152, Math.max(720, w - 48));
  const left = (w - content) / 2;
  return { left, right: left + content, gutter: left };
}

function inGutter(x: number, w: number) {
  const { left, right } = contentBounds(w);
  return x < left - 8 || x > right + 8;
}

function clampToGutter(p: Particle, w: number, h: number) {
  const { left, right } = contentBounds(w);
  const pad = 18;
  if (p.x >= left - 8 && p.x <= right + 8) {
    if (p.x < w / 2) {
      p.x = left - 24;
      p.vx = -Math.abs(p.vx) * 0.35;
    } else {
      p.x = right + 24;
      p.vx = Math.abs(p.vx) * 0.35;
    }
  }
  if (p.x < pad) {
    p.x = pad;
    p.vx *= -0.6;
  }
  if (p.x > w - pad) {
    p.x = w - pad;
    p.vx *= -0.6;
  }
  if (p.y < pad) {
    p.y = pad;
    p.vy *= -0.6;
  }
  if (p.y > h - pad) {
    p.y = h - pad;
    p.vy *= -0.6;
  }
}

function spawn(w: number, h: number): Particle {
  const { left, right } = contentBounds(w);
  const leftSide = Math.random() < 0.5;
  const x = leftSide
    ? 20 + Math.random() * Math.max(24, left - 40)
    : right + 20 + Math.random() * Math.max(24, w - right - 40);
  return {
    x,
    y: 40 + Math.random() * (h - 80),
    vx: (Math.random() - 0.5) * 0.28,
    vy: (Math.random() - 0.5) * 0.28,
    r: 0.7 + Math.random() * 1.8,
    gold: leftSide ? Math.random() > 0.28 : Math.random() < 0.32,
    phase: Math.random() * Math.PI * 2,
  };
}

function color(gold: boolean, a: number) {
  return gold ? `rgba(212, 175, 55, ${a})` : `rgba(62, 232, 200, ${a})`;
}

export function ShopAtmosphere() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mouse = { x: -9999, y: -9999 };
    let particles: Particle[] = [];
    let ripples: Ripple[] = [];
    let raf = 0;
    let t = 0;
    let w = 0;
    let h = 0;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas!.width = Math.floor(w * dpr);
      canvas!.height = Math.floor(h * dpr);
      canvas!.style.width = `${w}px`;
      canvas!.style.height = `${h}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      const { gutter } = contentBounds(w);
      const count = gutter < 110 ? 0 : Math.round(Math.min(140, gutter * 0.24));
      particles = Array.from({ length: count }, () => spawn(w, h));
    }

    function drawHud(cx: number, cy: number, gold: boolean, angle: number) {
      const c = ctx!;
      const outer = Math.min(118, contentBounds(w).gutter * 0.42);
      if (outer < 48) return;

      c.save();
      c.translate(cx, cy);

      const ring = (radius: number, alpha: number, width: number) => {
        c.beginPath();
        c.arc(0, 0, radius, 0, Math.PI * 2);
        c.strokeStyle = color(gold, alpha);
        c.lineWidth = width;
        c.stroke();
      };

      ring(outer, 0.22, 1.2);
      ring(outer * 0.72, 0.12, 1);
      ring(outer * 0.28, 0.35, 1.4);

      for (let i = 0; i < 48; i++) {
        const a = (i / 48) * Math.PI * 2;
        const major = i % 6 === 0;
        const inner = outer - (major ? 14 : 7);
        c.beginPath();
        c.moveTo(Math.cos(a) * inner, Math.sin(a) * inner);
        c.lineTo(Math.cos(a) * outer, Math.sin(a) * outer);
        c.strokeStyle = color(gold, major ? 0.45 : 0.14);
        c.lineWidth = major ? 1.4 : 0.7;
        c.stroke();
      }

      if (outer >= 70) {
        c.fillStyle = color(gold, 0.4);
        c.font = "10px ui-monospace, monospace";
        c.textAlign = "center";
        c.textBaseline = "middle";
        c.fillText("12", 0, -outer - 14);
        c.fillText("3", outer + 14, 0);
        c.fillText("6", 0, outer + 14);
        c.fillText("9", -outer - 14, 0);
      }

      c.save();
      c.rotate(angle);
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(0, -outer * 0.78);
      c.strokeStyle = color(gold, 0.7);
      c.lineWidth = 1.6;
      c.lineCap = "round";
      c.stroke();
      c.beginPath();
      c.arc(0, -outer * 0.78, 3.2, 0, Math.PI * 2);
      c.fillStyle = color(gold, 0.9);
      c.fill();
      c.restore();
      c.restore();

      c.beginPath();
      c.arc(cx, cy, 4, 0, Math.PI * 2);
      c.fillStyle = color(gold, 0.85);
      c.fill();

      const sweep = t * (gold ? 0.35 : 0.55);
      c.beginPath();
      c.moveTo(cx, cy);
      c.arc(cx, cy, outer * 0.72, sweep, sweep + 0.7);
      c.closePath();
      c.fillStyle = color(gold, 0.05);
      c.fill();
    }

    function frame() {
      if (document.hidden) return;
      t += 0.016;
      const c = ctx!;
      c.clearRect(0, 0, w, h);
      const { left, right, gutter } = contentBounds(w);
      if (gutter < 110) {
        raf = requestAnimationFrame(frame);
        return;
      }

      const leftCx = gutter / 2;
      const rightCx = right + gutter / 2;
      const leftCy = h * 0.38;
      const rightCy = h * 0.58;
      const mouseGutter = inGutter(mouse.x, w);

      const leftAngle = mouseGutter && mouse.x < left
        ? Math.atan2(mouse.y - leftCy, mouse.x - leftCx) + Math.PI / 2
        : t * 0.22;
      const rightAngle = mouseGutter && mouse.x > right
        ? Math.atan2(mouse.y - rightCy, mouse.x - rightCx) + Math.PI / 2
        : t * 0.31;

      const glow = (cx: number, cy: number, gold: boolean) => {
        const g = c.createRadialGradient(cx, cy, 8, cx, cy, 220);
        g.addColorStop(0, color(gold, 0.16));
        g.addColorStop(1, "rgba(0,0,0,0)");
        c.fillStyle = g;
        c.beginPath();
        c.arc(cx, cy, 220, 0, Math.PI * 2);
        c.fill();
      };
      glow(leftCx, leftCy, true);
      glow(rightCx, rightCy, false);
      drawHud(leftCx, leftCy, true, leftAngle);
      drawHud(rightCx, rightCy, false, rightAngle);

      if (!reduced) {
        for (const p of particles) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.hypot(dx, dy) || 1;
          if (mouseGutter && dist < 180) {
            const force = (180 - dist) / 180;
            p.vx += (dx / dist) * force * 0.045;
            p.vy += (dy / dist) * force * 0.045;
          }
          p.vx += Math.sin(t + p.phase) * 0.004;
          p.vy += Math.cos(t * 0.8 + p.phase) * 0.004;
          p.vx *= 0.96;
          p.vy *= 0.96;
          p.x += p.vx;
          p.y += p.vy;
          clampToGutter(p, w, h);
        }

        for (let i = 0; i < particles.length; i++) {
          const a = particles[i];
          for (let j = i + 1; j < particles.length; j++) {
            const b = particles[j];
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const d = dx * dx + dy * dy;
            if (d > 95 * 95) continue;
            const alpha = (1 - Math.sqrt(d) / 95) * 0.22;
            c.beginPath();
            c.moveTo(a.x, a.y);
            c.lineTo(b.x, b.y);
            c.strokeStyle = color(a.gold || b.gold, alpha);
            c.lineWidth = 0.8;
            c.stroke();
          }
        }

        for (const p of particles) {
          const twinkle = 0.35 + Math.sin(t * 2.2 + p.phase) * 0.25;
          c.beginPath();
          c.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          c.fillStyle = color(p.gold, twinkle);
          c.fill();
        }
      }

      if (mouseGutter) {
        const g = c.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 90);
        g.addColorStop(0, mouse.x < left ? "rgba(212,175,55,0.14)" : "rgba(62,232,200,0.12)");
        g.addColorStop(1, "rgba(0,0,0,0)");
        c.fillStyle = g;
        c.beginPath();
        c.arc(mouse.x, mouse.y, 90, 0, Math.PI * 2);
        c.fill();
      }

      ripples = ripples.filter((ripple) => {
        ripple.r += 2.4;
        const a = Math.max(0, 1 - ripple.r / ripple.max);
        c.beginPath();
        c.arc(ripple.x, ripple.y, ripple.r, 0, Math.PI * 2);
        c.strokeStyle = color(ripple.gold, a * 0.55);
        c.lineWidth = 1.6;
        c.stroke();
        c.beginPath();
        c.arc(ripple.x, ripple.y, ripple.r * 0.55, 0, Math.PI * 2);
        c.strokeStyle = color(!ripple.gold, a * 0.25);
        c.stroke();
        return ripple.r < ripple.max;
      });

      raf = requestAnimationFrame(frame);
    }

    function onMove(e: MouseEvent) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      document.documentElement.classList.toggle("atm-aim", inGutter(e.clientX, w));
    }

    function onLeave() {
      mouse.x = -9999;
      mouse.y = -9999;
      document.documentElement.classList.remove("atm-aim");
    }

    function onClick(e: MouseEvent) {
      if (!inGutter(e.clientX, w)) return;
      const gold = e.clientX < contentBounds(w).left;
      ripples.push({ x: e.clientX, y: e.clientY, r: 6, max: 160, gold });
      for (let i = 0; i < 10; i++) {
        const p = spawn(w, h);
        p.x = e.clientX + (Math.random() - 0.5) * 18;
        p.y = e.clientY + (Math.random() - 0.5) * 18;
        p.gold = gold ? Math.random() > 0.2 : Math.random() < 0.3;
        p.vx = (Math.random() - 0.5) * 1.8;
        p.vy = (Math.random() - 0.5) * 1.8;
        particles.push(p);
      }
      if (particles.length > 180) particles.splice(0, particles.length - 180);
    }

    resize();
    frame();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);
    window.addEventListener("click", onClick);
    const onVis = () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else raf = requestAnimationFrame(frame);
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("click", onClick);
      document.removeEventListener("visibilitychange", onVis);
      document.documentElement.classList.remove("atm-aim");
    };
  }, []);

  return (
    <div className="shop-atmosphere hidden min-[1360px]:block" aria-hidden="true">
      <div className="atm-rail atm-rail-left" />
      <div className="atm-rail atm-rail-right" />
      <div className="atm-label atm-label-left">
        <span>Horário</span>
        <b>Agenda viva</b>
      </div>
      <div className="atm-label atm-label-right">
        <span>Sinal</span>
        <b>Unidade online</b>
      </div>
      <canvas ref={canvasRef} className="atm-canvas" />
    </div>
  );
}
