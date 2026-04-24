"use client";

import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { STLLoader } from "three-stdlib";
import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";

function SpinningBox() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (!ref.current) return;
    ref.current.rotation.x += dt * 0.6;
    ref.current.rotation.y += dt * 0.9;
  });
  return (
    <mesh ref={ref}>
      <boxGeometry args={[0.7, 0.7, 0.7]} />
      <meshStandardMaterial color="#c8a96e" wireframe />
    </mesh>
  );
}

function Model({ url, color }: { url: string; color: string }) {
  const geom = useLoader(STLLoader, url);

  // Center geometry + compute normals once after load
  useMemo(() => {
    geom.center();
    geom.computeVertexNormals();
  }, [geom]);

  const scale = useMemo(() => {
    geom.computeBoundingBox();
    const size = new THREE.Vector3();
    geom.boundingBox!.getSize(size);
    const max = Math.max(size.x, size.y, size.z);
    return max > 0 ? 2.2 / max : 1;
  }, [geom]);

  return (
    <mesh geometry={geom} scale={scale}>
      <meshStandardMaterial
        color={color}
        metalness={0.68}
        roughness={0.28}
      />
    </mesh>
  );
}

interface STLViewerProps {
  url: string;
  accentColor?: string;
}

export function STLViewer({ url, accentColor = "#c8a96e" }: STLViewerProps) {
  return (
    <Canvas
      camera={{ position: [0, 1.2, 4], fov: 46 }}
      style={{ width: "100%", height: "100%" }}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.55} />
      <directionalLight position={[5, 8, 5]} intensity={1.8} />
      <directionalLight position={[-4, 2, -4]} intensity={0.5} color={accentColor} />
      <pointLight position={[0, -4, 2]} intensity={0.3} color="#ffffff" />

      <Suspense fallback={<SpinningBox />}>
        <Model url={url} color={accentColor} />
      </Suspense>

      <OrbitControls
        autoRotate
        autoRotateSpeed={2.5}
        enableZoom={false}
        enablePan={false}
        minPolarAngle={Math.PI / 5}
        maxPolarAngle={(4 * Math.PI) / 5}
      />
    </Canvas>
  );
}
