import React from 'react';
import { render, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as THREE from 'three';
import { Preview3D } from '../components/Preview3D';
import { ParsedGLB } from '../lib/glbParser';
import { TextureSizeConfig } from '../lib/modelPanel';

vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: any) => <div data-testid="r3f-canvas">{children}</div>,
  useFrame: () => {},
}));

vi.mock('@react-three/drei', () => ({
  OrbitControls: () => null,
  PerspectiveCamera: () => null,
  Environment: () => null,
  ContactShadows: () => null,
  Html: ({ children }: any) => <div>{children}</div>,
  useTexture: (url: string) => new THREE.Texture(),
}));

describe('Preview3D Texture Mapping', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calculates and applies correct texture repeat and offset for GLB models', async () => {
    // Create mock GLB data
    const mockMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardMaterial()
    );
    mockMesh.name = 'target_mesh';
    
    const clonedMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardMaterial()
    );
    clonedMesh.name = 'target_mesh';

    const clonedSceneGroup = new THREE.Group();
    clonedSceneGroup.add(clonedMesh);

    const mockScene = new THREE.Group();
    mockScene.add(mockMesh);
    
    // Mock clone to return our traceable clonedSceneGroup
    mockScene.clone = () => clonedSceneGroup;
    
    const mockGlbData: ParsedGLB = {
      gltf: { scene: mockScene } as any,
      targetMesh: mockMesh,
      uvData: {
        bounds: { minX: 0.2, maxX: 0.8, minY: 0.1, maxY: 0.7 },
        width: 0.6,
        height: 0.6,
        outlineSegments: [],
        contours: []
      }
    };

    // Create a mock canvas
    const mockCanvas = document.createElement('canvas');
    mockCanvas.width = 1000;
    mockCanvas.height = 1000;

    // Define texture size config
    const textureSizeConfig: TextureSizeConfig = {
      width: 1000,
      height: 1000,
      unit: 'px'
    };

    render(
      <Preview3D 
        elements={[]} 
        boxType={{ id: 'test', name: 'Test', box3D: { w: 1, h: 1, d: 1 }, dieLine: { width: 100, height: 100, faces: [] } }}
        glbData={mockGlbData}
        designCanvas={mockCanvas}
        textureSizeConfig={textureSizeConfig}
      />
    );

    // Wait for effects
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    // Check if the material was updated correctly on the cloned mesh
    const updatedMaterial = clonedMesh.material as THREE.MeshStandardMaterial;
    expect(updatedMaterial).toBeDefined();
    
    const map = updatedMaterial.map as THREE.CanvasTexture;
    expect(map).toBeDefined();
    expect(map).not.toBeNull();
    expect(map.flipY).toBe(false);
    expect(map.colorSpace).toBe(THREE.SRGBColorSpace);
    
    const expectedRepeat = 1466.6666666666667 / 1000;
    const expectedOffsetX = (60 - 0.2 * 1466.6666666666667) / 1000;
    const expectedOffsetY = (60 - 0.1 * 1466.6666666666667) / 1000;

    expect(map.repeat.x).toBeCloseTo(expectedRepeat, 4);
    expect(map.repeat.y).toBeCloseTo(expectedRepeat, 4);
    expect(map.offset.x).toBeCloseTo(expectedOffsetX, 4);
    expect(map.offset.y).toBeCloseTo(expectedOffsetY, 4);
  });

  it('handles non-uniform scaling correctly when canvas aspect ratio differs from UV aspect ratio', async () => {
    // Canvas is 3000x1000 (3:1)
    const mockCanvas = document.createElement('canvas');
    mockCanvas.width = 3000;
    mockCanvas.height = 1000;

    const textureSizeConfig: TextureSizeConfig = {
      width: 3000,
      height: 1000,
      unit: 'px'
    };

    const mockMesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial());
    mockMesh.name = 'target_mesh';
    const clonedMesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial());
    clonedMesh.name = 'target_mesh';
    const clonedSceneGroup = new THREE.Group();
    clonedSceneGroup.add(clonedMesh);
    const mockScene = new THREE.Group();
    mockScene.add(mockMesh);
    mockScene.clone = () => clonedSceneGroup;
    
    // UV is 1:1
    const mockGlbData: ParsedGLB = {
      gltf: { scene: mockScene } as any,
      targetMesh: mockMesh,
      uvData: {
        bounds: { minX: 0, maxX: 1, minY: 0, maxY: 1 },
        width: 1,
        height: 1,
        outlineSegments: [],
        contours: []
      }
    };

    render(
      <Preview3D 
        elements={[]} 
        boxType={{ id: 'test', name: 'Test', box3D: { w: 1, h: 1, d: 1 }, dieLine: { width: 100, height: 100, faces: [] } }}
        glbData={mockGlbData}
        designCanvas={mockCanvas}
        textureSizeConfig={textureSizeConfig}
      />
    );

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    const updatedMaterial = clonedMesh.material as THREE.MeshStandardMaterial;
    const map = updatedMaterial.map as THREE.CanvasTexture;

    // contourPadding = 60
    // usableW = 3000 - 120 = 2880
    // usableH = 1000 - 120 = 880
    // contourScaleX = 2880 / 1 = 2880
    // contourScaleY = 880 / 1 = 880
    // repeatX = 2880 / 3000 = 0.96
    // repeatY = 880 / 1000 = 0.88
    
    expect(map.repeat.x).toBeCloseTo(0.96, 4);
    expect(map.repeat.y).toBeCloseTo(0.88, 4);
    expect(map.offset.x).toBeCloseTo(60 / 3000, 4); // (60 - 0 * 2880) / 3000
    expect(map.offset.y).toBeCloseTo(60 / 1000, 4); // (60 - 0 * 880) / 1000
  });
});
