import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const Particles = ({ count = 300, color = "#4df6ff" }) => {
  const pointsRef = useRef();

  // Generate random positions in a sphere around the orb
  const [positions, speeds] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const spd = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      // Random spherical distribution
      const r = 1.2 + Math.random() * 1.5; // Radius between 1.2 and 2.7
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
      
      spd[i] = 0.2 + Math.random() * 0.5; // Random speed multiplier
    }
    return [pos, spd];
  }, [count]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (pointsRef.current) {
      // Rotate the entire particle cloud slowly
      pointsRef.current.rotation.y = time * 0.05;
      pointsRef.current.rotation.z = time * 0.02;

      // Pulse opacity
      pointsRef.current.material.opacity = 0.4 + Math.sin(time * 2) * 0.2;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        color={color}
        transparent
        opacity={0.6}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation={true}
      />
    </points>
  );
};
