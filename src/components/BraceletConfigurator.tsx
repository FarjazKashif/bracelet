"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";


type Shape = "round" | "square" | "diamond";
type BeadSize = 3 | 8;
interface Bead { id: number; color: string; shape: Shape; size: BeadSize; }

const defaultPalette = [
  "#FFB6C1", "#B19CD9", "#AEEEEE", "#FFD700", "#FF6F61",
  "#E0BBE4", "#98FB98", "#F5DEB3", "#C0C0C0", "#000000",
];

interface BraceletState {
  count: number;
  beads: Bead[];
  selectedIndex: number | null;
  pendantType: "knot" | "heart";
  pendantColor: string;
  pendantSize: number;
  threadColor: string;
  threadThickness: number;
  threadType: "rubber" | "thread";
  symmetryEnabled: boolean;
}

function generateBraceletId() {
  return uuidv4().slice(0, 16); 
}

const configId = generateBraceletId();

export default function DualBraceletConfigurator({ initial = 28 }: { initial?: number }) {
  const [activeTab, setActiveTab] = useState<"first" | "second">("first");
  const [showBoth, setShowBoth] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [savedDesign, setSavedDesign] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiImageUrl, setAiImageUrl] = useState<string | null>(null);

  // Refs for SVG elements
  const svgRef1 = useRef<SVGSVGElement>(null);
  const svgRef2 = useRef<SVGSVGElement>(null);

  // State for first bracelet
  const [bracelet1, setBracelet1] = useState<BraceletState>({
    count: initial,
    beads: Array.from({ length: initial }).map((_, i) => ({
      id: i + 1,
      color: "#ffffff",
      shape: "round",
      size: 8
    })),
    selectedIndex: 0,
    pendantType: "knot",
    pendantColor: "#FFD700",
    pendantSize: 28,
    threadColor: "#000000",
    threadThickness: 0.5,
    threadType: "rubber",
    symmetryEnabled: false,
  });

  // State for second bracelet
  const [bracelet2, setBracelet2] = useState<BraceletState>({
    count: initial,
    beads: Array.from({ length: initial }).map((_, i) => ({
      id: i + 1000,
      color: "#ffffff",
      shape: "round",
      size: 8
    })),
    selectedIndex: 0,
    pendantType: "heart",
    pendantColor: "#C0C0C0",
    pendantSize: 28,
    threadColor: "#333333",
    threadThickness: 0.5,
    threadType: "rubber",
    symmetryEnabled: false,
  });

  const currentBracelet = activeTab === "first" ? bracelet1 : bracelet2;
  const setCurrentBracelet = activeTab === "first" ? setBracelet1 : setBracelet2;

  // Update bead function
  function updateBead(index: number, partial: Partial<Bead>) {
    setCurrentBracelet(prev => {
      const next = { ...prev };
      next.beads = prev.beads.map((b, i) => (i === index ? { ...b, ...partial } : b));

      if (prev.symmetryEnabled) {
        const opp = (index + Math.floor(prev.count / 2)) % prev.count;
        next.beads[opp] = { ...next.beads[opp], ...partial };
      }

      return next;
    });
  }

  function applySelectedToAll() {
    if (currentBracelet.selectedIndex === null) return;
    const sel = currentBracelet.beads[currentBracelet.selectedIndex];
    if (!sel) return;

    setCurrentBracelet(prev => ({
      ...prev,
      beads: prev.beads.map(b => ({ ...b, color: sel.color, shape: sel.shape, size: sel.size }))
    }));
  }

  // Convert SVG to Blob
  async function svgToBlob(svgElement: SVGSVGElement): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      // Set canvas size
      canvas.width = 520;
      canvas.height = 520;

      img.onload = () => {
        if (ctx) {
          // Fill white background
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Failed to convert canvas to blob'));
          }, 'image/png');
        }
      };

      img.onerror = () => reject(new Error('Failed to load SVG'));
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    });
  }

  // Generate AI image
  async function generateAIImage() {
    if (!savedDesign) {
      toast.error("Please save your design first!");
      return;
    }

    setAiGenerating(true);
    setError(null);
    const toastId = toast.loading("Creating AI magic...");

    try {
      console.log('Starting AI generation with:', {
        bracelet1Url: savedDesign.bracelet1ImageUrl,
        bracelet2Url: savedDesign.bracelet2ImageUrl,
        configurationId: savedDesign.id
      });

      const response = await fetch('/api/huggingFace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bracelet1Url: savedDesign.bracelet1ImageUrl,
          bracelet2Url: savedDesign.bracelet2ImageUrl,
          configurationId: savedDesign.id
        })
      });

      const result = await response.json();
      console.log('AI generation result:', result);

      if (!result.success) {
        throw new Error(result.error || result.details || 'AI generation failed');
      }

      setAiImageUrl(result.aiImageUrl);
      toast.success("AI photo generated! ✨", { 
        id: toastId,
        style: {
          fontFamily: 'Recursive, sans-serif',
        }
      });

    } catch (error: any) {
      console.error('AI generation error:', error);
      setError(error.message || "Failed to generate AI image");
      toast.error(error.message || "Failed to generate AI image", { id: toastId });
    } finally {
      setAiGenerating(false);
    }
  }

  // Save design to database via API
  async function handleSaveDesign() {
    setUploading(true);
    setError(null);

    try {
      console.log('Starting save process...');
      
      if (!svgRef1.current || !svgRef2.current) {
        throw new Error('SVG elements not found');
      }

      console.log('Converting SVG 1 to blob...');
      const blob1 = await svgToBlob(svgRef1.current);
      console.log('Blob 1 created:', blob1.size, 'bytes');
      
      console.log('Converting SVG 2 to blob...');
      const blob2 = await svgToBlob(svgRef2.current);
      console.log('Blob 2 created:', blob2.size, 'bytes');

      // Create form data
      const formData = new FormData();
      formData.append('bracelet1', blob1, 'bracelet1.png');
      formData.append('bracelet2', blob2, 'bracelet2.png');
      formData.append('bracelet1_config', JSON.stringify(bracelet1));
      formData.append('bracelet2_config', JSON.stringify(bracelet2));

      // Optional: Add user ID if you have authentication
      // formData.append('userId', 'user_123');

      console.log('Sending request to /api/bracelets...');
      
      // Call API
      const response = await fetch('/api/bracelets', {
        method: 'POST',
        body: formData
      });

      console.log('Response status:', response.status);
      
      const result = await response.json();
      console.log('Response data:', result);

      if (!result.success) {
        throw new Error(result.error || result.details || 'Upload failed');
      }

      setSavedDesign(result.data);
      console.log('Saved design:', result.data);
      alert('Design saved successfully! 🎉');

    } catch (err: any) {
      console.error('Full error details:', err);
      console.error('Error message:', err.message);
      console.error('Error stack:', err.stack);
      setError(err.message || 'Failed to save design. Check console for details.');
    } finally {
      setUploading(false);
    }
  }

  // Render bracelet SVG
  function renderBraceletSVG(state: BraceletState, size: number = 520, offsetX: number = 0) {
    const cx = size / 2 + offsetX;
    const cy = size / 2;
    const radius = Math.max(110, (size / 2) - 110);

    const beadDiameterBase = useMemo(() => {
      const circum = 2 * Math.PI * radius;
      const raw = (circum / Math.max(3, state.count)) * 0.78;
      return Math.max(10, Math.min(56, raw));
    }, [state.count, radius]);

    // Evenly distribute beads around the circle - positions stay fixed
    const positions = useMemo(() => {
      const arr: { x: number; y: number }[] = [];
      const startAngle = -Math.PI / 2;
      for (let i = 0; i < state.count; i++) {
        const angle = startAngle + (i * 2 * Math.PI) / state.count;
        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius;
        arr.push({ x, y });
      }
      return arr;
    }, [state.count, radius, cx, cy]);

    return (
      <g>
        <defs>
          <radialGradient id={`pearlSheen-${offsetX}`} cx="0.3" cy="0.3" r="0.7">
            <stop offset="0%" stopColor="rgba(255,255,255,0.8)" />
            <stop offset="80%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
        </defs>

        {/* Thread / string */}
        {(() => {
          let dash = "";
          if (state.threadType === "rubber") dash = "8 6";
          if (state.threadType === "thread") dash = "2 4 2 6";
          return (
            <path
              d={`M ${cx},${cy} m -${radius},0 a ${radius},${radius} 0 1,0 ${radius * 2},0 a ${radius},${radius} 0 1,0 -${radius * 2},0`}
              fill="none"
              stroke={state.threadColor}
              strokeWidth={state.threadThickness}
              strokeDasharray={dash || undefined}
              strokeLinecap={state.threadType === "thread" ? "round" : "butt"}
              opacity={0.9}
            />
          );
        })()}

        {/* Beads */}
        {positions.map((p, i) => {
          const bead = state.beads[i];
          if (!bead) return null;
          const selected = state.selectedIndex === i && !showBoth;
          const strokeColor = selected ? "#0f172a" : "#9aa0a6";
          const fillColor = bead.color || "#ffffff";

          const beadDiameter = bead.size === 3 ? beadDiameterBase * 0.5 : beadDiameterBase;
          const beadRadius = beadDiameter / 2;

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
                  onClick={() => !showBoth && setCurrentBracelet(prev => ({ ...prev, selectedIndex: i }))}
                  style={{ cursor: showBoth ? "default" : "pointer" }}
                />
                <circle
                  cx={p.x - beadRadius * 0.28}
                  cy={p.y - beadRadius * 0.28}
                  r={beadRadius * 0.45}
                  fill={`url(#pearlSheen-${offsetX})`}
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
                onClick={() => !showBoth && setCurrentBracelet(prev => ({ ...prev, selectedIndex: i }))}
                style={{ cursor: showBoth ? "default" : "pointer" }}
              />
            );
          }

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
              onClick={() => !showBoth && setCurrentBracelet(prev => ({ ...prev, selectedIndex: i }))}
              style={{ cursor: showBoth ? "default" : "pointer" }}
            />
          );
        })}

        {/* Pendant */}
        {(() => {
          const px = cx;
          const avgBeadRadius = beadDiameterBase / 2;
          const py = cy + radius + avgBeadRadius * 1.3;

          if (state.pendantType === "heart") {
            return (
              <g transform={`translate(${px - state.pendantSize / 2} ${py - state.pendantSize / 2})`}>
                <svg width={state.pendantSize} height={state.pendantSize} viewBox="0 0 30 30">
                  <defs>
                    <filter id={`pendant-shadow-${offsetX}`} x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow
                        dx="0"
                        dy="1"
                        stdDeviation="1"
                        floodColor="#000000"
                        floodOpacity="0.3"
                      />
                    </filter>
                  </defs>
                  <path
                    d="M15 7 C15 7 13 3 8 3 C3 3 1 8 1 11 C1 14 3 20 15 27 L15 7"
                    fill={state.pendantColor}
                    stroke="#333"
                    strokeWidth="0.5"
                    filter={`url(#pendant-shadow-${offsetX})`}
                  />
                  <circle
                    cx={0.3}
                    cy={0.3}
                    r={0.5}
                    fill={`url(#pearlSheen-${offsetX})`}
                    opacity="0.3"
                    pointerEvents="none"
                  />
                </svg>
              </g>
            );
          }

          return (
            <g
              transform={`translate(${px} ${py})`}
              fill="none"
              stroke="#000"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M -20 10 Q -10 -5 0 0 Q 10 5 20 -5" />
              <path d="M -5 -2 Q 0 -10 5 -2" />
              <path d="M -18 8 Q -25 0 -18 -8" />
              <path d="M 18 -8 Q 25 0 18 8" />
              <circle cx="0" cy="-2" r="3" fill="#000" stroke="none" />
            </g>
          );
        })()}
      </g>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="text-center mb-8 w-full max-w-2xl">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Design Your Bracelet</h1>
        <p className="text-slate-500">Customize your perfect bracelet with dual design option</p>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg max-w-6xl w-full">
          <p className="text-red-800 font-medium">❌ {error}</p>
        </div>
      )}

      {savedDesign && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg max-w-6xl w-full">
          <p className="text-green-800 font-medium">✅ Design saved successfully!</p>
          <div className="mt-2 text-sm text-green-600">
            <p>Bracelet 1: <a href={savedDesign.bracelet1ImageUrl} target="_blank" rel="noopener noreferrer" className="underline">View Image</a></p>
            <p>Bracelet 2: <a href={savedDesign.bracelet2ImageUrl} target="_blank" rel="noopener noreferrer" className="underline">View Image</a></p>
          </div>
        </div>
      )}

      {/* AI Generated Image Display */}
      {aiImageUrl && (
        <div className="mb-4 p-6 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl max-w-6xl w-full">
          <h3 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
            <span>🪄</span> AI Generated Photo
          </h3>
          <img 
            src={aiImageUrl} 
            alt="AI Generated Bracelets" 
            className="w-full rounded-lg shadow-xl mb-3"
          />
          <div className="flex gap-3">
            <a
              href={aiImageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              Open Full Size →
            </a>
            <a
              href={aiImageUrl}
              download="ai-bracelet-design.png"
              className="px-4 py-2 bg-white text-purple-600 border-2 border-purple-600 rounded-lg hover:bg-purple-50 transition"
            >
              Download ⬇️
            </a>
          </div>
        </div>
      )}

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Preview */}
        <motion.div className="relative" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="relative p-8 rounded-3xl bg-white/80 backdrop-blur-xl border border-white/80 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">
                {showBoth ? "Both Bracelets" : activeTab === "first" ? "First Bracelet" : "Second Bracelet"}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowBoth(!showBoth)}
                  className="px-3 py-1 rounded bg-indigo-600 text-white cursor-pointer text-sm"
                >
                  {showBoth ? "Edit Mode" : "View Pair"}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <svg
                viewBox={showBoth ? "0 0 1100 520" : "0 0 520 520"}
                width={showBoth ? 1100 : 520}
                height={520}
                className="max-w-full"
                role="img"
                aria-label="Bracelet preview"
              >
                {showBoth ? (
                  <>
                    {renderBraceletSVG(bracelet1, 520, -40)}
                    {renderBraceletSVG(bracelet2, 520, 580)}
                  </>
                ) : (
                  renderBraceletSVG(currentBracelet, 520, 0)
                )}
              </svg>
            </div>

            {/* Hidden SVGs for export */}
            <div style={{ position: 'absolute', left: '-9999px' }}>
              <svg ref={svgRef1} viewBox="0 0 520 520" width={520} height={520}>
                {renderBraceletSVG(bracelet1, 520, 0)}
              </svg>
              <svg ref={svgRef2} viewBox="0 0 520 520" width={520} height={520}>
                {renderBraceletSVG(bracelet2, 520, 0)}
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
          {/* Tabs */}
          <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => setActiveTab("first")}
              className={`flex-1 px-4 py-2 rounded-md font-medium transition-all ${activeTab === "first"
                ? "bg-white text-slate-900 shadow"
                : "text-slate-600 hover:text-slate-900"
                }`}
            >
              First Bracelet
            </button>
            <button
              onClick={() => setActiveTab("second")}
              className={`flex-1 px-4 py-2 rounded-md font-medium transition-all ${activeTab === "second"
                ? "bg-white text-slate-900 shadow"
                : "text-slate-600 hover:text-slate-900"
                }`}
            >
              Second Bracelet
            </button>
          </div>

          {/* Colors */}
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-2">Colors:</label>
            <div className="flex gap-2 items-center text-gray-100 text-2xl font-light">
              {defaultPalette.map(c => (
                <motion.button
                  key={c}
                  whileHover={{ scale: 1.06 }}
                  onClick={() => currentBracelet.selectedIndex !== null && updateBead(currentBracelet.selectedIndex, { color: c })}
                  style={{ background: c }}
                  className={`h-8 w-7 rounded-full border ${currentBracelet.selectedIndex !== null && currentBracelet.beads[currentBracelet.selectedIndex]?.color === c ? "ring-2 ring-offset-2 ring-indigo-400" : ""}`}
                />
              ))}
              <motion.button
                whileHover={{ scale: 1.06 }}
                className="h-8 w-7 rounded-full border bg-white cursor-pointer"
                onClick={() => currentBracelet.selectedIndex !== null && updateBead(currentBracelet.selectedIndex, { color: "#ffffff" })}
              />
              |
              <button
                onClick={applySelectedToAll}
                className="px-3 py-1 rounded font-medium cursor-pointer bg-slate-900 text-white text-sm"
              >
                Apply all
              </button>
            </div>
          </div>

          {/* Bead shape */}
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-2">Shapes:</label>
            <div className="flex gap-2">
              {(["round", "square", "diamond"] as Shape[]).map(s => (
                <motion.button
                  key={s}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => currentBracelet.selectedIndex !== null && updateBead(currentBracelet.selectedIndex, { shape: s })}
                  className={`px-4 py-2 rounded-full text-sm ${currentBracelet.selectedIndex !== null && currentBracelet.beads[currentBracelet.selectedIndex]?.shape === s ? "bg-slate-900 text-white" : "bg-white border hover:bg-slate-50"}`}
                >
                  {s}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Bead Size */}
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-2">Bead Size:</label>
            <div className="flex gap-2">
              {([3, 8] as const).map(size => (
                <motion.button
                  key={size}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => currentBracelet.selectedIndex !== null && updateBead(currentBracelet.selectedIndex, { size })}
                  className={`px-4 py-2 rounded-full text-sm ${currentBracelet.selectedIndex !== null &&
                    currentBracelet.beads[currentBracelet.selectedIndex]?.size === size
                    ? "bg-slate-900 text-white"
                    : "bg-white border hover:bg-slate-50"
                    }`}
                >
                  {size}mm
                </motion.button>
              ))}
            </div>
          </div>

          {/* Band Material */}
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-2">Band Material:</label>
            <div className="flex gap-2">
              {(["rubber", "thread"] as const).map(type => (
                <motion.button
                  key={type}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setCurrentBracelet(prev => ({ ...prev, threadType: type }))}
                  className={`px-4 py-2 rounded-full text-sm capitalize ${currentBracelet.threadType === type
                    ? "bg-slate-900 text-white"
                    : "bg-white border hover:bg-slate-50"
                    }`}
                >
                  {type}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Pendant Type */}
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-2">Pendant Type:</label>
            <div className="flex gap-2">
              {(["knot", "heart"] as const).map(type => (
                <motion.button
                  key={type}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setCurrentBracelet(prev => ({ ...prev, pendantType: type }))}
                  className={`px-4 py-2 rounded-full text-sm capitalize ${currentBracelet.pendantType === type
                    ? "bg-slate-900 text-white"
                    : "bg-white border hover:bg-slate-50"
                    }`}
                >
                  {type}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Symmetry toggle */}
          <div className="flex items-center gap-3">
            <label className="text-sm">Symmetry: </label>
            <input
              type="checkbox"
              checked={currentBracelet.symmetryEnabled}
              onChange={(e) => setCurrentBracelet(prev => ({ ...prev, symmetryEnabled: e.target.checked }))}
            />
          </div>

          <p className="text-sm text-slate-500 pt-4 border-t">Click any bead to select and customize it. Switch tabs to design the second bracelet.</p>

          <button
            disabled={uploading}
            className={`w-full px-4 py-3 rounded-lg font-medium shadow-lg transition-all ${
              uploading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:shadow-xl'
            }`}
            onClick={handleSaveDesign}
          >
            {uploading ? (
              <span className="flex items-center justify-center gap-2">
                Saving your design
                <span className="flex gap-1">
                  <span className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </span>
              </span>
            ) : (
              'See the Magic ✨'
            )}
          </button>

          {/* AI Generation Button */}
          {savedDesign && (
            <button
              onClick={generateAIImage}
              disabled={aiGenerating}
              className={`w-full px-4 py-3 rounded-lg font-medium shadow-lg transition-all mt-3 ${
                aiGenerating
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-xl'
              }`}
            >
              {aiGenerating ? (
                <span className="flex items-center justify-center gap-2">
                  Generating AI photo
                  <span className="flex gap-1">
                    <span className="w-2 h-2 bg-white rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </span>
                </span>
              ) : (
                '🪄 Generate AI Photo'
              )}
            </button>
          )}
        </motion.div>
      </div>
    </div>
  );
}