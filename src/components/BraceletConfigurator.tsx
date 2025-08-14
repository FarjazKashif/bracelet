"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";

type Shape = "round" | "square" | "diamond";
interface Bead { id: number; color: string; shape: Shape; }

export default function BraceletConfigurator({ initial = 28 }: { initial?: number }) {
  // ---------- stable state & ids ----------
  const [count, setCount] = useState<number>(initial);
  const idRef = useRef<number>(initial); // deterministic id generator (1..)
  const [beads, setBeads] = useState<Bead[]>(() =>
    Array.from({ length: initial }).map((_, i) => ({ id: i + 1, color: "#ffffff", shape: "round" }))
  );
  const [selectedIndex, setSelectedIndex] = useState<number | null>(0);

  // ---------- avoid SSR/CSR mismatch ----------
  // mounted flag: anything generated with randomness is created only after mount
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
  function addBead() { setCount(c => c + 1); }
  function removeBead() { setCount(c => Math.max(3, c - 1)); }

  // ---------- stars/background (only client-side) ----------
  type Star = { top: string; left: string; size: number; opacity: number; dur: number; delay: number };
  const [stars, setStars] = useState<Star[]>([]);
  useEffect(() => {
    if (!mounted) return;
    const s: Star[] = Array.from({ length: 38 }).map(() => ({
      top: `${(Math.random() * 92 + 2).toFixed(2)}%`,
      left: `${(Math.random() * 92 + 2).toFixed(2)}%`,
      size: Math.random() * 2 + 1,
      opacity: +(0.15 + Math.random() * 0.85).toFixed(2),
      dur: 8 + Math.random() * 18,
      delay: Math.random() * 6
    }));
    setStars(s);
  }, [mounted]);

  // ---------- palette ----------
  const palette = ["#ffffff", "#0f172a", "#a78bfa", "#fb7185", "#7c3aed", "#06b6d4", "#34d399"];

  // ---------- render ----------
  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-6 py-12">
      {/* container */}
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* preview */}
        <div className="lg:col-span-7 col-span-1 relative">
          {/* subtle gradient backdrop */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-pink-50 via-white to-purple-50/60 pointer-events-none" />
          {/* animated stars (only rendered after mount) */}
          {mounted && (
            <div className="absolute inset-0 -z-10">
              {stars.map((st, idx) => (
                <motion.div
                  key={idx}
                  className="absolute bg-white rounded-full"
                  style={{ top: st.top, left: st.left, width: st.size, height: st.size, opacity: st.opacity }}
                  initial={{ y: 0, opacity: st.opacity * 0.6 }}
                  animate={{ y: [0, -8, 0], opacity: [st.opacity * 0.6, st.opacity, st.opacity * 0.6] }}
                  transition={{ duration: st.dur, repeat: Infinity, delay: st.delay, ease: "easeInOut" }}
                />
              ))}
            </div>
          )}

          <div className="relative p-8 rounded-3xl bg-white/70 backdrop-blur-md border border-white/60 shadow-lg">
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
              <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} role="img" aria-label="Bracelet preview">
                <defs>
                  <filter id="softShadow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="6" stdDeviation="10" floodOpacity="0.08" />
                  </filter>
                </defs>

                <g filter="url(#softShadow)">
  {/* Base circle */}
  <circle
    cx={cx}
    cy={cy}
    r={radius + beadRadius * 0.25}
    fill="none"
    stroke="#f3e8ff"
    strokeWidth={2}
  />
</g>

{(() => {
  const lockAngle = Math.PI / 2; // bottom of the circle
  const lockX = cx + Math.cos(lockAngle) * radius;
  const lockY = cy + Math.sin(lockAngle) * radius;

  const lockWidth = beadDiameter * 0.8;
  const lockHeight = beadDiameter * 1.6;
  const gap = 4;

  return (
    <g>
      <rect
        x={lockX - lockWidth - gap / 2}
        y={lockY - lockHeight / 2}
        width={lockWidth}
        height={lockHeight}
        rx={3}
        fill="#ccc"
        stroke="#888"
        strokeWidth={1.5}
      />
      <rect
        x={lockX + gap / 2}
        y={lockY - lockHeight / 2}
        width={lockWidth}
        height={lockHeight}
        rx={3}
        fill="#ccc"
        stroke="#888"
        strokeWidth={1.5}
      />
    </g>
  );
})()}

                {positions.map((p, i) => {
                  const bead = beads[i];
                  if (!bead) return null; // guard
                  const selected = selectedIndex === i;
                  const stroke = selected ? "#0f172a" : "#111827";
                  const strokeW = selected ? 3 : 1.5;
                  const common = {
                    onClick: () => setSelectedIndex(i),
                    role: "button",
                    tabIndex: 0,
                  } as any;

                  if (bead.shape === "round") {
                    return (
                      <motion.circle
                        key={bead.id}
                        {...common}
                        cx={p.x}
                        cy={p.y}
                        r={beadRadius}
                        fill={bead.color}
                        stroke={stroke}
                        strokeWidth={strokeW}
                        whileHover={{ scale: 1.12 }}
                        transition={{ type: "spring", stiffness: 220, damping: 18 }}
                        style={{ transformOrigin: `${p.x}px ${p.y}px` }}
                      />
                    );
                  }

                  if (bead.shape === "square") {
                    const x = p.x - beadRadius;
                    const y = p.y - beadRadius;
                    return (
                      <motion.rect
                        key={bead.id}
                        {...common}
                        x={x}
                        y={y}
                        width={beadDiameter}
                        height={beadDiameter}
                        rx={Math.max(3, beadRadius * 0.2)}
                        fill={bead.color}
                        stroke={stroke}
                        strokeWidth={strokeW}
                        whileHover={{ rotate: 8, scale: 1.08 }}
                      />
                    );
                  }

                  // diamond
                  const pts = [
                    `${p.x},${p.y - beadRadius}`,
                    `${p.x + beadRadius},${p.y}`,
                    `${p.x},${p.y + beadRadius}`,
                    `${p.x - beadRadius},${p.y}`,
                  ].join(" ");
                  return (
                    <motion.polygon
                      key={bead.id}
                      {...common}
                      points={pts}
                      fill={bead.color}
                      stroke={stroke}
                      strokeWidth={strokeW}
                      whileHover={{ rotate: 22, scale: 1.08 }}
                    />
                  );
                })}
              </svg>
            </div>

            <div className="mt-3 flex items-center justify-between text-sm text-slate-500 px-2">
              <div>Bead size: <strong className="text-slate-800">{Math.round(beadDiameter)}px</strong></div>
              <div>Ring radius: <strong className="text-slate-800">{Math.round(radius)}px</strong></div>
            </div>
          </div>
        </div>

        {/* controls */}
        <aside className="lg:col-span-5 col-span-1">
          <div className="p-6 rounded-3xl bg-white/70 backdrop-blur-md border border-white/60 shadow-lg flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-semibold text-slate-900">Customize</h4>
                <p className="text-sm text-slate-500">Choose color & shape per bead</p>
              </div>
              <button onClick={() => alert("Export not implemented")} className="px-3 py-2 rounded-md bg-gradient-to-br from-pink-400 to-purple-500 text-white">Export</button>
            </div>

            <div className="space-y-4">
              <label className="text-sm text-slate-700">Bead count</label>
              <input type="range" min={3} max={80} value={count} onChange={(e) => setCount(Number(e.target.value))} className="w-full accent-slate-900" />
              <div className="flex items-center gap-2">
                <button onClick={() => setCount(c => Math.max(3, c - 1))} className="px-3 py-1 rounded-md bg-white border">-</button>
                <div className="px-3 py-1 rounded-md bg-slate-50">{count}</div>
                <button onClick={() => setCount(c => c + 1)} className="px-3 py-1 rounded-md bg-slate-900 text-white">+</button>
              </div>
            </div>

            <div className="border rounded-lg p-4 bg-white/60">
              <h5 className="text-sm font-medium text-slate-800 mb-3">Selected bead</h5>
              {selectedIndex === null || !beads[selectedIndex] ? (
                <div className="text-sm text-slate-500">Click any bead to edit it</div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-medium">Bead #{selectedIndex + 1}</div>
                    <div className="h-8 w-8 rounded-full border" style={{ background: beads[selectedIndex].color }} />
                  </div>

                  <div>
                    <label className="text-xs text-slate-600">Color</label>
                    <div className="flex items-center gap-3 mt-2">
                      <input type="color" value={beads[selectedIndex].color} onChange={(e) => updateBead(selectedIndex, { color: e.target.value })} className="h-10 w-12 p-0 border rounded" />
                      <div className="flex gap-2">
                        {palette.map(c => (
                          <button key={c} onClick={() => updateBead(selectedIndex, { color: c })} style={{ background: c }} className={`h-8 w-8 rounded-full border ${beads[selectedIndex].color === c ? "ring-2 ring-offset-1 ring-purple-300" : ""}`} />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-slate-600">Shape</label>
                    <div className="flex gap-2 mt-2">
                      {(["round","square","diamond"] as Shape[]).map(s => (
                        <button key={s} onClick={() => updateBead(selectedIndex, { shape: s })} className={`px-3 py-1 rounded-full text-xs ${beads[selectedIndex].shape === s ? "bg-slate-900 text-white" : "bg-white/60"}`}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 mt-2">
                    <button onClick={() => {
                      setBeads(prev => {
                        const next = prev.slice();
                        idRef.current += 1;
                        const src = prev[selectedIndex] || { color: "#ffffff", shape: "round" };
                        next.splice((selectedIndex ?? 0) + 1, 0, { id: idRef.current, color: src.color, shape: src.shape });
                        setCount(c => c + 1);
                        return next;
                      });
                    }} className="px-3 py-2 rounded-md bg-emerald-600 text-white">Duplicate</button>

                    <button onClick={() => updateBead(selectedIndex ?? 0, { color: "#ffffff", shape: "round" })} className="px-3 py-2 rounded-md bg-white border">Reset</button>
                  </div>
                </div>
              )}
            </div>

            <div className="text-sm text-slate-500">
              <strong className="text-slate-700">Notes</strong>
              <ul className="list-disc ml-5 mt-2">
                <li>Random decoration generated only on the client to avoid hydration errors.</li>
                <li>SVG positions are rounded to avoid tiny numeric diffs.</li>
                <li>IDs are deterministic so server and client match.</li>
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
