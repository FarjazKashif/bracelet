"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * Polished BraceletConfigurator — Firebase-like aesthetic
 * - Deterministic IDs (no Date.now) to avoid hydration mismatches
 * - Rounded, subtle shadows, refined spacing
 * - Keyboard accessible beads
 * - SVG positions rounded to avoid tiny float diffs
 * - Export PNG (SVG -> Canvas -> PNG)
 */

type Shape = "round" | "square" | "diamond";

interface Bead {
  id: number;
  color: string;
  shape: Shape;
}

export default function BraceletConfigurator({ initial = 28 }: { initial?: number }) {
  // --- state (deterministic ids) -------------------------------------------------
  const [count, setCount] = useState<number>(initial);
  const idRef = useRef<number>(initial); // deterministic generator

  const [beads, setBeads] = useState<Bead[]>(() =>
    Array.from({ length: initial }).map((_, i) => ({ id: i + 1, color: "#FFFFFF", shape: "round" }))
  );
  const [selectedIndex, setSelectedIndex] = useState<number | null>(0);

  // Keep beads array in sync with count
  useEffect(() => {
    setBeads((prev) => {
      if (prev.length === count) return prev;
      if (prev.length < count) {
        const next = prev.slice();
        for (let i = prev.length; i < count; i++) {
          idRef.current += 1;
          next.push({ id: idRef.current, color: "#FFFFFF", shape: "round" });
        }
        return next;
      }
      return prev.slice(0, count);
    });

    setSelectedIndex((s) => (s !== null && s >= count ? count - 1 : s));
  }, [count]);

  // --- geometry ------------------------------------------------------------------
  const size = 560; // svg viewport px
  const cx = size / 2;
  const cy = size / 2;

  const radius = useMemo(() => Math.max(120, (size / 2) - 120), [size]);

  const beadDiameter = useMemo(() => {
    const circum = 2 * Math.PI * radius;
    const raw = (circum / Math.max(3, count)) * 0.78; // spacing factor
    return Math.max(10, Math.min(56, raw));
  }, [count, radius]);

  const beadRadius = beadDiameter / 2;

  const positions = useMemo(() => {
    const arr: { x: number; y: number; angle: number }[] = [];
    const startAngle = -Math.PI / 2; // top
    for (let i = 0; i < count; i++) {
      const angle = startAngle + (i * 2 * Math.PI) / count;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      // round to fixed decimals to avoid SSR/CSR mismatch
      arr.push({ x: Number(x.toFixed(3)), y: Number(y.toFixed(3)), angle });
    }
    return arr;
  }, [count, radius, cx, cy]);

  // --- helpers ------------------------------------------------------------------
  function updateBead(index: number, partial: Partial<Bead>) {
    setBeads((prev) => prev.map((b, i) => (i === index ? { ...b, ...partial } : b)));
  }

  function addBead() {
    setCount((c) => c + 1);
  }
  function removeBead() {
    setCount((c) => Math.max(3, c - 1));
  }

  function onBeadKeyDown(e: React.KeyboardEvent, i: number) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setSelectedIndex(i);
    }
    if (e.key === "ArrowRight") setSelectedIndex((s) => (s === null ? 0 : (s + 1) % count));
    if (e.key === "ArrowLeft") setSelectedIndex((s) => (s === null ? count - 1 : (s - 1 + count) % count));
  }

  // small palette for quick picks (Firebase-blue + neutrals)
  const palette = ["#FFFFFF", "#0f172a", "#1e88e5", "#0284c7", "#7c3aed", "#f97316", "#10b981"];

  // export: svg -> png (client-side)
  const svgRef = useRef<SVGSVGElement | null>(null);
  async function exportPNG() {
    if (!svgRef.current) return;
    const svgEl = svgRef.current;
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgEl);
    const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = url;
    await new Promise((res, rej) => {
      img.onload = res;
      img.onerror = rej;
    });

    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(url);

    canvas.toBlob((b) => {
      if (!b) return;
      const link = document.createElement("a");
      link.download = `bracelet-${count}.png`;
      link.href = URL.createObjectURL(b);
      link.click();
      URL.revokeObjectURL(link.href);
    });
  }

  // --- UI ----------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-slate-100 py-10 px-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* left: preview */}
        <section className="lg:col-span-7 bg-white rounded-2xl shadow-2xl p-6 flex items-center justify-center">
          <div className="w-full max-w-lg relative">
            <div className="rounded-xl bg-gradient-to-tr from-white to-slate-50 p-6 border border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-indigo-50 to-indigo-100 flex items-center justify-center text-indigo-600 font-semibold">B</div>
                  <div>
                    <div className="text-sm font-medium text-slate-700">Live Preview</div>
                    <div className="text-xs text-slate-400">Responsive · Aesthetic · Exportable</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCount((c) => Math.max(3, c - 1))}
                    className="px-3 py-1 text-sm rounded-md bg-slate-50 border hover:bg-slate-100"
                  >
                    -
                  </button>
                  <button
                    onClick={() => setCount((c) => c + 1)}
                    className="px-3 py-1 text-sm rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-center">
                <svg
                  ref={svgRef}
                  viewBox={`0 0 ${size} ${size}`}
                  width={size}
                  height={size}
                  role="img"
                  aria-label="Bracelet preview"
                >
                  <defs>
                    <filter id="soft" x="-50%" y="-50%" width="200%" height="200%">
                      <feDropShadow dx="0" dy="4" stdDeviation="12" floodOpacity="0.06" />
                    </filter>
                  </defs>

                  <g filter="url(#soft)">
                    <circle cx={cx} cy={cy} r={radius + beadRadius * 0.25} fill="none" stroke="#eef2ff" strokeWidth={2} />
                  </g>

                  {positions.map((p, i) => {
                    const bead = beads[i];
                    if (!bead) return null;
                    const isSelected = selectedIndex === i;

                    const strokeWidth = isSelected ? 3 : 1.6;
                    const strokeColor = isSelected ? "#0f172a" : "#111827";

                    // common attributes (key MUST be direct on element)
                    const common = {
                      onClick: () => setSelectedIndex(i),
                      onKeyDown: (e: React.KeyboardEvent) => onBeadKeyDown(e, i),
                      role: "button",
                      tabIndex: 0,
                      "aria-label": `Bead ${i + 1}`,
                      className: "transition-transform duration-200 ease-out hover:scale-105 focus:scale-105",
                    } as any;

                    if (bead.shape === "round") {
                      return (
                        <circle
                          key={bead.id}
                          {...common}
                          cx={p.x}
                          cy={p.y}
                          r={beadRadius}
                          fill={bead.color}
                          stroke={strokeColor}
                          strokeWidth={strokeWidth}
                          style={{ transformOrigin: `${p.x}px ${p.y}px` }}
                        />
                      );
                    }

                    if (bead.shape === "square") {
                      const x = p.x - beadRadius;
                      const y = p.y - beadRadius;
                      return (
                        <rect
                          key={bead.id}
                          {...common}
                          x={x}
                          y={y}
                          width={beadDiameter}
                          height={beadDiameter}
                          rx={Math.max(3, beadRadius * 0.18)}
                          fill={bead.color}
                          stroke={strokeColor}
                          strokeWidth={strokeWidth}
                        />
                      );
                    }

                    const points = [`${p.x},${p.y - beadRadius}`, `${p.x + beadRadius},${p.y}`, `${p.x},${p.y + beadRadius}`, `${p.x - beadRadius},${p.y}`].join(" ");
                    return (
                      <polygon
                        key={bead.id}
                        {...common}
                        points={points}
                        fill={bead.color}
                        stroke={strokeColor}
                        strokeWidth={strokeWidth}
                      />
                    );
                  })}
                </svg>
              </div>

              <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
                <div>Bead size: <strong className="text-slate-700">{Math.round(beadDiameter)}px</strong></div>
                <div>Ring radius: <strong className="text-slate-700">{Math.round(radius)}px</strong></div>
              </div>
            </div>
          </div>
        </section>

        {/* right: control panel */}
        <aside className="lg:col-span-5 bg-white rounded-2xl shadow-2xl p-6 flex flex-col">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">Customize Bracelet</h3>
              <p className="text-sm text-slate-500 mt-1">A modern, minimal theme inspired by Firebase — clean blue accents and subtle depth.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={exportPNG} className="px-3 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700">Export PNG</button>
            </div>
          </div>

          <div className="mt-6 space-y-6 flex-1">
            <div className="bg-slate-50 border rounded-lg p-4">
              <label className="text-sm font-medium text-slate-700">Bead count</label>
              <div className="mt-3 flex items-center gap-4">
                <input
                  type="range"
                  min={3}
                  max={80}
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  className="w-full accent-indigo-500"
                />
                <div className="w-12 text-right font-semibold text-slate-800">{count}</div>
              </div>

              <div className="mt-3 flex gap-2">
                <button onClick={addBead} className="px-3 py-1 rounded-md bg-indigo-600 text-white hover:bg-indigo-700">+ Add</button>
                <button onClick={removeBead} disabled={count <= 3} className="px-3 py-1 rounded-md bg-white border hover:bg-slate-50 disabled:opacity-40">- Remove</button>
                <div className="ml-auto text-xs text-slate-400">Tip: use ← / → to move selection</div>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <h4 className="text-sm font-medium text-slate-800">Selected bead</h4>

              {selectedIndex === null ? (
                <div className="text-sm text-slate-500 mt-3">No bead selected — click any bead in the preview.</div>
              ) : (
                <div className="mt-3 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-medium">Bead #{selectedIndex + 1}</div>
                    <div className="h-7 w-7 rounded-full border" style={{ background: beads[selectedIndex].color }} />
                  </div>

                  <div>
                    <label className="text-sm text-slate-700 block mb-2">Color</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={beads[selectedIndex].color}
                        onChange={(e) => updateBead(selectedIndex, { color: e.target.value })}
                        className="h-10 w-12 p-0 border rounded"
                      />

                      <div className="flex gap-2">
                        {palette.map((c) => (
                          <button
                            key={c}
                            onClick={() => updateBead(selectedIndex, { color: c })}
                            aria-label={`Color ${c}`}
                            className={`h-8 w-8 rounded-full border ${beads[selectedIndex].color === c ? "ring-2 ring-offset-1 ring-indigo-300" : ""}`}
                            style={{ background: c }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-slate-700 block mb-2">Shape</label>
                    <div className="flex gap-2">
                      {(["round", "square", "diamond"] as Shape[]).map((s) => (
                        <button
                          key={s}
                          onClick={() => updateBead(selectedIndex, { shape: s })}
                          className={`px-3 py-1 rounded-md border ${beads[selectedIndex].shape === s ? "bg-white shadow-sm border-slate-300" : "bg-transparent"}`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setBeads((prev) => {
                          const next = prev.slice();
                          idRef.current += 1;
                          next.splice((selectedIndex ?? 0) + 1, 0, { id: idRef.current, color: beads[selectedIndex ?? 0].color, shape: beads[selectedIndex ?? 0].shape });
                          setCount((c) => c + 1);
                          return next;
                        });
                      }}
                      className="px-3 py-1 rounded-md bg-emerald-600 text-white hover:bg-emerald-700"
                    >
                      Duplicate bead
                    </button>

                    <button
                      onClick={() => updateBead(selectedIndex ?? 0, { color: "#FFFFFF", shape: "round" })}
                      className="px-3 py-1 rounded-md bg-white border"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="text-sm text-slate-500">
              <strong className="text-slate-700">Implementation notes</strong>
              <ul className="list-disc ml-5 mt-2 space-y-1">
                <li>Positions use polar coordinates and are rounded to avoid hydrate mismatch.</li>
                <li>Bead size auto-adjusts so beads keep nice gaps.</li>
                <li>Accessible: beads are focusable and keyboard-selectable.</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-slate-500">Ready to finalize?</div>
            <div className="flex gap-3">
              <button onClick={() => alert('Preview not implemented')} className="px-3 py-2 rounded-md bg-slate-50 border">Preview</button>
              <button onClick={() => alert('Save not implemented')} className="px-3 py-2 rounded-md bg-indigo-600 text-white">Save</button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
