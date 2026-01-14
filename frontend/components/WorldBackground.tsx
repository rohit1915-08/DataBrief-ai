"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";

function FallingSnow() {
  const ref = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const pos = new Float32Array(1500 * 3);
    for (let i = 0; i < 1500; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 25;
      pos[i * 3 + 1] = Math.random() * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 12;
    }
    return pos;
  }, []);

  useFrame((state, delta) => {
    if (!ref.current) return;
    const positions = ref.current.geometry.attributes.position
      .array as Float32Array;

    for (let i = 0; i < 1500; i++) {
      positions[i * 3 + 1] -= delta * 2;
      positions[i * 3] += Math.sin(state.clock.elapsedTime + i) * 0.002;

      if (positions[i * 3 + 1] < -5) {
        positions[i * 3 + 1] = 15;
        positions[i * 3] = (Math.random() - 0.5) * 25;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 12;
      }
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#ffffff"
        size={0.05}
        opacity={0.8}
        depthWrite={false}
      />
    </Points>
  );
}

function SnowPile() {
  const ref = useRef<THREE.Points>(null);
  const count = 3000;

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 25;
      const z = (Math.random() - 0.5) * 12;
      const distanceFromCenter = Math.sqrt(x * x + z * z);
      const height = 2 * Math.exp(-distanceFromCenter * 0.15);

      pos[i * 3] = x;
      pos[i * 3 + 1] = -5 + Math.random() * height * 0.5;
      pos[i * 3 + 2] = z;
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    const visibleCount = Math.min(
      count,
      Math.floor(state.clock.elapsedTime * 90)
    );
    ref.current.geometry.setDrawRange(0, visibleCount);
  });

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#e0f2fe"
        size={0.06}
        opacity={0.6}
        depthWrite={false}
      />
    </Points>
  );
}

export default function WorldBackground({ isSnowing }: { isSnowing: boolean }) {
  return (
    <div className="fixed inset-0 -z-50 bg-slate-950 pointer-events-none">
      {isSnowing && (
        <Canvas
          camera={{ position: [0, 0, 6], fov: 60 }}
          key={isSnowing ? "active" : "inactive"}
          dpr={[1, 2]} // Optimizes for retina displays
          gl={{ antialias: false }} // Performance boost
        >
          <fog attach="fog" args={["#020617", 5, 20]} />
          <FallingSnow />
          <SnowPile />
        </Canvas>
      )}
    </div>
  );
}
