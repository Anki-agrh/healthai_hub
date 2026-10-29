import React from 'react';
import { useGLTF } from '@react-three/drei';

export default function HumanModel({ onPartClick, pointerPos, gender = "Male", ...props }) {
  const modelPath = gender === "Female" ? '/Female_base.glb' : '/Male_base.glb';
  const { nodes, materials } = useGLTF(modelPath);

  // Safely get the first available mesh node if 'Group1' doesn't exist
  const meshNode = nodes?.Group1 || nodes?.[Object.keys(nodes || {}).find(k => nodes[k]?.geometry)];

  const handleInteraction = (e) => {
    e.stopPropagation();
    if (onPartClick) {
      const localPoint = e.object.worldToLocal(e.point.clone());
      onPartClick({
        x: localPoint.x,
        y: localPoint.y,
        z: localPoint.z
      });
    }
  };

  if (!meshNode) return null;

  // Get first available material
  const mat = materials?.['default'] || materials?.[Object.keys(materials || {})[0]];

  return (
    <group {...props} dispose={null}>
      <mesh
        geometry={meshNode.geometry}
        material={mat}
        onPointerDown={handleInteraction}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = 'auto')}
      />
      {pointerPos && (
        <mesh position={pointerPos}>
          <sphereGeometry args={[0.2, 32, 32]} />
          <meshStandardMaterial color="red" emissive="red" emissiveIntensity={6} toneMapped={false} />
        </mesh>
      )}
    </group>
  );
}

// Preload to avoid flicker
useGLTF.preload('/Male_base.glb');