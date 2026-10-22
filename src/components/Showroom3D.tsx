import React, { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import type * as THREE from 'three';
import { Sparkles, Eye, PauseCircle, PlayCircle } from 'lucide-react';

interface TurntableSculptureProps {
  animate: boolean;
  accentColor: string;
}

const LuxuryAutomotiveSculpture: React.FC<TurntableSculptureProps> = ({ animate, accentColor }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (animate && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.35;
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.35, 0]}>
      {/* Studio Podium Base */}
      <mesh position={[0, -0.32, 0]} receiveShadow>
        <cylinderGeometry args={[2.55, 2.75, 0.16, 64]} />
        <meshStandardMaterial color="#0D0F14" metalness={0.85} roughness={0.2} />
      </mesh>

      {/* Champagne Gold Rim Ring */}
      <mesh position={[0, -0.23, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.38, 2.48, 64]} />
        <meshBasicMaterial color={accentColor} />
      </mesh>

      {/* Procedural Luxury GT Chassis Lower Body */}
      <mesh position={[0, 0.12, 0]}>
        <boxGeometry args={[3.3, 0.42, 1.48]} />
        <meshStandardMaterial color="#181B24" metalness={0.9} roughness={0.18} />
      </mesh>

      {/* Aerodynamic Fastback Cabin */}
      <mesh position={[-0.15, 0.46, 0]}>
        <boxGeometry args={[1.85, 0.36, 1.24]} />
        <meshStandardMaterial color="#0B0D13" metalness={0.95} roughness={0.08} />
      </mesh>

      {/* Champagne-Gold Side Signature Trim */}
      <mesh position={[0, 0.14, 0.75]}>
        <boxGeometry args={[2.8, 0.03, 0.02]} />
        <meshBasicMaterial color={accentColor} />
      </mesh>
      <mesh position={[0, 0.14, -0.75]}>
        <boxGeometry args={[2.8, 0.03, 0.02]} />
        <meshBasicMaterial color={accentColor} />
      </mesh>

      {/* LED DRL Front Strip */}
      <mesh position={[1.66, 0.18, 0]}>
        <boxGeometry args={[0.03, 0.05, 1.32]} />
        <meshBasicMaterial color="#FFFBEB" />
      </mesh>

      {/* LED Rear Taillight Bar */}
      <mesh position={[-1.66, 0.22, 0]}>
        <boxGeometry args={[0.03, 0.04, 1.32]} />
        <meshBasicMaterial color="#EF4444" />
      </mesh>

      {/* 4 Alloy Wheels */}
      {[
        [1.05, -0.05, 0.76],
        [-1.05, -0.05, 0.76],
        [1.05, -0.05, -0.76],
        [-1.05, -0.05, -0.76],
      ].map(([x, y, z], idx) => (
        <mesh key={idx} position={[x, y, z]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.31, 0.31, 0.22, 28]} />
          <meshStandardMaterial color="#0A0B0E" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
};

class WebGLErrorBoundary extends React.Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { fallback: React.ReactNode; children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

export const Showroom3D: React.FC<{
  primaryVehicleImage?: string;
  primaryVehicleName?: string;
  accentColor?: string;
}> = ({
  primaryVehicleImage = '/vehicles/mercedes-classe-s-500-amg-2025.svg',
  primaryVehicleName = 'Mercedes-Benz Classe S 500 L AMG Executive',
  accentColor = '#C9A86A',
}) => {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [viewMode, setViewMode] = useState<'studio_svg' | '3d_podium'>('studio_svg');
  const [webglSupported, setWebglSupported] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReducedMotion(mq.matches);
      const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
      mq.addEventListener?.('change', handler);
      return () => mq.removeEventListener?.('change', handler);
    }
  }, []);

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      setWebglSupported(Boolean(gl));
    } catch {
      setWebglSupported(false);
    }
  }, []);

  const fallbackView = (
    <div className="relative overflow-hidden rounded-2xl border border-obsidian-border bg-obsidian-card">
      <img
        src={primaryVehicleImage}
        alt={primaryVehicleName}
        className="h-64 w-full object-cover sm:h-80"
      />
    </div>
  );

  return (
    <div className="relative overflow-hidden rounded-2xl border border-champagne/30 bg-gradient-to-b from-obsidian-light to-obsidian p-4 shadow-glass">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-champagne/40 bg-champagne/10 px-3 py-1 font-mono text-[11px] font-semibold text-champagne">
            <Sparkles className="h-3 w-3" />
            SHOWROOM INTERACTIF • PLACEHOLDER MÉDIA ÉDITABLE
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode(viewMode === 'studio_svg' ? '3d_podium' : 'studio_svg')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-obsidian-border bg-obsidian px-2.5 py-1 text-xs font-medium text-ivory hover:border-champagne/60"
          >
            <Eye className="h-3.5 w-3.5 text-champagne" />
            {viewMode === 'studio_svg' ? 'Activer Podium 3D (R3F)' : 'Vue Studio Haute Définition'}
          </button>

          {viewMode === '3d_podium' && (
            <button
              type="button"
              onClick={() => setReducedMotion(!reducedMotion)}
              className="inline-flex items-center gap-1 rounded-lg border border-obsidian-border bg-obsidian px-2.5 py-1 text-xs text-ivory-muted hover:text-ivory"
            >
              {reducedMotion ? (
                <>
                  <PlayCircle className="h-3.5 w-3.5 text-champagne" /> Rotation
                </>
              ) : (
                <>
                  <PauseCircle className="h-3.5 w-3.5 text-champagne" /> Pause
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {viewMode === '3d_podium' && webglSupported ? (
        <WebGLErrorBoundary fallback={fallbackView}>
          <div className="relative h-64 w-full overflow-hidden rounded-xl border border-obsidian-border bg-obsidian sm:h-72">
            <Canvas camera={{ position: [3.6, 1.6, 3.6], fov: 42 }}>
              <ambientLight intensity={0.7} />
              <directionalLight position={[5, 8, 5]} intensity={1.6} color="#FFF8E7" />
              <pointLight position={[-4, 3, -3]} intensity={1.1} color={accentColor} />
              <LuxuryAutomotiveSculpture animate={!reducedMotion} accentColor={accentColor} />
            </Canvas>
            <div className="pointer-events-none absolute bottom-3 left-3 right-3 flex items-center justify-between rounded-lg bg-obsidian/80 px-3 py-1.5 text-[11px] text-ivory-muted backdrop-blur">
              <span>Sculpture Aérodynamique Concept 3D (React Three Fiber)</span>
              <span className="font-mono text-champagne">
                {reducedMotion ? 'Mouvement réduit actif' : 'Rotation 360° Studio'}
              </span>
            </div>
          </div>
        </WebGLErrorBoundary>
      ) : (
        <div className="relative overflow-hidden rounded-xl border border-obsidian-border bg-obsidian">
          <img
            src={primaryVehicleImage}
            alt={primaryVehicleName}
            className="h-64 w-full object-cover sm:h-72"
          />
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-obsidian-border bg-obsidian-card/90 px-4 py-2.5 text-xs">
            <span className="font-medium text-ivory">{primaryVehicleName}</span>
            <span className="font-mono text-[11px] text-champagne">
              Visuel de démonstration — Remplaçable dans l’Admin CMS
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
