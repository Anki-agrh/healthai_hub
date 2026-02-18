import React from 'react';
import { useGLTF } from '@react-three/drei';

export default function HumanModel({ onPartClick, pointerPos, ...props }) {
  const { nodes, materials } = useGLTF('/Male base.glb');
  
  const handleInteraction = (e) => {
    e.stopPropagation(); 
    if (onPartClick) {
      // ✅ Stable local coordinates
      const localPoint = e.object.worldToLocal(e.point.clone());
      
      // Verification log matches what you see in console
      console.log(`Verified X: ${localPoint.x.toFixed(2)}, Y: ${localPoint.y.toFixed(2)}`);

      onPartClick({
        x: localPoint.x,
        y: localPoint.y,
        z: localPoint.z
      });
    }
  };

  return (
    <group {...props} dispose={null}>
      <mesh
        geometry={nodes.Group1.geometry}
        material={materials['default']}
        onPointerDown={handleInteraction}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = 'auto')}
      />
      {pointerPos && (
        <mesh position={pointerPos}>
          <sphereGeometry args={[0.2, 32, 32]} /> {/* Increased sphere size for large scale */}
          <meshStandardMaterial color="red" emissive="red" emissiveIntensity={6} toneMapped={false} />
        </mesh>
      )}
    </group>
  );
}