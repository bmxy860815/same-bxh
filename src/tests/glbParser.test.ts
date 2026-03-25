import { describe, it, expect, vi } from 'vitest';
import { parseGLB } from '../lib/glbParser';
import * as THREE from 'three';

// Mock GLTFLoader
vi.mock('three/examples/jsm/loaders/GLTFLoader.js', () => {
  return {
    GLTFLoader: class {
      async loadAsync(url: string) {
        // Create a mock scene with a mesh named "贴图"
        const geometry = new THREE.BufferGeometry();
        
        // Mock UV data
        const uvs = new Float32Array([
          0, 0,
          1, 0,
          0, 1,
          1, 1
        ]);
        geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
        
        // Mock indices
        geometry.setIndex([0, 1, 2, 2, 1, 3]);

        const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial());
        mesh.name = '贴图';

        const scene = new THREE.Scene();
        scene.add(mesh);

        return { scene };
      }
    }
  };
});

describe('GLB Parser', () => {
  it('should parse GLB and extract UV data from "贴图" mesh', async () => {
    const result = await parseGLB('mock-url.glb');
    
    expect(result.gltf).toBeDefined();
    expect(result.targetMesh).toBeDefined();
    expect(result.targetMesh?.name).toBe('贴图');
    
    expect(result.uvData).toBeDefined();
    // UV range is [0, 1], so mapped bounds should be exactly that
    expect(result.uvData?.bounds.minX).toBe(0);
    expect(result.uvData?.bounds.maxX).toBe(1);
    
    // Y is flipped (1 - v), so 0 becomes 1, and 1 becomes 0
    expect(result.uvData?.bounds.minY).toBe(0);
    expect(result.uvData?.bounds.maxY).toBe(1);
    
    expect(result.uvData?.outlineSegments.length).toBe(4);
    expect(result.uvData?.contours.length).toBe(1);
    expect(result.uvData?.contours[0].length).toBe(4);
  });
});
