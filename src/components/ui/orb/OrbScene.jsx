import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { CoreSphere } from './CoreSphere';
import { Html } from '@react-three/drei';

export const OrbScene = ({ voiceState, themeColors }) => {
  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 5 }}>
      <Canvas 
        camera={{ position: [0, 0, 3.5], fov: 45 }}
        gl={{ alpha: true, antialias: false }} // antialias false is better for postprocessing performance
        dpr={[1, 2]} // Support retina displays
      >
        <Suspense fallback={null}>
          <group>
            <CoreSphere voiceState={voiceState} themeColors={themeColors} />

            {/* Glowing HTML Text tracked precisely to 3D center but placed IN FRONT of the sphere */}
            <Html position={[0, 0, 1.2]} center zIndexRange={[100, 0]} pointerEvents="none">
              <div className="orb-core">
                <span className="orb-text">PIHU</span>
              </div>
            </Html>
          </group>

          <EffectComposer disableNormalPass>
            <Bloom 
              luminanceThreshold={0.5} 
              luminanceSmoothing={0.9} 
              intensity={1.0} 
              mipmapBlur
            />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  );
};
