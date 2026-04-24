"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef, useMemo, useEffect } from "react";
import * as THREE from "three";
import type { SiteTheme } from "@/providers/theme-provider";

const VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  // Bypass camera — map directly to clip space
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const FRAG = /* glsl */ `
varying vec2 vUv;
uniform float uTime;
uniform vec2  uMouse;
uniform vec3  uC0;
uniform vec3  uC1;
uniform vec3  uC2;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i),               hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p  = p * 2.0 + vec2(3.1, 1.7);
    a *= 0.5;
  }
  return v;
}

void main() {
  float t  = uTime * 0.04;
  vec2  uv = vUv;

  // Double-layered fbm for organic movement
  vec2  q = vec2(fbm(uv + t), fbm(uv + vec2(1.0) + t * 0.8));
  float n = fbm(uv + q * 0.6 + t * 0.3);

  // Cursor glow — soft exponential falloff
  vec2  mUv = uMouse * 0.5 + 0.5;
  float d    = distance(uv, mUv);
  float glow = exp(-d * 5.5) * 0.22;

  vec3 col = mix(uC0, uC1, n * 0.4);
  col = mix(col, uC2, glow);

  gl_FragColor = vec4(col, 1.0);
}
`;

const COLORS: Record<SiteTheme, { c0: string; c1: string; c2: string }> = {
  dark:  { c0: "#07070a", c1: "#150c01", c2: "#c8a96e" },
  cream: { c0: "#f5efe2", c1: "#e8dbc8", c2: "#c8a96e" },
};

function BackgroundPlane({ theme }: { theme: SiteTheme }) {
  const targetMouse = useRef(new THREE.Vector2(0, 0));
  const tc0 = useRef(new THREE.Color(COLORS[theme].c0));
  const tc1 = useRef(new THREE.Color(COLORS[theme].c1));
  const tc2 = useRef(new THREE.Color(COLORS[theme].c2));

  const uniforms = useMemo(() => ({
    uTime:  { value: 0 },
    uMouse: { value: new THREE.Vector2(0, 0) },
    uC0:    { value: new THREE.Color(COLORS[theme].c0) },
    uC1:    { value: new THREE.Color(COLORS[theme].c1) },
    uC2:    { value: new THREE.Color(COLORS[theme].c2) },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), []);

  useEffect(() => {
    tc0.current.set(COLORS[theme].c0);
    tc1.current.set(COLORS[theme].c1);
    tc2.current.set(COLORS[theme].c2);
  }, [theme]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      targetMouse.current.set(
        (e.clientX / window.innerWidth) * 2 - 1,
        -(e.clientY / window.innerHeight) * 2 + 1,
      );
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  useFrame((_, dt) => {
    uniforms.uTime.value += dt;
    uniforms.uMouse.value.lerp(targetMouse.current, 0.07);
    uniforms.uC0.value.lerp(tc0.current, dt * 2.0);
    uniforms.uC1.value.lerp(tc1.current, dt * 2.0);
    uniforms.uC2.value.lerp(tc2.current, dt * 2.0);
  });

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        vertexShader={VERT}
        fragmentShader={FRAG}
        uniforms={uniforms}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
}

export function WebGLBackground({ theme }: { theme: SiteTheme }) {
  return (
    <Canvas
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
      }}
      gl={{ antialias: false, alpha: false, powerPreference: "low-power" }}
      frameloop="always"
      camera={{ position: [0, 0, 1] }}
    >
      <BackgroundPlane theme={theme} />
    </Canvas>
  );
}
