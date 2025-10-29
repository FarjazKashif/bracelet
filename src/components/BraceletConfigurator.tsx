"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import HeartPendant from "./HeartPendant";
import { Button } from "./ui/button";
import { RadioGroup } from "./ui/radio-group";

type Shape = "round" | "square" | "diamond";
interface Bead { id: number; color: string; shape: Shape; }

const defaultPalette = [
  "#FFB6C1", // Soft Pink – romantic & elegant
  "#B19CD9", // Lilac Purple – dreamy, luxury vibe
  "#AEEEEE", // Aqua Blue – freshness & calm energy
  "#FFD700", // Gold – royalty & sparkle
  "#FF6F61", // Coral Red – charm & confidence
  "#E0BBE4", // Light Lavender – soft and trendy
  "#98FB98", // Mint Green – soothing & lively
  "#F5DEB3", // Warm Beige – for thread/knot realism
  "#C0C0C0", // Silver – neutral metallic tone
  "#000000", // Jet Black – balance & contrast
];

export default function BraceletConfigurator({ initial = 28 }: { initial?: number }) {
  // ---------- stable state & ids ----------
  const [count, setCount] = useState<number>(initial);
  const idRef = useRef<number>(initial);
  const [beads, setBeads] = useState<Bead[]>(
    Array.from({ length: initial }).map((_, i) => ({ id: i + 1, color: "#ffffff", shape: "round" }))
  );
  const [selectedIndex, setSelectedIndex] = useState<number | null>(0);

  // pendant and knot
  const [pendantType, setPendantType] = useState<"knot" | "heart">("knot");
  const [pendantColor, setPendantColor] = useState<string>("#FFD700");
  const [pendantSize, setPendantSize] = useState<number>(28);
  const [pendantPlacement, setPendantPlacement] = useState<"bottom" | "left" | "right">("bottom");
  const [pendantOffset, setPendantOffset] = useState<number>(2); // extra offset

  // thread options
  const [threadColor, setThreadColor] = useState<string>("#000000");
  const [threadThickness, setThreadThickness] = useState<number>(0.5);
  const [threadType, setThreadType] = useState<"rubber" | "thread">("rubber");

  // bead options
  const [palette, setPalette] = useState<string[]>(defaultPalette);
  const [beadScale, setBeadScale] = useState<number>(1); // multiplier for bead size
  const [symmetryEnabled, setSymmetryEnabled] = useState<boolean>(false);

  const [options, setOPtions] = useState<string>();

  // undo/redo history (simple)
  const historyRef = useRef<Bead[][]>([]);
  const redoRef = useRef<Bead[][]>([]);
  const pushHistory = (next: Bead[]) => {
    historyRef.current.push(JSON.parse(JSON.stringify(next)));
    // Trim history so it doesn't grow too large (optional)
    if (historyRef.current.length > 50) historyRef.current.shift();
    redoRef.current = []; // clear redo on new action
  };

  // mounted flag
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // sync bead array with count
  useEffect(() => {
    setBeads(prev => {
      if (prev.length === count) return prev;
      if (prev.length < count) {
        const next = prev.slice();
        for (let i = prev.length; i < count; i++) {
          idRef.current += 1;
          next.push({ id: idRef.current, color: "#ffffff", shape: "round" });
        }
        pushHistory(next);
        return next;
      } else {
        const next = prev.slice(0, count);
        pushHistory(next);
        return next;
      }
    });
    setSelectedIndex(s => (s !== null && s >= count ? count - 1 : s));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);

  // ---------- geometry ----------
  const size = 520;
  const cx = size / 2;
  const cy = size / 2;
  const radius = useMemo(() => Math.max(110, (size / 2) - 110), [size]);

  // base bead diameter computed from circle; we apply beadScale multiplier
  const beadDiameterBase = useMemo(() => {
    const circum = 2 * Math.PI * radius;
    const raw = (circum / Math.max(3, count)) * 0.78;
    return Math.max(10, Math.min(56, raw));
  }, [count, radius]);

  const beadDiameter = beadDiameterBase * beadScale;
  const beadRadius = beadDiameter / 2;

  // bead positions around circle
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

  // ---------- helper functions ----------
  function setBeadsWithHistory(next: Bead[]) {
    pushHistory(next);
    setBeads(next);
  }

  function updateBead(index: number, partial: Partial<Bead>) {
    setBeads(prev => {
      const next = prev.map((b, i) => (i === index ? { ...b, ...partial } : b));
      // symmetry: also update opposite bead
      if (symmetryEnabled) {
        const opp = (index + Math.floor(count / 2)) % count;
        next[opp] = { ...next[opp], ...partial };
      }
      pushHistory(next);
      return next;
    });
  }

  function addBead() { setCount(c => Math.min(80, c + 1)); }
  function removeBead() { setCount(c => Math.max(3, c - 1)); }

  function applySelectedToAll() {
    if (selectedIndex === null) return;
    const sel = beads[selectedIndex];
    if (!sel) return;
    const next = beads.map(b => ({ ...b, color: sel.color, shape: sel.shape }));
    setBeadsWithHistory(next);
  }

  function undo() {
    const h = historyRef.current;
    if (h.length <= 1) return;
    // move current to redo
    const current = h.pop()!;
    redoRef.current.push(current);
    const prev = h[h.length - 1];
    setBeads(JSON.parse(JSON.stringify(prev)));
  }

  function redo() {
    const r = redoRef.current;
    if (!r.length) return;
    const next = r.pop()!;
    historyRef.current.push(JSON.parse(JSON.stringify(next)));
    setBeads(JSON.parse(JSON.stringify(next)));
  }

  // save svg
  const svgRef = useRef<SVGSVGElement | null>(null);
  function downloadSVG() {
    if (!svgRef.current) return;
    const svgNode = svgRef.current.cloneNode(true) as SVGSVGElement;
    // inline styles: set thread color and thickness by manipulating cloned nodes
    // serialize
    const serializer = new XMLSerializer();
    const str = serializer.serializeToString(svgNode);
    const blob = new Blob([str], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bracelet.svg";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // initialize history with initial beads
  useEffect(() => {
    historyRef.current = [JSON.parse(JSON.stringify(beads))];
    redoRef.current = [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- render ----------
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="text-center mb-8 w-full max-w-2xl">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Design Your Bracelet</h1>
        <p className="text-slate-500">Customize your perfect bracelet with an improved designer</p>
      </div>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Preview */}
        <motion.div className="relative" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="relative p-8 rounded-3xl bg-white/80 backdrop-blur-xl border border-white/80 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Live Bracelet</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => { undo(); }} className="px-3 py-1 rounded bg-white border">Undo</button>
                <button onClick={() => { redo(); }} className="px-3 py-1 rounded bg-white border">Redo</button>
                <button onClick={downloadSVG} className="px-3 py-1 rounded bg-indigo-600 text-white">Download SVG</button>
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
                  <radialGradient id="pearlSheen" cx="0.3" cy="0.3" r="0.7">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.8)" />
                    <stop offset="80%" stopColor="rgba(255,255,255,0)" />
                  </radialGradient>
                </defs>

                {/* Thread / string */}
                {/* {(() => {
                  let dash = "";
                  if (threadType === "dashed") dash = "8 6";
                  if (threadType === "braided") dash = "2 4 2 6"; // approximated look
                  return (
                    <path
                      d={`M ${cx},${cy} m -${radius},0 a ${radius},${radius} 0 1,0 ${radius * 2},0 a ${radius},${radius} 0 1,0 -${radius * 2},0`}
                      fill="none"
                      stroke={threadColor}
                      strokeWidth={threadThickness}
                      strokeDasharray={dash || undefined}
                      strokeLinecap={threadType === "braided" ? "round" : "butt"}
                      opacity={0.9}
                    />
                  );
                })()} */}

                {/* Beads */}
                {positions.map((p, i) => {
                  const bead = beads[i];
                  if (!bead) return null;
                  const selected = selectedIndex === i;
                  const strokeColor = selected ? "#0f172a" : "#9aa0a6";

                  // pick fill: beads are either white or chosen color
                  const fillColor = bead.color || "#ffffff";

                  if (bead.shape === "round") {
                    return (
                      <g key={bead.id}>
                        <motion.circle
                          cx={p.x}
                          cy={p.y}
                          r={beadRadius}
                          fill={fillColor}
                          stroke={strokeColor}
                          strokeWidth={selected ? 2 : 1}
                          whileHover={{ scale: 1.06 }}
                          transition={{ type: "spring", stiffness: 220, damping: 18 }}
                          onClick={() => setSelectedIndex(i)}
                          style={{ cursor: "pointer" }}
                        />
                        <circle
                          cx={p.x - beadRadius * 0.28}
                          cy={p.y - beadRadius * 0.28}
                          r={beadRadius * 0.45}
                          fill="url(#pearlSheen)"
                          opacity={0.32}
                          pointerEvents="none"
                        />
                      </g>
                    );
                  }

                  if (bead.shape === "square") {
                    const x = p.x - beadRadius;
                    const y = p.y - beadRadius;
                    return (
                      <motion.rect
                        key={bead.id}
                        x={x}
                        y={y}
                        width={beadDiameter}
                        height={beadDiameter}
                        rx={Math.max(3, beadRadius * 0.2)}
                        fill={fillColor}
                        stroke={strokeColor}
                        strokeWidth={selected ? 2 : 1}
                        whileHover={{ scale: 1.04 }}
                        onClick={() => setSelectedIndex(i)}
                        style={{ cursor: "pointer" }}
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
                      points={pts}
                      fill={fillColor}
                      stroke={strokeColor}
                      strokeWidth={selected ? 2 : 1}
                      whileHover={{ scale: 1.04 }}
                      onClick={() => setSelectedIndex(i)}
                      style={{ cursor: "pointer" }}
                    />
                  );
                })}

                {/* Top knot (opposite of pendant). We will place knot at top center ( -Y ) */}

                {/* Pendant: position depends on pendantPlacement */}
                {(() => {
                  // knot position depends on pendantPlacement; pendant bottom means knot top
                  const knotX = cx + Math.cos(-Math.PI / 2) * radius;
                  const knotY = cy + Math.sin(-Math.PI / 2) * radius;
                  // small knot size relative to bead
                  const kScale = 50;

                  // compute base position for pendant placement
                  let angle = Math.PI / 2; // bottom
                  if (pendantPlacement === "bottom") angle = -Math.PI / 2;
                  if (pendantPlacement === "left") angle = Math.PI;
                  if (pendantPlacement === "right") angle = 0;
                  const px = cx; // center horizontally
                  const py = cy + radius + beadRadius * 1.3; // push it to the bottom below the beads

                  // Use your HeartPendant component exactly as before (color prop only)
                  if (pendantType === "heart") {
                    // place and scale
                    return (
                      <g transform={`translate(${px - pendantSize / 2} ${py - pendantSize / 2})`}>
                        {/* user HeartPendant expects color prop; keep same usage as your code */}
                        <HeartPendant color={pendantColor} />
                      </g>
                    );
                  }

                  // Thread knot pendant (if pendantType === "knot") — small drop knot below ring
                  return (
                    <g
                      transform={`translate(${cx}, ${cy - radius - 10})`}
                      fill="none"
                      stroke="#000"
                      strokeWidth={3}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      {/* left rope curve */}
                      <path d="M -20 10 Q -10 -5 0 0 Q 10 5 20 -5" />

                      {/* overlap section (tied part) */}
                      <path d="M -5 -2 Q 0 -10 5 -2" />

                      {/* rope ends */}
                      <path d="M -18 8 Q -25 0 -18 -8" />
                      <path d="M 18 -8 Q 25 0 18 8" />

                      {/* knot center */}
                      <circle cx="0" cy="-2" r="3" fill="#000" stroke="none" />
                    </g>

                  );
                })()}
              </svg>
            </div>
          </div>
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="space-y-6 bg-white/80 backdrop-blur-xl border border-white/80 rounded-3xl p-6 shadow-lg"
        >
          {/* Colors (per-bead or pendant) */}
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-2">Colors</label>
            <div className="flex gap-2 items-center">
              {palette.map(c => (
                <motion.button
                  key={c}
                  whileHover={{ scale: 1.06 }}
                  onClick={() => selectedIndex !== null && updateBead(selectedIndex, { color: c })}
                  style={{ background: c }}
                  className={`h-8 w-8 rounded-full border ${selectedIndex !== null && beads[selectedIndex]?.color === c ? "ring-2 ring-offset-2 ring-indigo-400" : ""}`}
                />
              ))}
              <motion.button
                whileHover={{ scale: 1.06 }}
                className="h-8 w-8 rounded-full border bg-white"
                onClick={() => selectedIndex !== null && updateBead(selectedIndex, { color: "#ffffff" })}
              />
              {/* <input
                aria-label="Custom color"
                type="color"
                className="h-8 w-8 p-0 border rounded-full"
                onChange={(e) => selectedIndex !== null && updateBead(selectedIndex, { color: e.target.value })}
                style={{ padding: 0 }}
                value={selectedIndex !== null ? beads[selectedIndex]?.color ?? "#ffffff" : "#ffffff"}
              /> */}
              <Button onClick={applySelectedToAll} className="ml-3 px-3 py-1 rounded font-medium">Apply to all</Button>
            </div>
          </div>

          {/* Bead shape */}
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-2">Shapes</label>
            <div className="flex gap-2">
              {(["round", "square", "diamond"] as Shape[]).map(s => (
                <motion.button
                  key={s}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => selectedIndex !== null && updateBead(selectedIndex, { shape: s })}
                  className={`px-4 py-2 rounded-full text-sm ${selectedIndex !== null && beads[selectedIndex]?.shape === s ? "bg-slate-900 text-white" : "bg-white border hover:bg-slate-50"}`}
                >
                  {s}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Pendant controls */}
          <div>
            <RadioGroup
              key={name}
              value={options[name]}
              onChange={(value) => {
                setOptions((prev) => ({
                  ...prev,
                  [name]: value
                }))
              }}
            >
              <Label className="text-zinc-700">{name.slice(0, 1).toUpperCase() + name.slice(1)}</Label>
              <div className='mt-3 space-y-4'>
                {selectableOptions.map((option) => (
                  <Radio
                    value={option}
                    key={option.value}
                    className={({ focus, checked }) =>
                      cn(
                        'relative block cursor-pointer rounded-lg bg-white px-6 py-4 shadow-sm border-2 border-zinc-200 focus:outline-none ring-0 focus:ring-0 outline-none sm:flex sm:justify-between',
                        {
                          'border-primary': focus || checked,
                        }
                      )
                    }
                  >
                    <span className='flex items-center'>
                      <span className='flex flex-col text-sm'>
                        <Radio value={option.label} className='font-medium text-gray-900'
                          as='span'>
                          {option.label}
                        </Radio>

                        {option.description ? (
                          <Radio value={option.description} as='span'
                            className='text-gray-500'>
                            <span className='block sm:inline'>
                              {option.description}
                            </span>
                          </Radio>
                        ) : null}
                      </span>
                    </span>

                    <Radio as='span' value={option.price}
                      className='mt-2 flex text-sm sm:ml-4 sm:mt-0 sm:flex-col sm:text-right'>
                      <span className='font-medium text-gray-900'>
                        {formatPrice(option.price / 100)}
                      </span>
                    </Radio>
                  </Radio>
                ))}
              </div>

            </RadioGroup>
            <label className="text-sm font-medium text-slate-700 block mb-2">Pendant Type:</label>
            <div className="flex gap-2 items-center mb-2">
              <button onClick={() => setPendantType("knot")} className={`px-3 py-1 rounded ${pendantType === "knot" ? "bg-slate-900 text-white" : "bg-white border"}`}>Knot</button>
              <button onClick={() => setPendantType("heart")} className={`px-3 py-1 rounded ${pendantType === "heart" ? "bg-slate-900 text-white" : "bg-white border"}`}>Half Heart</button>
            </div>

            {pendantType === "heart" && (
              <div className="flex items-center gap-2 mb-2">
                {palette.map(c => (
                  <button key={c} onClick={() => setPendantColor(c)} className={`h-7 w-7 rounded-full border ${pendantColor === c ? "ring-2 ring-indigo-400" : ""}`} style={{ background: c }} />
                ))}
              </div>
            )}

            {/* <div className="flex items-center gap-2">
              <label className="text-xs">Size</label>
              <input type="range" min={16} max={56} value={pendantSize} onChange={(e) => setPendantSize(Number(e.target.value))} className="mx-2" />
              <label className="text-xs">Placement</label>
              <select value={pendantPlacement} onChange={(e) => setPendantPlacement(e.target.value as any)} className="ml-2 border rounded px-2 py-1">
                <option value="bottom">Bottom</option>
                <option value="left">Left</option>
                <option value="right">Right</option>
              </select>
              <label className="text-xs ml-2">Offset</label>
              <input type="range" min={0} max={8} value={pendantOffset} onChange={(e) => setPendantOffset(Number(e.target.value))} className="mx-2" />
            </div> */}
          </div>

          {/* Symmetry toggle and duplicate */}
          <div className="flex items-center gap-3">
            <label className="text-sm">Symmetry: </label>
            <input type="checkbox" checked={symmetryEnabled} onChange={(e) => setSymmetryEnabled(e.target.checked)} />
            {/* <button onClick={applySelectedToAll} className="ml-4 px-3 py-1 rounded bg-white border">Apply selected to all</button> */}
          </div>

          {/* Bead count */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Bead count</label>
            <input type="range" min={3} max={80} value={count} onChange={(e) => setCount(Number(e.target.value))} className="w-full" />
            <div className="flex items-center gap-2">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setCount(c => Math.max(3, c - 1))} className="px-3 py-1 rounded-md bg-white border shadow-sm hover:bg-slate-50">-</motion.button>
              <div className="px-3 py-1 rounded-md bg-slate-50 font-medium">{count}</div>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setCount(c => Math.min(80, c + 1))} className="px-3 py-1 rounded-md bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg">+</motion.button>
            </div>
          </div>

          <p className="text-sm text-slate-500 pt-4 border-t">Click any bead to select and customize it. Use Undo/Redo and Download SVG to export your design.</p>
        </motion.div>
      </div>
    </div>
  );
}
