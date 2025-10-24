export default function HeartPendant({ color = "#FF69B4" }: { color?: string }) {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30">
      <defs>
        <filter id="pendant-shadow" x="-20%" y="-20%" width="140%" height="140%">
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
        fill={color}
        stroke="#333"
        strokeWidth="0.5"
        filter="url(#pendant-shadow)"
      />
    </svg>
  );
}
