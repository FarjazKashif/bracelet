"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";

type Shape = "round" | "square" | "diamond";
interface Bead {
  id: number;
  color: string;
  shape: Shape;
}

export default function BraceletConfigurator({ initial = 28 }: { initial?: number }) {
  const [count, setCount] = useState(initial);
  const idRef = useRef(Date.now());
  const [beads, setBeads] = useState<Bead[]>(() =>
    Array.from({ length: initial }).map((_, i) => ({
      id: idRef.current + i,
      color: "#ffffff",
      shape: "round",
    }))
  );
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    setBeads((prev) => {
      if (prev.length === count) return prev;
      if (prev.length < count) {
        const next = [...prev];
        for (let i = prev.length; i < count; i++) {
          idRef.current += 1;
          next.push({ id: idRef.current, color: "#ffffff", shape: "round" });
        }
        return next;
      }
      return prev.slice(0, count);
    });
    setSelectedIndex((s) => (s !== null && s >= count ? count - 1 : s));
  }, [count]);

  const size = 500;
  const cx = size / 2;
  const cy = size / 2;
  const radius = useMemo(() => Math.max(80, size / 2 - 60), [size]);

  const beadDiameter = useMemo(() => {
    const circum = 2 * Math.PI * radius;
    return Math.max(10, Math.min(64, (circum / Math.max(3, count)) * 0.85));
  }, [count, radius]);
  const beadRadius = beadDiameter / 2;

  const positions = useMemo(() => {
    const arr = [];
    const startAngle = -Math.PI / 2;
    for (let i = 0; i < count; i++) {
      const angle = startAngle + (i * 2 * Math.PI) / count;
      arr.push({
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
      });
    }
    return arr;
  }, [count, radius, cx, cy]);

  function updateBead(index: number, partial: Partial<Bead>) {
    setBeads((prev) => prev.map((b, i) => (i === index ? { ...b, ...partial } : b)));
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-tr from-purple-900 via-black to-indigo-900" />
      {/* Glassmorphic Overlay */}
      <div className="absolute inset-0 backdrop-blur-3xl bg-white/5" />

      {/* Bracelet Canvas */}
      <motion.svg
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        className="mb-8 relative z-10"
      >
        <circle
          cx={cx}
          cy={cy}
          r={radius + beadRadius * 0.2}
          fill="none"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth={1}
        />
        {positions.map((p, i) => {
          const bead = beads[i];
          const isSelected = selectedIndex === i;
          const commonProps = {
            onClick: () => setSelectedIndex(i),
            role: "button",
            tabIndex: 0,
            className: "cursor-pointer",
          };

          const glow = isSelected
            ? "drop-shadow(0 0 8px rgba(255,255,255,0.8))"
            : "drop-shadow(0 0 4px rgba(255,255,255,0.3))";

          if (bead.shape === "round") {
            return (
              <motion.circle
                key={bead.id}
                {...commonProps}
                cx={p.x}
                cy={p.y}
                r={beadRadius}
                fill={bead.color}
                stroke="white"
                strokeWidth={isSelected ? 3 : 1}
                style={{ filter: glow }}
                whileHover={{ scale: 1.15 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
              />
            );
          } else if (bead.shape === "square") {
            return (
              <motion.rect
                key={bead.id}
                {...commonProps}
                x={p.x - beadRadius}
                y={p.y - beadRadius}
                width={beadDiameter}
                height={beadDiameter}
                rx={beadRadius * 0.2}
                fill={bead.color}
                stroke="white"
                strokeWidth={isSelected ? 3 : 1}
                style={{ filter: glow }}
                whileHover={{ scale: 1.15 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
              />
            );
          } else {
            const points = [
              `${p.x},${p.y - beadRadius}`,
              `${p.x + beadRadius},${p.y}`,
              `${p.x},${p.y + beadRadius}`,
              `${p.x - beadRadius},${p.y}`,
            ].join(" ");
            return (
              <motion.polygon
                key={bead.id}
                {...commonProps}
                points={points}
                fill={bead.color}
                stroke="white"
                strokeWidth={isSelected ? 3 : 1}
                style={{ filter: glow }}
                whileHover={{ scale: 1.15 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
              />
            );
          }
        })}
      </motion.svg>

      {/* Controls Panel */}
      <div className="relative z-10 flex flex-col items-center gap-6 p-6 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-white">Bead Count</label>
          <input
            type="range"
            min={3}
            max={80}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="accent-pink-400"
          />
          <span className="text-sm text-white">{count}</span>
        </div>

        {selectedIndex !== null && (
          <div className="flex flex-col items-center gap-3 text-white">
            <span className="text-xs opacity-70">Bead #{selectedIndex + 1}</span>
            <input
              type="color"
              value={beads[selectedIndex].color}
              onChange={(e) =>
                updateBead(selectedIndex, { color: e.target.value })
              }
              className="rounded-full w-10 h-10 border border-white/40"
            />
            <div className="flex gap-2">
              {(["round", "square", "diamond"] as Shape[]).map((s) => (
                <button
                  key={s}
                  onClick={() => updateBead(selectedIndex, { shape: s })}
                  className={`px-3 py-1 rounded-full text-xs transition ${
                    beads[selectedIndex].shape === s
                      ? "bg-pink-500 text-white"
                      : "bg-white/20 hover:bg-white/30"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
