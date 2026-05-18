import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

// --- GLSL Shaders ---

const snoiseGLSL = `
// Simplex 3D Noise 
// by Ian McEwan, Ashima Arts
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

float snoise(vec3 v){ 
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

// First corner
  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 = v - i + dot(i, C.xxx) ;

// Other corners
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );

  //  x0 = x0 - 0.0 + 0.0 * C 
  vec3 x1 = x0 - i1 + 1.0 * C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;

// Permutations
  i = mod(i, 289.0 ); 
  vec4 p = permute( permute( permute( 
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

// Gradients
// ( N*N points uniformly over a square, mapped onto an octahedron.)
  float n_ = 1.0/7.0; // N=7
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z *ns.z);  //  mod(p,N*N)

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );

  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);

//Normalise gradients
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

// Mix final noise value
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                dot(p2,x2), dot(p3,x3) ) );
}
`;

const vertexShader = `
uniform float uTime;
uniform float uWobble;
varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vNormal;

${snoiseGLSL}

void main() {
    vUv = uv;
    vPosition = position;
    vNormal = normal;
    
    // Perfectly smooth sphere geometry
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
uniform float uTime;
uniform vec3 uColorTop;
uniform vec3 uColorBottom;
uniform float uIntensity;

varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vNormal;

${snoiseGLSL}

void main() {
    // Slower, elegant time flow
    float t = uTime * 0.3;
    
    // Very low frequency noise for large, smooth, sweeping curves
    float n1 = snoise(vec3(vPosition.x * 0.6, vPosition.y * 0.6 - t, vPosition.z * 0.6 + t * 0.5));
    float n2 = snoise(vec3(vPosition.x * 0.8 + t * 0.4, vPosition.y * 0.8, vPosition.z * 0.8 - t));
    
    float combined = (n1 + n2);
    
    // Create 1 or 2 elegant contour lines (ribbons) from the noise field
    // smoothstep creates a thick, graceful wave instead of sharp messy bands
    float ribbon1 = smoothstep(0.1, 0.3, combined) - smoothstep(0.3, 0.6, combined);
    float ribbon2 = smoothstep(-0.4, -0.2, combined) - smoothstep(-0.2, 0.0, combined);
    
    float ribbons = ribbon1 + ribbon2 * 0.7;
    
    // Color gradient based on Y position
    float mixFactor = clamp((vPosition.y + 1.0) * 0.5, 0.0, 1.0);
    vec3 color = mix(uColorBottom, uColorTop, mixFactor);
    
    // Continuous glass-like rim light (softer)
    vec3 viewDirection = normalize(cameraPosition - vPosition);
    float rim = 1.0 - max(dot(viewDirection, normalize(vNormal)), 0.0);
    rim = smoothstep(0.5, 1.0, rim) * 0.4;
    
    // Base glow for the core of the sphere
    float coreGlow = 0.1;
    
    // Final alpha: ribbons are bright, rim is soft, core has a slight tint
    float finalAlpha = (ribbons * 0.8 + rim + coreGlow) * uIntensity;
    
    // Additive blending output - keep alpha somewhat low to prevent blowing out to pure white
    gl_FragColor = vec4(color, finalAlpha);
}
`;

// --- React Component ---

const Orb = ({ voiceState, theme }) => {
  const mountRef = useRef(null);
  const stateRef = useRef(voiceState);

  useEffect(() => {
    stateRef.current = voiceState;
  }, [voiceState]);

  useEffect(() => {
    // 1. Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    camera.position.z = 3.2;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(400, 400);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 0); 
    
    const currentMount = mountRef.current;
    if (currentMount) {
      currentMount.innerHTML = ''; // Prevent double-canvas from React StrictMode
      currentMount.appendChild(renderer.domElement);
    }

    // 2. Geometry & ShaderMaterial
    const geometry = new THREE.SphereGeometry(1.0, 64, 64);

    // Uniforms that we will update on every frame based on state
    const uniforms = {
        uTime: { value: 0.0 },
        uIntensity: { value: 0.8 },
        uColorTop: { value: new THREE.Color(0x0077ff) },    // Deep Blue
        uColorBottom: { value: new THREE.Color(0xaa00ff) }  // Deep Purple
    };

    const material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms,
        transparent: true,
        blending: THREE.AdditiveBlending, // Key for the glowing smoke overlap
        depthWrite: false,
        side: THREE.DoubleSide // Render both inside and outside ribbons
    });

    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    // 3. Animation Loop
    let animationFrameId;
    let clock = new THREE.Clock();
    let internalTime = 0;

    const render = () => {
        animationFrameId = requestAnimationFrame(render);
        const delta = clock.getDelta();
        
        const currentState = stateRef.current;
        
        // Dynamic properties based on PIHU voice state
        let speedMultiplier = 1.0;
        let targetIntensity = 0.8;

        // Theme colors mapping
        const themeColors = {
            nebula: { top: 0x0055ff, bottom: 0x7700ff }, // Blue / Purple
            ocean: { top: 0x00ffcc, bottom: 0x0055ff }, // Teal / Deep Blue
            sunset: { top: 0xff4400, bottom: 0xaa0055 }, // Orange / Dark Pink
            matrix: { top: 0x00ff00, bottom: 0x005500 }, // Bright Green / Dark Green
        };
        const currentThemeColors = themeColors[theme] || themeColors.nebula;

        if (currentState === 'waking') {
            speedMultiplier = 1.5;
            targetIntensity = 1.0;
            uniforms.uColorTop.value.lerp(new THREE.Color(0x00aaff), 0.02); // Brighter generic blue
            uniforms.uColorBottom.value.lerp(new THREE.Color(0xcc00ff), 0.02);
        } else if (currentState === 'listening') {
            speedMultiplier = 2.0;
            targetIntensity = 1.2;
            uniforms.uColorTop.value.lerp(new THREE.Color(0x00e5ff), 0.05); // Cyan
            uniforms.uColorBottom.value.lerp(new THREE.Color(0xd500f9), 0.05);
        } else if (currentState === 'executing') {
            speedMultiplier = 3.0;
            targetIntensity = 1.4;
            // Shift to processing colors smoothly
            uniforms.uColorTop.value.lerp(new THREE.Color(0x00ffcc), 0.05); // Mint Green
            uniforms.uColorBottom.value.lerp(new THREE.Color(0x0088ff), 0.05); // Deep Blue
        } else {
            // Idle - use Theme Colors
            speedMultiplier = 0.4; // Very slow, calm flow
            targetIntensity = 0.8;
            uniforms.uColorTop.value.lerp(new THREE.Color(currentThemeColors.top), 0.02);
            uniforms.uColorBottom.value.lerp(new THREE.Color(currentThemeColors.bottom), 0.02);
        }

        // Smoothly interpolate uniform values
        uniforms.uIntensity.value += (targetIntensity - uniforms.uIntensity.value) * 0.05;

        // Advance custom time variable for the shader
        internalTime += delta * speedMultiplier;
        uniforms.uTime.value = internalTime;

        // Base rotation to show it's a 3D volume
        sphere.rotation.y += 0.002 * speedMultiplier;
        sphere.rotation.z += 0.001 * speedMultiplier;

        renderer.render(scene, camera);
    };

    render();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      if (currentMount && currentMount.contains(renderer.domElement)) {
          currentMount.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  const containerClass = `orb-container ${voiceState !== 'idle' ? voiceState : ''}`;

  return (
    <div className={containerClass} id="orbContainer">
        {/* 3D Plasma Canvas */}
        <div ref={mountRef} style={{ position: 'absolute', top: '-25px', left: '-25px', width: '400px', height: '400px', pointerEvents: 'none' }}></div>
        
        {/* Central PIHU Text */}
        <div className="orb-core" id="orbCore">
             <span className="orb-text">PIHU</span>
        </div>
    </div>
  );
};

export default Orb;
