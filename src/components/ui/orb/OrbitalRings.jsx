import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const OrbitalRings = ({ color = "#3a7bff" }) => {
  const ring1 = useRef();
  const ring2 = useRef();
  const ring3 = useRef();

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (ring1.current) {
      ring1.current.rotation.x = time * 0.1;
      ring1.current.rotation.y = time * 0.2;
    }
    if (ring2.current) {
      ring2.current.rotation.y = time * -0.15;
      ring2.current.rotation.z = time * 0.1;
    }
    if (ring3.current) {
      ring3.current.rotation.x = time * 0.05;
      ring3.current.rotation.z = time * -0.2;
    }
  });

  const materialArgs = {
    color: color,
    transparent: true,
    opacity: 0.3,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  };

  const createCircle = (radius) => {
    const points = [];
    for (let i = 0; i <= 64; i++) {
      const theta = (i / 64) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(theta) * radius, Math.sin(theta) * radius, 0));
    }
    const geom = new THREE.BufferGeometry().setFromPoints(points);
    return geom;
  };

  return (
    <group>
      {/* Outer slow ring */}
      <lineLoop ref={ring1} rotation={[Math.PI / 4, 0, 0]} geometry={createCircle(1.8)}>
        <lineBasicMaterial {...materialArgs} opacity={0.15} />
      </lineLoop>

      {/* Middle ring */}
      <lineLoop ref={ring2} rotation={[0, Math.PI / 3, 0]} geometry={createCircle(1.6)}>
        <lineBasicMaterial {...materialArgs} opacity={0.25} />
      </lineLoop>

      {/* Inner fast ring */}
      <lineLoop ref={ring3} rotation={[0, 0, Math.PI / 6]} geometry={createCircle(1.4)}>
        <lineBasicMaterial {...materialArgs} opacity={0.4} />
      </lineLoop>
    </group>
  );
};
