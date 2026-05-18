import React, { useEffect, useRef } from 'react';

const Waveform = ({ isVisible, voiceState = 'listening' }) => {
  const pathRef = useRef(null);
  const requestRef = useRef(null);
  const phase1Ref = useRef(0);
  const phase2Ref = useRef(0);
  const phase3Ref = useRef(0);

  // Easing multipliers for dynamic transitions
  const currentAmpRef = useRef(1.0);
  const currentSpeedRef = useRef(1.0);

  useEffect(() => {
    if (!isVisible) return;

    const animate = () => {
      // Determine target properties based on voiceState
      let targetAmp = 38.0; // Dynamic scaling for taller visualizer peaks
      let targetSpeed = 1.0;
      let freqMult = 1.0;

      if (voiceState === 'listening') {
        targetAmp = 46.0;
        targetSpeed = 1.8;
        freqMult = 1.0;
      } else if (voiceState === 'executing') {
        targetAmp = 32.0;
        targetSpeed = 3.6; // Rapid "thinking" oscillations
        freqMult = 1.6;
      } else if (voiceState === 'waking') {
        targetAmp = 50.0; // Big burst
        targetSpeed = 2.4;
        freqMult = 1.2;
      } else { // 'idle' or sleeping
        targetAmp = 2.0; // Subtle breathing baseline
        targetSpeed = 0.4;
        freqMult = 0.5;
      }

      // Smoothly interpolate current amplitude and speed
      currentAmpRef.current += (targetAmp - currentAmpRef.current) * 0.12;
      currentSpeedRef.current += (targetSpeed - currentSpeedRef.current) * 0.12;

      // Update phases
      phase1Ref.current += 0.035 * currentSpeedRef.current;
      phase2Ref.current += 0.025 * currentSpeedRef.current;
      phase3Ref.current += 0.055 * currentSpeedRef.current;

      const p1 = phase1Ref.current;
      const p2 = phase2Ref.current;
      const p3 = phase3Ref.current;
      const amp = currentAmpRef.current;

      const width = 450;
      const height = 60;
      const centerY = height / 2;
      const numBars = 75; // Total dynamic vertical bars
      const spacing = width / (numBars - 1);

      let d = '';

      for (let i = 0; i < numBars; i++) {
        const x = i * spacing;
        
        // Taper envelope to guarantee flat ends at left and right boundaries
        const envelope = Math.sin((Math.PI * i) / (numBars - 1));

        // carrier low-freq clumps (envelope packets)
        const carrier = Math.sin(i * 0.08 * freqMult - p1) * 0.65 + Math.cos(i * 0.16 * freqMult + p2) * 0.35;
        // high-freq spiky detail
        const detail = Math.sin(i * 0.42 * freqMult + p3) * 0.4 + Math.cos(i * 0.95 * freqMult - p1 * 1.3) * 0.2;

        // Combine and apply spiky power-curve to create vertical transients
        const mix = Math.abs(carrier * 0.6 + detail * 0.4);
        const spikyHeight = Math.pow(mix, 1.45) * amp * envelope;

        // Ensure a tiny, sleek idle baseline height
        const barHeight = Math.max(1.8, spikyHeight);

        const yTop = centerY - barHeight / 2;
        const yBottom = centerY + barHeight / 2;

        // Add a vertical bar line sub-path (rounded cap applied via CSS)
        d += ` M ${x} ${yTop} L ${x} ${yBottom}`;
      }

      if (pathRef.current) {
        pathRef.current.setAttribute('d', d);
      }

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isVisible, voiceState]);

  if (!isVisible) return null;

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg 
        width="100%" 
        height="60px" 
        viewBox="0 0 450 60" 
        preserveAspectRatio="none"
        style={{ overflow: 'visible' }}
      >
        <defs>
          {/* Precise neon horizontal color gradient from Image 4 */}
          <linearGradient id="mirroredWaveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00e5ff" />
            <stop offset="50%" stopColor="#0077ff" />
            <stop offset="100%" stopColor="#d946ef" />
          </linearGradient>

          {/* Volumetric neon glow filter */}
          <filter id="mirroredGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3.0" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Micro-dot baseline behind the bars */}
        <line 
          x1="0" 
          y1="30" 
          x2="450" 
          y2="30" 
          stroke="rgba(0, 229, 255, 0.05)" 
          strokeWidth="1.2" 
          strokeDasharray="2 3"
        />

        {/* Mirrored Vertical Audio Bars rendered in a single high-performance path */}
        <path 
          ref={pathRef} 
          fill="none" 
          stroke="url(#mirroredWaveGrad)" 
          strokeWidth="2.8" 
          strokeLinecap="round" 
          filter="url(#mirroredGlow)"
          style={{ opacity: 0.95 }}
        />
      </svg>
    </div>
  );
};

export default Waveform;
