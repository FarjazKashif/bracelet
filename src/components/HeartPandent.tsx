import React from "react";

interface HeartPendantProps {
  color?: string; // dynamic left half color
}

const HeartPendant: React.FC<HeartPendantProps> = ({ color = "#4ade80" }) => {
  return (
    <svg
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      width="200"
      height="200"
    >
      {/* --- Beads (white with black border) --- */}
      <circle cx="40" cy="40" r="15" fill="white" stroke="black" strokeWidth="2" />
      <circle cx="80" cy="40" r="15" fill="white" stroke="black" strokeWidth="2" />
      <circle cx="120" cy="40" r="15" fill="white" stroke="black" strokeWidth="2" />
      <circle cx="160" cy="40" r="15" fill="white" stroke="black" strokeWidth="2" />

      {/* --- Connecting black chain circles --- */}
      <circle cx="100" cy="60" r="4" fill="black" />
      <circle cx="100" cy="70" r="3" fill="black" />
      <circle cx="100" cy="80" r="2" fill="black" />

      {/* --- Half-filled heart pendant --- */}
      <path
        d="M100 120 
           L85 100 
           A15 15 0 0 1 115 100 
           Z"
        fill={color}
      />
      <path
        d="M100 120 
           L85 100 
           A15 15 0 0 1 115 100 
           Z"
        fill="none"
        stroke="black"
        strokeWidth="2"
      />
      <path
        d="M100 120 
           L115 100 
           A15 15 0 0 0 85 100 
           Z"
        fill="white"
        stroke="black"
        strokeWidth="2"
      />
    </svg>
  );
};

export default HeartPendant;
