"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { MeshTransmissionMaterial, Environment, Float } from "@react-three/drei";
import * as THREE from "three";

function IridescentGem() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.4;
      meshRef.current.rotation.x += delta * 0.15;
    }
  });

  // icosahedron = あの多面体に近い形
  return (
    <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.8}>
      <mesh ref={meshRef} scale={2.2}>
        <icosahedronGeometry args={[1, 0]} />
        <MeshTransmissionMaterial
          backside
          samples={8}
          thickness={0.5}
          chromaticAberration={0.8}
          anisotropy={0.5}
          distortion={0.3}
          distortionScale={0.3}
          temporalDistortion={0.1}
          iridescence={1}
          iridescenceIOR={1.5}
          iridescenceThicknessRange={[0, 1400]}
          color="#88ccff"
          attenuationColor="#4466ff"
          attenuationDistance={0.5}
        />
      </mesh>
    </Float>
  );
}

export default function Hero3D() {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.3} />
        <directionalLight position={[5, 5, 5]} intensity={1.5} color="#ffffff" />
        <directionalLight position={[-5, -3, -5]} intensity={0.8} color="#6644ff" />
        <pointLight position={[0, 4, 2]} intensity={2} color="#00ddff" />
        <pointLight position={[3, -3, 1]} intensity={1.5} color="#ff44aa" />
        <Environment preset="city" />
        <IridescentGem />
      </Canvas>
    </div>
  );
}
