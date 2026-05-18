import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const floorFragmentShader = `
uniform float uTime;
uniform vec3 uColor;
varying vec2 vUv;

void main() {
  // Center is (0.5, 0.5)
  vec2 center = vec2(0.5);
  float dist = distance(vUv, center) * 2.0; // 0 at center, 1 at edge
  
  if (dist > 1.0) discard; // Make it a circle
  
  // Create outward moving ripples
  float ripple = sin((dist - uTime * 0.2) * 40.0);
  
  // Sharpen the ripples into thin lines
  ripple = smoothstep(0.8, 0.95, ripple);
  
  // Fade out towards the edge
  float edgeFade = 1.0 - smoothstep(0.5, 1.0, dist);
  
  // Subtle center glow
  float centerGlow = 1.0 - smoothstep(0.0, 0.3, dist);
  
  float alpha = (ripple + centerGlow * 0.5) * edgeFade * 0.3; // 0.3 overall opacity
  
  gl_FragColor = vec4(uColor, alpha);
}
`;

const floorVertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const FloorRings = ({ color = "#4df6ff" }) => {
  const materialRef = useRef();

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
      // Optionally pulse opacity based on time or state
    }
  });

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.8, 0]}>
      <planeGeometry args={[6, 6]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={floorVertexShader}
        fragmentShader={floorFragmentShader}
        transparent={true}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        uniforms={{
          uTime: { value: 0 },
          uColor: { value: new THREE.Color(color) }
        }}
      />
    </mesh>
  );
};
