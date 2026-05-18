import React, { useEffect, useState, useMemo } from "react";
import { OrbScene } from "./OrbScene";
import "./Orb.css";

export default function Orb({ size = 420, voiceState = 'idle', theme = 'nebula' }) {
  const [pointer, setPointer] = useState({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const handleMove = (e) => {
      setPointer({
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      });
    };
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  const themeColors = useMemo(() => {
    const themes = {
      nebula: { top: '#0055ff', bottom: '#7700ff' },
      ocean: { top: '#00ffcc', bottom: '#0055ff' },
      sunset: { top: '#ff4400', bottom: '#aa0055' },
      matrix: { top: '#00ff00', bottom: '#005500' },
    };
    return themes[theme] || themes.nebula;
  }, [theme]);

  return (
    <div className={`orb-scene state-${voiceState} theme-${theme}`}>
      <div
        className="orb-wrapper"
        style={{
          width: size,
          height: size,
          transform: `
            rotateX(${(pointer.y - 0.5) * 12}deg)
            rotateY(${(pointer.x - 0.5) * -12}deg)
          `,
          transformStyle: 'preserve-3d',
        }}
      >
        <OrbScene voiceState={voiceState} themeColors={themeColors} />
        <div className="orb-ambient" />
      </div>
    </div>
  );
}
