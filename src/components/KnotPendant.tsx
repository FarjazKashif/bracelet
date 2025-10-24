"use client";

import React from "react";

interface KnotPendantProps {
  x: number;
  y: number;
  size: number;
}

export default function KnotPendant({ x, y, size }: KnotPendantProps) {
  const ropeWidth = size * 0.22;
  const loopRadius = size * 0.45;
  const highlight = "rgba(255,255,255,0.55)";

  return (
    <g filter="url(#softShadow)">
      {/* Base rope (two overlapping loops forming a knot) */}
      <path
        d={`
          M ${x - loopRadius},${y}
          C ${x - loopRadius * 1.1},${y - loopRadius * 0.8},
            ${x + loopRadius * 1.1},${y - loopRadius * 0.8},
            ${x + loopRadius},${y}
          C ${x + loopRadius * 1.1},${y + loopRadius * 0.8},
            ${x - loopRadius * 1.1},${y + loopRadius * 0.8},
            ${x - loopRadius},${y}
        `}
        fill="none"
        stroke="#bfa06e"
        strokeWidth={ropeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Slight darker shading for realism */}
      <path
        d={`
          M ${x - loopRadius * 0.9},${y + ropeWidth * 0.3}
          C ${x},${y + loopRadius * 0.6},
            ${x + loopRadius * 0.9},${y + ropeWidth * 0.3},
            ${x + loopRadius * 0.2},${y - ropeWidth * 0.2}
        `}
        fill="none"
        stroke="#8c6b36"
        strokeWidth={ropeWidth * 0.5}
        strokeLinecap="round"
        opacity="0.4"
      />

      {/* Highlight line */}
      <path
        d={`
          M ${x - loopRadius * 0.8},${y - ropeWidth * 0.2}
          C ${x},${y - loopRadius * 0.4},
            ${x + loopRadius * 0.8},${y - ropeWidth * 0.2},
            ${x + loopRadius * 0.1},${y + ropeWidth * 0.1}
        `}
        fill="none"
        stroke={highlight}
        strokeWidth={ropeWidth * 0.25}
        strokeLinecap="round"
        opacity="0.7"
      />
    </g>
  );
}
