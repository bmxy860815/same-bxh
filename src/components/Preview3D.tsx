import React, { useRef, useMemo, Suspense, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, ContactShadows, useTexture, Html } from '@react-three/drei';
import * as THREE from 'three';
import { BoxElement } from '../types';
import { BoxType, FaceType } from '../types/box';
import { cn } from '../lib/utils';
import { ErrorBoundary } from './ErrorBoundary';
import { Loader2 } from 'lucide-react';

import { ParsedGLB } from '../lib/glbParser';
import { TextureSizeConfig } from '../lib/modelPanel';

interface Preview3DProps {
  elements: BoxElement[];
  isMini?: boolean;
  unfoldProgress?: number;
  canvasColor?: string;
  canvasTexture?: string | null;
  boxType: BoxType;
  glbData?: ParsedGLB | null;
  designCanvas?: HTMLCanvasElement | null;
  metalness?: number;
  roughness?: number;
  textureSizeConfig?: TextureSizeConfig;
}

function Face({ 
  type, 
  width, 
  height, 
  elements, 
  faceBounds, 
  children, 
  canvasColor = "#D2B48C",
  canvasTexture = null,
  position = [0, 0, 0], 
  rotation = [0, 0, 0] 
}: { 
  type: string, 
  width: number, 
  height: number, 
  elements: BoxElement[], 
  faceBounds: { x: number, y: number, w: number, h: number },
  children?: React.ReactNode,
  canvasColor?: string,
  canvasTexture?: string | null,
  position?: [number, number, number],
  rotation?: [number, number, number]
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  // Use a tiny transparent base64 as fallback to avoid loading errors when no texture is selected
  const fallbackTexture = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
  const texture = useTexture(canvasTexture || fallbackTexture);
  
  if (canvasTexture && texture) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(width / 100, height / 100);
  }
  
  // Create 4 clipping planes for this face in local space
  // We will update them to world space in useFrame
  const clippingPlanes = useMemo(() => [
    new THREE.Plane(),
    new THREE.Plane(),
    new THREE.Plane(),
    new THREE.Plane()
  ], []);

  useFrame(() => {
    if (!meshRef.current) return;
    
    const worldMatrix = meshRef.current.matrixWorld;
    
    // Define planes in local space: x=±w/2, y=±h/2
    const localPlanes = [
      { n: new THREE.Vector3(-1, 0, 0), d: width / 2 + 0.01 },  // Right boundary
      { n: new THREE.Vector3(1, 0, 0), d: width / 2 + 0.01 },   // Left boundary
      { n: new THREE.Vector3(0, -1, 0), d: height / 2 + 0.01 }, // Top boundary
      { n: new THREE.Vector3(0, 1, 0), d: height / 2 + 0.01 }   // Bottom boundary
    ];

    localPlanes.forEach((p, i) => {
      // Transform local plane to world space
      clippingPlanes[i].normal.copy(p.n).applyMatrix4(new THREE.Matrix4().extractRotation(worldMatrix));
      const pointOnPlane = new THREE.Vector3().copy(p.n).multiplyScalar(-p.d).applyMatrix4(worldMatrix);
      clippingPlanes[i].constant = -clippingPlanes[i].normal.dot(pointOnPlane);
    });
  });

  return (
    <group position={position} rotation={rotation}>
      <mesh ref={meshRef} castShadow receiveShadow>
        <planeGeometry args={[width + 0.01, height + 0.01]} />
        <meshStandardMaterial 
          color={canvasTexture ? '#FFFFFF' : canvasColor} 
          map={canvasTexture ? texture : null}
          roughness={0.8} 
          metalness={0.1} 
          side={THREE.DoubleSide} 
        />
      </mesh>
      {/* Render elements on this face */}
      {elements.map((el, index) => (
        <ElementPart 
          key={`${el.id}-${type}`} 
          element={el} 
          index={index}
          faceBounds={faceBounds} 
          faceType={type} 
          faceSize={{ w: width, h: height }}
          clippingPlanes={clippingPlanes}
        />
      ))}
      {children}
    </group>
  );
}

function ElementPart({ 
  element, 
  index,
  faceBounds, 
  faceType,
  faceSize,
  clippingPlanes
}: { 
  element: BoxElement, 
  index: number,
  faceBounds: { x: number, y: number, w: number, h: number },
  faceType: string,
  faceSize: { w: number, h: number },
  clippingPlanes: THREE.Plane[]
}) {
  const fallbackTexture = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
  const imageTexture = useTexture(element.type === 'image' ? (element.src || fallbackTexture) : fallbackTexture);
  const [textTexture, setTextTexture] = React.useState<THREE.CanvasTexture | null>(null);

  React.useEffect(() => {
    if (element.type !== 'text') {
      setTextTexture(null);
      return;
    }
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Higher resolution for text
    const scale = 4;
    canvas.width = element.width * scale;
    canvas.height = element.height * scale;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.scale(scale, scale);
    ctx.fillStyle = element.fill || '#000000';
    ctx.font = `bold ${element.fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(element.text || '', element.width / 2, element.height / 2);
    
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    
    setTextTexture(tex);

    return () => {
      tex.dispose();
    };
  }, [element.text, element.fontSize, element.fill, element.width, element.height, element.type]);

  const texture = element.type === 'image' ? imageTexture : textTexture;

  // Convert 2D coordinates to 3D relative coordinates
  // Use faceBounds.w/h and faceSize.w/h for accurate mapping on all faces
  const relX = ((element.x - (faceBounds.x + faceBounds.w / 2)) / faceBounds.w) * faceSize.w;
  const relY = ((element.y - (faceBounds.y + faceBounds.h / 2)) / faceBounds.h) * faceSize.h;

  const width3D = (element.width / faceBounds.w) * faceSize.w;
  const height3D = (element.height / faceBounds.h) * faceSize.h;

  // Check if element even potentially overlaps this face (bounding box check)
  const elX1 = element.x - element.width / 2;
  const elY1 = element.y - element.height / 2;
  const elX2 = element.x + element.width / 2;
  const elY2 = element.y + element.height / 2;
  
  const fX1 = faceBounds.x;
  const fY1 = faceBounds.y;
  const fX2 = faceBounds.x + faceBounds.w;
  const fY2 = faceBounds.y + faceBounds.h;

  // Simple AABB check to skip rendering if completely outside
  // (Note: this doesn't account for rotation perfectly but is a good optimization)
  const padding = Math.max(element.width, element.height);
  if (elX2 < fX1 - padding || elX1 > fX2 + padding || elY2 < fY1 - padding || elY1 > fY2 + padding) {
    return null;
  }

  // Add a Z-offset based on index to prevent Z-fighting and respect layering
  // Using a slightly larger offset and explicit renderOrder
  const isInside = element.side === 'inside';
  const zOffset = (isInside ? -0.01 : 0.01) + (index * 0.001);

  return (
    <mesh 
      position={[relX, -relY, zOffset]} 
      rotation={[0, isInside ? Math.PI : 0, -THREE.MathUtils.degToRad(element.rotation)]}
      scale={[element.scaleX || 1, element.scaleY || 1, 1]}
      renderOrder={index + 10}
    >
      <planeGeometry args={[width3D, height3D]} />
      <meshBasicMaterial 
        map={texture} 
        transparent 
        opacity={element.opacity} 
        clippingPlanes={clippingPlanes}
        side={THREE.FrontSide}
        polygonOffset
        polygonOffsetFactor={-1 - index}
        depthWrite={false}
      />
    </mesh>
  );
}function BoxModel({ elements, progress = 0, canvasColor, canvasTexture, boxType }: { elements: BoxElement[], progress?: number, canvasColor?: string, canvasTexture?: string | null, boxType: BoxType }) {
  const { w: BOX_W, h: BOX_H, d: BOX_D } = boxType.box3D;
  const { faces } = boxType.dieLine;

  const getFace = (type: FaceType) => faces.find(f => f.type === type)!;

  const front = getFace('front');
  const left = getFace('left');
  const right = getFace('right');
  const back = getFace('back');
  const top = getFace('top');
  const bottom = getFace('bottom');

  // Folding angle (0 to PI/2)
  const angle = (1 - progress) * Math.PI / 2;

  return (
    <group position={[0, 0, (BOX_D / 2) * (1 - progress)]}>
      {/* Front Face - Root */}
      <Face 
        type="front" 
        width={BOX_W} 
        height={BOX_H} 
        elements={elements} 
        faceBounds={{ x: front.canvasX - front.canvasW/2, y: front.canvasY - front.canvasH/2, w: front.canvasW, h: front.canvasH }}
        canvasColor={canvasColor}
        canvasTexture={canvasTexture}
      >
        {/* Left Side */}
        <group position={[-BOX_W / 2, 0, 0]} rotation={[0, -angle, 0]}>
          <Face 
            type="left" 
            width={BOX_D} 
            height={BOX_H} 
            elements={elements} 
            faceBounds={{ x: left.canvasX - left.canvasW/2, y: left.canvasY - left.canvasH/2, w: left.canvasW, h: left.canvasH }}
            position={[-BOX_D / 2, 0, 0]}
            canvasColor={canvasColor}
            canvasTexture={canvasTexture}
          />
        </group>

        {/* Right Side */}
        <group position={[BOX_W / 2, 0, 0]} rotation={[0, angle, 0]}>
          <Face 
            type="right" 
            width={BOX_D} 
            height={BOX_H} 
            elements={elements} 
            faceBounds={{ x: right.canvasX - right.canvasW/2, y: right.canvasY - right.canvasH/2, w: right.canvasW, h: right.canvasH }}
            position={[BOX_D / 2, 0, 0]}
            canvasColor={canvasColor}
            canvasTexture={canvasTexture}
          >
            {/* Back Face (attached to Right) */}
            <group position={[BOX_D / 2, 0, 0]} rotation={[0, angle, 0]}>
              <Face 
                type="back" 
                width={BOX_W} 
                height={BOX_H} 
                elements={elements} 
                faceBounds={{ x: back.canvasX - back.canvasW/2, y: back.canvasY - back.canvasH/2, w: back.canvasW, h: back.canvasH }}
                position={[BOX_W / 2, 0, 0]}
                canvasColor={canvasColor}
                canvasTexture={canvasTexture}
              />
            </group>
          </Face>
        </group>

        {/* Top Flap */}
        <group position={[0, BOX_H / 2, 0]} rotation={[-angle, 0, 0]}>
          <Face 
            type="top" 
            width={BOX_W} 
            height={BOX_D} 
            elements={elements} 
            faceBounds={{ x: top.canvasX - top.canvasW/2, y: top.canvasY - top.canvasH/2, w: top.canvasW, h: top.canvasH }}
            position={[0, BOX_D / 2, 0]}
            canvasColor={canvasColor}
            canvasTexture={canvasTexture}
          />
        </group>

        {/* Bottom Flap */}
        <group position={[0, -BOX_H / 2, 0]} rotation={[angle, 0, 0]}>
          <Face 
            type="bottom" 
            width={BOX_W} 
            height={BOX_D} 
            elements={elements} 
            faceBounds={{ x: bottom.canvasX - bottom.canvasW/2, y: bottom.canvasY - bottom.canvasH/2, w: bottom.canvasW, h: bottom.canvasH }}
            position={[0, -BOX_D / 2, 0]}
            canvasColor={canvasColor}
            canvasTexture={canvasTexture}
          />
        </group>
      </Face>
    </group>
  );
}

function GLBModelViewer({ glbData, designCanvas, canvasColor, metalness = 0.5, roughness = 0.5, textureSizeConfig, elements }: { glbData: ParsedGLB, designCanvas?: HTMLCanvasElement | null, canvasColor?: string, metalness?: number, roughness?: number, textureSizeConfig?: TextureSizeConfig, elements?: BoxElement[] }) {
  const clonedScene = useMemo(() => {
    if (!glbData?.gltf?.scene) return null;
    return glbData.gltf.scene.clone();
  }, [glbData]);

  const canvasTexture = useMemo(() => {
    if (!designCanvas) return null;
    const tex = new THREE.CanvasTexture(designCanvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.flipY = false;
    return tex;
  }, [designCanvas]);
  
  // Track if the canvas has actually been modified by the user
  const hasCanvasModifications = useMemo(() => {
    return canvasColor !== '#FFFFFF' || canvasTexture !== null || glbData?.uvData;
  }, [canvasColor, canvasTexture, glbData]);

  const { glbCanvasWidth, glbCanvasHeight } = useMemo(() => {
    const uvWidth = glbData?.uvData?.width || 1;
    const uvHeight = glbData?.uvData?.height || 1;
    let width = 1600;
    let height = 1600;
    
    if (textureSizeConfig) {
      const unitToPx: Record<string, number> = { px: 1, mm: 300 / 25.4, cm: 300 / 2.54, in: 300 };
      const factor = unitToPx[textureSizeConfig.unit] || 1;
      width = Math.max(256, Math.min(8192, Math.round(textureSizeConfig.width * factor)));
      height = Math.max(256, Math.min(8192, Math.round(textureSizeConfig.height * factor)));
    } else {
      const maxSide = 1600;
      const minSide = 800;
      if (uvWidth >= uvHeight) {
        width = maxSide;
        height = Math.max(minSide, Math.round(maxSide * (uvHeight / uvWidth)));
      } else {
        height = maxSide;
        width = Math.max(minSide, Math.round(maxSide * (uvWidth / uvHeight)));
      }
    }
    return { glbCanvasWidth: width, glbCanvasHeight: height };
  }, [glbData, textureSizeConfig]);

  useEffect(() => {
    if (canvasTexture && glbData?.uvData) {
      const uvWidth = glbData.uvData.width || 1;
      const uvHeight = glbData.uvData.height || 1;
      const uvMinX = glbData.uvData.bounds.minX || 0;
      const uvMinY = glbData.uvData.bounds.minY || 0;
      
      const contourPadding = 60;
      const usableW = Math.max(1, glbCanvasWidth - contourPadding * 2);
      const usableH = Math.max(1, glbCanvasHeight - contourPadding * 2);
      const contourScaleX = usableW / Math.max(uvWidth, 1e-6);
      const contourScaleY = usableH / Math.max(uvHeight, 1e-6);
      
      const repeatX = contourScaleX / glbCanvasWidth;
      const repeatY = contourScaleY / glbCanvasHeight;
      const offsetX = (contourPadding - uvMinX * contourScaleX) / glbCanvasWidth;
      const offsetY = (contourPadding - uvMinY * contourScaleY) / glbCanvasHeight;
      
      canvasTexture.repeat.set(repeatX, repeatY);
      canvasTexture.offset.set(offsetX, offsetY);
      canvasTexture.needsUpdate = true;
    } else if (canvasTexture) {
      canvasTexture.needsUpdate = true;
    }
  }, [canvasTexture, glbData, glbCanvasWidth, glbCanvasHeight]);

  useEffect(() => {
    if (!clonedScene) return;
    
    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.name === glbData.targetMesh?.name) {
          const originalMaterial = mesh.material as THREE.MeshStandardMaterial;
          const material = originalMaterial.clone();
          
          const hasDesignElements = elements && elements.length > 0;
          const hasCustomBackgroundColor = canvasColor && canvasColor !== 'transparent' && canvasColor !== '#FFFFFF';
          
          if (canvasTexture && (hasDesignElements || hasCustomBackgroundColor)) {
            // Only override the material map with our canvas if the user has actually added design elements
            // or has changed the background color to something non-transparent/non-white
            material.map = canvasTexture;
          }
          if (canvasColor && canvasColor !== 'transparent') {
            // When using a map, setting the color to white prevents the map from being multiplied by the background color.
            // If the user wants the background color, it's already rendered into the CanvasTexture itself by Konva.
            material.color.set('#ffffff');
          } else if (canvasColor === 'transparent' && originalMaterial.color) {
            // Restore the original material color if transparent is selected
            material.color.copy(originalMaterial.color);
          }
          material.roughness = roughness;
          material.metalness = metalness;
          material.needsUpdate = true;
          mesh.material = material;
        }
      }
    });
  }, [clonedScene, glbData, canvasTexture, canvasColor, metalness, roughness]);

  // Adjust model position/scale to fit the view
  useEffect(() => {
    if (!clonedScene) return;
    
    const box = new THREE.Box3().setFromObject(clonedScene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    
    // Reset position to origin
    clonedScene.position.x = -center.x;
    clonedScene.position.y = -center.y;
    clonedScene.position.z = -center.z;
    
    // Scale to a reasonable size
    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 0) {
      const scale = 5 / maxDim;
      clonedScene.scale.set(scale, scale, scale);
    }
  }, [clonedScene]);

  if (!clonedScene) return null;

  return (
    <group>
      <primitive object={clonedScene} />
    </group>
  );
}

export function Preview3D({ elements, isMini = false, unfoldProgress = 0, canvasColor, canvasTexture, boxType, glbData, designCanvas, metalness = 0.5, roughness = 0.5, textureSizeConfig }: Preview3DProps) {
  return (
    <div className={cn(
      "bg-gray-200 overflow-hidden",
      isMini ? "w-full h-full rounded-lg" : "w-full h-full"
    )}>
      <Canvas shadows={{ type: THREE.PCFShadowMap }} gl={{ antialias: true, localClippingEnabled: true }}>
        <PerspectiveCamera makeDefault position={[4, 3, 6]} fov={40} />
        <OrbitControls 
          makeDefault 
          autoRotate={!isMini && unfoldProgress === 0} 
          autoRotateSpeed={0.5}
          enableDamping
          dampingFactor={0.05}
        />
        
        <ambientLight intensity={0.7} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1.5} castShadow />
        <pointLight position={[-5, 5, -5]} intensity={0.5} />
        
        <Suspense fallback={
          <Html center>
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="animate-spin text-orange-500" size={24} />
              <span className="text-[10px] text-gray-500 font-medium">加载 3D 预览...</span>
            </div>
          </Html>
        }>
          <ErrorBoundary fallback={
            <Html center>
              <div className="flex flex-col items-center justify-center p-4 bg-red-50 border border-red-100 rounded-lg">
                <p className="text-xs text-red-500 font-medium">预览加载失败</p>
              </div>
            </Html>
          }>
            {glbData ? (
              <GLBModelViewer 
                glbData={glbData} 
                designCanvas={designCanvas} 
                canvasColor={canvasColor}
                metalness={metalness}
                roughness={roughness}
                textureSizeConfig={textureSizeConfig}
                elements={elements}
              />
            ) : (
              <BoxModel 
                elements={elements} 
                progress={unfoldProgress} 
                canvasColor={canvasColor} 
                canvasTexture={canvasTexture}
                boxType={boxType}
              />
            )}
          </ErrorBoundary>
        </Suspense>
        
        <ContactShadows position={[0, -2.5, 0]} opacity={0.4} scale={15} blur={2.5} far={4} />
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}
