"use client";

import { useEffect, useRef } from "react";

type Dot = {
  x: number;
  y: number;
  z: number; // depth 0 (far) .. 1 (near)
  vx: number;
  vy: number;
};

const DOT_COUNT = 70;
const LINK_DISTANCE = 130;

function readCssColor(name: string, fallback: string) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name);
  return value.trim() || fallback;
}

/**
 * Floating linked dots with a mouse-parallax depth illusion.
 * Depth layers: near dots are larger, brighter, and shift more with the
 * pointer — producing a pseudo-3D field without any dependency.
 */
export function LinkedDotsCanvas({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = 0;
    let height = 0;
    let raf = 0;
    let running = true;
    const pointer = { x: 0.5, y: 0.5 };
    const target = { x: 0.5, y: 0.5 };

    let dots: Dot[] = [];

    function seed() {
      dots = Array.from({ length: DOT_COUNT }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        z: Math.random(),
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
      }));
    }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas!.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas!.width = Math.round(width * dpr);
      canvas!.height = Math.round(height * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (dots.length === 0) seed();
    }

    function step() {
      if (!running) return;

      // Ease the parallax offset toward the pointer for smooth depth motion.
      pointer.x += (target.x - pointer.x) * 0.05;
      pointer.y += (target.y - pointer.y) * 0.05;

      const dotColor = readCssColor("--primary-300", "#67AEEE");
      const lineColor = readCssColor("--border-default", "#CFE6F7");

      ctx!.clearRect(0, 0, width, height);

      const projected = dots.map((dot) => {
        if (!reducedMotion) {
          dot.x += dot.vx * (0.4 + dot.z);
          dot.y += dot.vy * (0.4 + dot.z);
        }
        if (dot.x < -20) dot.x = width + 20;
        if (dot.x > width + 20) dot.x = -20;
        if (dot.y < -20) dot.y = height + 20;
        if (dot.y > height + 20) dot.y = -20;

        const px = (pointer.x - 0.5) * 40 * dot.z;
        const py = (pointer.y - 0.5) * 40 * dot.z;
        return { ...dot, sx: dot.x + px, sy: dot.y + py };
      });

      // Connections first (under the dots).
      ctx!.strokeStyle = lineColor;
      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const a = projected[i]!;
          const b = projected[j]!;
          const dx = a.sx - b.sx;
          const dy = a.sy - b.sy;
          const distance = Math.hypot(dx, dy);
          if (distance > LINK_DISTANCE) continue;
          ctx!.globalAlpha = (1 - distance / LINK_DISTANCE) * Math.min(a.z, b.z);
          ctx!.beginPath();
          ctx!.moveTo(a.sx, a.sy);
          ctx!.lineTo(b.sx, b.sy);
          ctx!.stroke();
        }
      }

      ctx!.fillStyle = dotColor;
      for (const dot of projected) {
        ctx!.globalAlpha = 0.25 + dot.z * 0.75;
        ctx!.beginPath();
        ctx!.arc(dot.sx, dot.sy, 1.2 + dot.z * 2.6, 0, Math.PI * 2);
        ctx!.fill();
      }

      ctx!.globalAlpha = 1;
      raf = requestAnimationFrame(step);
    }

    function onPointerMove(event: PointerEvent) {
      const rect = canvas!.getBoundingClientRect();
      target.x = (event.clientX - rect.left) / rect.width;
      target.y = (event.clientY - rect.top) / rect.height;
    }

    function onVisibility() {
      running = document.visibilityState === "visible" && !reducedMotion;
      if (running) raf = requestAnimationFrame(step);
      else cancelAnimationFrame(raf);
    }

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onPointerMove);
    document.addEventListener("visibilitychange", onVisibility);

    if (reducedMotion) {
      // Draw one static frame.
      step();
      cancelAnimationFrame(raf);
    } else {
      raf = requestAnimationFrame(step);
    }

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
