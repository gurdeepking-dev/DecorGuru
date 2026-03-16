import React, { useState, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, PerspectiveCamera, ContactShadows, Environment } from '@react-three/drei';
import * as THREE from 'three';

interface FurnitureItem {
  id: string;
  type: 'sofa' | 'table' | 'chair' | 'bed';
  position: [number, number, number];
  rotation: number;
  color: string;
}

const Box = ({ position, rotation, color, size = [1, 1, 1] }: any) => {
  return (
    <mesh position={position} rotation={[0, rotation, 0]} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
};

const Room = ({ width = 10, height = 10 }: any) => {
  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color="#f0f0f0" />
      </mesh>
      {/* Walls */}
      <mesh position={[0, 1.5, -height / 2]} castShadow receiveShadow>
        <boxGeometry args={[width, 3, 0.1]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[-width / 2, 1.5, 0]} rotation={[0, Math.PI / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[height, 3, 0.1]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
    </group>
  );
};

export const ThreeDPlanner = ({ furniture = [] }: { furniture?: FurnitureItem[] }) => {
  return (
    <div className="w-full h-full bg-slate-100 rounded-2xl overflow-hidden border border-slate-200">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[10, 10, 10]} />
        <OrbitControls makeDefault />
        <Environment preset="city" />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} castShadow />
        
        <Room />
        <Grid infiniteGrid fadeDistance={50} sectionSize={1} cellSize={0.5} />
        
        {furniture.map((item) => (
          <Box 
            key={item.id} 
            position={item.position} 
            rotation={item.rotation} 
            color={item.color}
            size={item.type === 'sofa' ? [2, 0.8, 1] : [1, 1, 1]}
          />
        ))}
        
        <ContactShadows position={[0, 0, 0]} opacity={0.4} scale={20} blur={2} far={4.5} />
      </Canvas>
    </div>
  );
};
