import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSpring } from 'framer-motion';
import { snoiseGLSL } from './shaders/noise';

const coreVertexShader = `
varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vNormal;

void main() {
  vUv = uv;
  vPosition = position;
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const coreFragmentShader = `
uniform float uTime;
uniform vec3 uColorTop;
uniform vec3 uColorBottom;
uniform float uIntensity;
uniform float uStateTransition; // 0=Plasma, 1=Wireframe

varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vNormal;

${snoiseGLSL}

void main() {
  vec3 viewDir = normalize(cameraPosition - vPosition);
  // Fresnel: 1.0 at center facing camera, 0.0 at grazing edges
  float fresnel = dot(viewDir, vNormal);
  fresnel = clamp(fresnel, 0.0, 1.0);
  
  // ==========================================
  // PLASMA (Idle) - Precise Sweep/Streamline Shader
  // ==========================================
  float t = uTime * 0.08;
  
  // 1. Sleek, diagonal sweeping coordinates warped by 3D noise
  // Warping coordinates creates organic, elegant, wavy silk-like strands
  float warp = snoise(vPosition * 1.5 - t) * 1.5;
  float warp2 = snoise(vPosition * 2.5 + t * 1.2) * 1.0;
  
  // Main sweeping lines (tilted bottom-left to top-right)
  float coord1 = (vPosition.x - vPosition.y) * 2.8 + warp;
  float lines1 = smoothstep(0.96, 1.0, abs(sin(coord1)));
  
  // Secondary fine-detail sweeping lines
  float coord2 = (vPosition.x - vPosition.y) * 5.5 + warp2;
  float lines2 = smoothstep(0.97, 1.0, abs(sin(coord2))) * 0.4;
  
  // 2. Rim Glow & Crisp Glowing Border (Image 2)
  // Wide ambient glow around the edge (colored cyan/violet)
  float rim = pow(1.0 - fresnel, 3.2) * 1.5;
  
  // Ultra-crisp, extremely thin white glass outline ring right at the grazing edge
  float edgeRing = smoothstep(0.95, 0.97, 1.0 - fresnel) * (1.0 - smoothstep(0.985, 0.995, 1.0 - fresnel));
  
  // Fade the lines inside the core so the text stays completely readable and clean
  float lineMask = pow(1.0 - fresnel, 1.5);
  
  // The general glow intensity of lines + ambient rim shades
  float finalGlow = ((lines1 + lines2) * lineMask * 0.95 + rim) * uIntensity;

  // ==========================================
  // MIX & COLOR
  // ==========================================
  // Beautiful deep colors: violet on left, cyan on right
  vec3 colorLeft = vec3(0.22, 0.05, 0.85);  // Deep rich violet
  vec3 colorRight = vec3(0.0, 0.5, 0.95);   // Luminous cyan/blue
  
  float mixFactor = clamp((vPosition.x + 0.8) * 0.6, 0.0, 1.0);
  vec3 baseColor = mix(colorLeft, colorRight, mixFactor);
  
  // Deep navy, almost black center for realistic volume
  vec3 darkCore = vec3(0.004, 0.004, 0.015);
  
  // Core color mixing (interior plasma + ambient rim shades)
  vec3 finalColor = mix(darkCore, baseColor, clamp(finalGlow, 0.0, 1.0));
  
  // Add a brilliant, pure glowing white ring exactly at the edge, enhanced by intensity
  vec3 whiteRingColor = vec3(0.95, 0.98, 1.0) * edgeRing * 1.8 * uIntensity;
  finalColor += whiteRingColor;
  
  // Soft transparency centered around the core + full opacity for the crisp white ring
  float alpha = clamp(finalGlow + 0.55 + edgeRing, 0.0, 1.0);
  
  gl_FragColor = vec4(finalColor, alpha);
}
`;

export const CoreSphere = ({ voiceState, themeColors }) => {
  const groupRef = useRef();
  const materialRef = useRef();
  const innerSphereRef = useRef();
  const outerSphereRef = useRef();

  // Standard Framer Motion springs for shader uniforms and scale
  const stateTransition = useSpring(0, { stiffness: 40, damping: 20 });
  const intensity = useSpring(0.8, { stiffness: 50, damping: 20 });
  const speedMult = useSpring(1.0, { stiffness: 50, damping: 20 });
  const scale = useSpring(1, { stiffness: 30, damping: 10 });

  useFrame((state, delta) => {
    // 1. Determine targets based on state
    let targetTransition = 0;
    let targetIntensity = 0.8;
    let targetSpeed = 0.4;
    let targetScale = 1.0 + Math.sin(state.clock.elapsedTime * 2) * 0.02; // Breathing animation

    if (voiceState === 'listening') {
      targetTransition = 1;
      targetIntensity = 1.4;
      targetSpeed = 2.0;
      targetScale = 1.05 + Math.sin(state.clock.elapsedTime * 4) * 0.04; // Faster breathing
    } else if (voiceState === 'executing') {
      targetTransition = 1;
      targetIntensity = 1.8;
      targetSpeed = 3.0;
      targetScale = 1.08 + Math.sin(state.clock.elapsedTime * 6) * 0.05; // Intense breathing
    } else if (voiceState === 'waking') {
      targetTransition = 0.5;
      targetIntensity = 1.2;
      targetSpeed = 1.5;
      targetScale = 1.03;
    }

    stateTransition.set(targetTransition);
    intensity.set(targetIntensity);
    speedMult.set(targetSpeed);
    scale.set(targetScale);

    // 2. Apply uniforms
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value += delta * speedMult.get();
      materialRef.current.uniforms.uStateTransition.value = stateTransition.get();
      materialRef.current.uniforms.uIntensity.value = intensity.get();
      
      materialRef.current.uniforms.uColorTop.value.lerp(new THREE.Color(themeColors.top), 0.05);
      materialRef.current.uniforms.uColorBottom.value.lerp(new THREE.Color(themeColors.bottom), 0.05);
    }

    // 3. Apply scale and rotation
    if (groupRef.current) {
      const s = scale.get();
      groupRef.current.scale.set(s, s, s);
    }
    
    if (innerSphereRef.current) {
      innerSphereRef.current.rotation.y += 0.002 * speedMult.get();
      innerSphereRef.current.rotation.z += 0.001 * speedMult.get();
    }
  });

  return (
    <group ref={groupRef}>
      {/* Inner Emissive Shader Layer */}
      <mesh ref={innerSphereRef}>
        <sphereGeometry args={[1, 64, 64]} />
        <shaderMaterial
          ref={materialRef}
          vertexShader={coreVertexShader}
          fragmentShader={coreFragmentShader}
          transparent={true}
          blending={THREE.NormalBlending}
          depthWrite={false}
          side={THREE.FrontSide}
          uniforms={{
            uTime: { value: 0 },
            uIntensity: { value: 0.8 },
            uStateTransition: { value: 0 },
            uColorTop: { value: new THREE.Color(themeColors.top) },
            uColorBottom: { value: new THREE.Color(themeColors.bottom) },
          }}
        />
      </mesh>
    </group>
  );
};
