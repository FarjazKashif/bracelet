"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import HeartPendant from "./HeartPendant";

type Shape = "round" | "square" | "diamond";
interface Bead { id: number; color: string; shape: Shape; }

const palette = [
  "#FFD700", // Real gold
  "#E6E8FA", // Pearl white
  "#C0C0C0", // Sterling silver
  "#B76E79", // Rose gold
  "#4F69C6", // Sapphire blue
  "#50C878", // Emerald
  "#FF69B4", // Pink tourmaline
  "#8B4513", // Amber brown
];

export default function BraceletConfigurator({ initial = 28 }: { initial?: number }) {
  // ---------- stable state & ids ----------
  const [count, setCount] = useState<number>(initial);
  const idRef = useRef<number>(initial); // deterministic id generator (1..)
  const [beads, setBeads] = useState<Bead[]>(() =>
    Array.from({ length: initial }).map((_, i) => ({ id: i + 1, color: "#ffffff", shape: "round" }))
  );
  const [selectedIndex, setSelectedIndex] = useState<number | null>(0);

  // pendant state: "lock" | "heart"
  const [pendantType, setPendantType] = useState<"lock" | "heart">("lock");
  // color for heart half (user chooses from same palette)
  const [pendantColor, setPendantColor] = useState<string>("#FFD700");

  // ---------- avoid SSR/CSR mismatch ----------
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // keep array in sync with count (preserve existing beads)
  useEffect(() => {
    setBeads(prev => {
      if (prev.length === count) return prev;
      if (prev.length < count) {
        const next = prev.slice();
        for (let i = prev.length; i < count; i++) {
          idRef.current += 1;
          next.push({ id: idRef.current, color: "#ffffff", shape: "round" });
        }
        return next;
      } else {
        return prev.slice(0, count);
      }
    });
    setSelectedIndex(s => (s !== null && s >= count ? count - 1 : s));
  }, [count]);

  // ---------- geometry ----------
  const size = 520;
  const cx = size / 2;
  const cy = size / 2;
  const radius = useMemo(() => Math.max(110, (size / 2) - 110), [size]);

  const beadDiameter = useMemo(() => {
    const circum = 2 * Math.PI * radius;
    const raw = (circum / Math.max(3, count)) * 0.78;
    return Math.max(10, Math.min(56, raw));
  }, [count, radius]);
  const beadRadius = beadDiameter / 2;

  // positions are deterministic and rounded to avoid tiny float differences
  const positions = useMemo(() => {
    const arr: { x: number; y: number }[] = [];
    const startAngle = -Math.PI / 2;
    for (let i = 0; i < count; i++) {
      const angle = startAngle + (i * 2 * Math.PI) / count;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      arr.push({ x: Number(x.toFixed(2)), y: Number(y.toFixed(2)) });
    }
    return arr;
  }, [count, radius, cx, cy]);

  // ---------- small helpers ----------
  function updateBead(index: number, partial: Partial<Bead>) {
    setBeads(prev => prev.map((b, i) => (i === index ? { ...b, ...partial } : b)));
  }
  function addBead() { setCount(c => Math.min(80, c + 1)); }
  function removeBead() { setCount(c => Math.max(3, c - 1)); }

  // ---------- render ----------
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-pink-50 px-6 py-12">
      <div className="text-center mb-8 w-full max-w-2xl">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Design Your Bracelet</h1>
        <p className="text-slate-500">Customize your perfect bracelet with our interactive designer</p>
      </div>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <motion.div className="relative">
          <div className="relative p-8 rounded-3xl bg-white/80 backdrop-blur-xl border border-white/80 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Live Bracelet</h3>
                <p className="text-sm text-slate-500">Minimal · Clean · Playful</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={removeBead} className="px-3 py-2 rounded-md bg-white border text-slate-700 hover:bg-slate-50">-</button>
                <div className="px-3 py-2 rounded-md font-medium text-slate-900">{count}</div>
                <button onClick={addBead} className="px-3 py-2 rounded-md bg-slate-900 text-white hover:bg-slate-800">+</button>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
                <defs>
                  {/* Enhanced metallic effects */}
                  <radialGradient id="pearlSheen" cx="0.3" cy="0.3" r="0.7">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.8)" />
                    <stop offset="80%" stopColor="rgba(255,255,255,0)" />
                  </radialGradient>
                  <linearGradient id="chainGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#D4D4D8" />
                    <stop offset="50%" stopColor="#E4E4E7" />
                    <stop offset="100%" stopColor="#D4D4D8" />
                  </linearGradient>
                  <filter id="bevelEffect">
                    <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur" />
                    <feSpecularLighting in="blur" surfaceScale="5" specularConstant=".75" specularExponent="20" result="spec">
                      <fePointLight x="-5000" y="-10000" z="20000" />
                    </feSpecularLighting>
                    <feComposite in="SourceGraphic" in2="spec" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" />
                  </filter>
                </defs>

                {/* Chain/thread effect */}
                <path
                  d={`M ${cx},${cy} m -${radius},0 a ${radius},${radius} 0 1,0 ${radius*2},0 a ${radius},${radius} 0 1,0 -${radius*2},0`}
                  fill="none"
                  stroke="url(#chainGradient)"
                  strokeWidth="3"
                  strokeDasharray="4 2"
                  opacity="0.8"
                />

                {/* Beads with enhanced effects */}
                {positions.map((p, i) => {
                  const bead = beads[i];
                  if (!bead) return null;
                  const selected = selectedIndex === i;
                  
                  return (
                    <g key={bead.id}>
                      <motion.circle
                        cx={p.x}
                        cy={p.y}
                        r={beadRadius}
                        fill={bead.color}
                        stroke={selected ? "#0f172a" : "#9aa0a6"}
                        strokeWidth={selected ? 2 : 1}
                        filter="url(#bevelEffect)"
                        whileHover={{ scale: 1.12 }}
                        transition={{ type: "spring", stiffness: 220, damping: 18 }}
                        onClick={() => setSelectedIndex(i)}
                      />
                      {/* Metallic highlight */}
                      <circle
                        cx={p.x - beadRadius * 0.3}
                        cy={p.y - beadRadius * 0.3}
                        r={beadRadius * 0.5}
                        fill="url(#pearlSheen)"
                        opacity="0.6"
                        pointerEvents="none"
                      />
                    </g>
                  );
                })}

                {/* Improved clasp design */}
                {(() => {
                  const lockAngle = Math.PI / 2;
                  const lockX = cx + Math.cos(lockAngle) * radius;
                  const lockY = cy + Math.sin(lockAngle) * radius;

                  if (pendantType === "heart") {
                    return (
                      <g transform={`translate(${lockX - 15} ${lockY - 5})`}>
                        <HeartPendant color={pendantColor} />
                      </g>
                    );
                  }

                  // Lock pendant
                  const lockWidth = beadDiameter * 0.8;
                  const lockHeight = beadDiameter * 1.4;
                  
                  return (
                    <g>
                      <rect
                        x={lockX - lockWidth - 2}
                        y={lockY - lockHeight/2}
                        width={lockWidth}
                        height={lockHeight}
                        rx={4}
                        fill="#303030"
                        filter="url(#bevelEffect)"
                      />
                      <rect
                        x={lockX + 2}
                        y={lockY - lockHeight/2}
                        width={lockWidth}
                        height={lockHeight}
                        rx={4}
                        fill="#303030"
                        filter="url(#bevelEffect)"
                      />
                    </g>
                  );
                })()}
              </svg>
            </div>

            <div className="mt-3 flex items-center justify-between text-sm text-slate-500 px-2">
              <div>Bead size: <strong className="text-slate-800">{Math.round(beadDiameter)}px</strong></div>
              <div>Ring radius: <strong className="text-slate-800">{Math.round(radius)}px</strong></div>
            </div>
          </div>
        </motion.div>

        {/* Controls */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="space-y-6 bg-white/80 backdrop-blur-xl border border-white/80 rounded-3xl p-6 shadow-lg">
          {/* Color picker */}
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-2">Colors</label>
            <div className="flex gap-2">
              {palette.map(c => (
                <motion.button
                  key={c}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => selectedIndex !== null && updateBead(selectedIndex, { color: c })}
                  style={{ background: c }}
                  className={`h-8 w-8 rounded-full border shadow-sm ${selectedIndex !== null && beads[selectedIndex]?.color === c ? "ring-2 ring-offset-2 ring-indigo-400" : ""}`}
                />
              ))}
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => selectedIndex !== null && updateBead(selectedIndex, { color: "#ffffff" })} className={`h-8 w-8 rounded-full border shadow-sm bg-white ${selectedIndex !== null && beads[selectedIndex]?.color === "#ffffff" ? "ring-2 ring-offset-2 ring-indigo-400" : ""}`}> </motion.button>
            </div>
          </div>

          {/* Shape picker */}
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-2">Shapes</label>
            <div className="flex gap-2">
              {(["round", "square", "diamond"] as Shape[]).map(s => (
                <motion.button
                  key={s}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => selectedIndex !== null && updateBead(selectedIndex, { shape: s })}
                  className={`px-4 py-2 rounded-full text-sm ${selectedIndex !== null && beads[selectedIndex]?.shape === s ? "bg-slate-900 text-white" : "bg-white border hover:bg-slate-50"}`}
                >
                  {s}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Pendant chooser */}
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-2">Pendant</label>
            <div className="flex gap-2 items-center">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setPendantType("lock")} className={`px-4 py-2 rounded-full text-sm ${pendantType === "lock" ? "bg-slate-900 text-white" : "bg-white border hover:bg-slate-50"}`}>Lock</motion.button>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setPendantType("heart")} className={`px-4 py-2 rounded-full text-sm ${pendantType === "heart" ? "bg-slate-900 text-white" : "bg-white border hover:bg-slate-50"}`}>Half Heart</motion.button>
            </div>

            {/* if heart selected show color picker for pendant half */}
            {pendantType === "heart" && (
              <div className="mt-3 flex items-center gap-2">
                {palette.map(c => (
                  <button key={c} onClick={() => setPendantColor(c)} className={`h-7 w-7 rounded-full border ${pendantColor === c ? "ring-2 ring-indigo-400" : ""}`} style={{ background: c }} />
                ))}
                <div className="text-xs text-slate-500 ml-2">Choose color for left half</div>
              </div>
            )}
          </div>

          {/* Bead count */}
          <div className="space-y-4">
            <label className="text-sm font-medium text-slate-700">Bead count</label>
            <input type="range" min={3} max={80} value={count} onChange={(e) => setCount(Number(e.target.value))} className="w-full h-2 bg-gradient-to-r from-indigo-200 to-purple-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
            <div className="flex items-center gap-2">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setCount(c => Math.max(3, c - 1))} className="px-3 py-1 rounded-md bg-white border shadow-sm hover:bg-slate-50">-</motion.button>
              <div className="px-3 py-1 rounded-md bg-slate-50 font-medium">{count}</div>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setCount(c => Math.min(80, c + 1))} className="px-3 py-1 rounded-md bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/20">+</motion.button>
            </div>
          </div>

          <p className="text-sm text-slate-500 pt-4 border-t">Click any bead to select and customize it</p>
        </motion.div>
      </div>
    </div>
  );
}
