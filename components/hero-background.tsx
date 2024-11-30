"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import { Mesh, Vector3 } from "three";
import { Environment, Float, MeshDistortMaterial, Sphere } from "@react-three/drei";

function AnimatedSphere({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.2;
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.1;
      meshRef.current.position.y = Math.sin(state.clock.getElapsedTime() * 0.5) * 0.2;
    }
  });

  return (
    <Float
      speed={2} 
      rotationIntensity={1} 
      floatIntensity={2}
      position={position}
    >
      <mesh
        ref={meshRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        scale={hovered ? 1.2 : 1}
      >
        <sphereGeometry args={[1, 64, 64]} />
        <MeshDistortMaterial
          color="#ff6b6b"
          attach="material"
          distort={0.4}
          speed={2}
          roughness={0.2}
          metalness={0.8}
          opacity={0.1}
          transparent
        />
      </mesh>
    </Float>
  );
}

export function HeroBackground() {
  return (
    <div className="absolute inset-0 -z-10">
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <Environment preset="city" />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <AnimatedSphere position={[-2, 0, 0]} />
        <AnimatedSphere position={[2, -1, -2]} />
        <AnimatedSphere position={[0, 2, -1]} />
      </Canvas>
    </div>
  );
} 
