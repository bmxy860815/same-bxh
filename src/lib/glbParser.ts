import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export interface UVData {
  outlineSegments: number[][];
  contours: number[][][];
  bounds: { minX: number, maxX: number, minY: number, maxY: number };
  width: number;
  height: number;
  physicalWidth?: number;
  physicalHeight?: number;
}

export interface ParsedGLB {
  gltf: any;
  targetMesh: THREE.Mesh | null;
  uvData: UVData | null;
}

export async function parseGLB(url: string | File): Promise<ParsedGLB> {
  const loader = new GLTFLoader();
  
  let objectUrl = url as string;
  let isFile = false;
  if (url instanceof File) {
    objectUrl = URL.createObjectURL(url);
    isFile = true;
  }

  try {
    const gltf = await loader.loadAsync(objectUrl);
    let targetMesh: THREE.Mesh | null = null;

    gltf.scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        // Try to find the mesh named '贴图'
        if (child.name === '贴图' || child.name === 'Label' || child.name === 'texture') {
          targetMesh = child as THREE.Mesh;
        }
      }
    });

    // Fallback: if '贴图' not found, just pick the first mesh
    if (!targetMesh) {
      gltf.scene.traverse((child) => {
        if (!targetMesh && (child as THREE.Mesh).isMesh) {
          targetMesh = child as THREE.Mesh;
        }
      });
    }

    let uvData: UVData | null = null;

    if (targetMesh) {
      const geometry = targetMesh.geometry;
      const uvAttribute = geometry.attributes.uv;
      const index = geometry.index;

      if (uvAttribute) {
        type Point = { x: number; y: number };
        type EdgeRecord = { count: number; a: Point; b: Point };
        const pointByKey = new Map<string, Point>();
        const edgeMap = new Map<string, EdgeRecord>();
        const epsilon = 1e-6;
        const factor = 1 / epsilon;

        const toPoint = (vertexIndex: number): Point => {
          const u = uvAttribute.getX(vertexIndex);
          const v = uvAttribute.getY(vertexIndex);
          return { x: u, y: 1 - v };
        };

        const pointKey = (p: Point) => `${Math.round(p.x * factor)}_${Math.round(p.y * factor)}`;

        const edgeKey = (a: Point, b: Point) => {
          const ak = pointKey(a);
          const bk = pointKey(b);
          return ak < bk ? `${ak}|${bk}` : `${bk}|${ak}`;
        };

        const registerPoint = (p: Point) => {
          const key = pointKey(p);
          if (!pointByKey.has(key)) {
            pointByKey.set(key, p);
          }
          return key;
        };

        const addEdge = (a: Point, b: Point) => {
          registerPoint(a);
          registerPoint(b);
          const key = edgeKey(a, b);
          const prev = edgeMap.get(key);
          if (prev) {
            prev.count += 1;
          } else {
            edgeMap.set(key, { count: 1, a, b });
          }
        };

        const positionAttribute = geometry.attributes.position;
        let sumLenU = 0;
        let sumLenV = 0;
        let validTriangles = 0;

        const triangleCount = index ? Math.floor(index.count / 3) : Math.floor(uvAttribute.count / 3);
        for (let tri = 0; tri < triangleCount; tri++) {
          const i0 = index ? index.getX(tri * 3) : tri * 3;
          const i1 = index ? index.getX(tri * 3 + 1) : tri * 3 + 1;
          const i2 = index ? index.getX(tri * 3 + 2) : tri * 3 + 2;

          const p0 = toPoint(i0);
          const p1 = toPoint(i1);
          const p2 = toPoint(i2);

          addEdge(p0, p1);
          addEdge(p1, p2);
          addEdge(p2, p0);

          if (positionAttribute) {
            const v0 = new THREE.Vector3().fromBufferAttribute(positionAttribute, i0);
            const v1 = new THREE.Vector3().fromBufferAttribute(positionAttribute, i1);
            const v2 = new THREE.Vector3().fromBufferAttribute(positionAttribute, i2);

            const uv0 = new THREE.Vector2().fromBufferAttribute(uvAttribute, i0);
            const uv1 = new THREE.Vector2().fromBufferAttribute(uvAttribute, i1);
            const uv2 = new THREE.Vector2().fromBufferAttribute(uvAttribute, i2);

            const dp1 = v1.clone().sub(v0);
            const dp2 = v2.clone().sub(v0);

            const duv1 = uv1.clone().sub(uv0);
            const duv2 = uv2.clone().sub(uv0);

            const det = duv1.x * duv2.y - duv2.x * duv1.y;
            if (Math.abs(det) > 1e-6) {
              const invDet = 1.0 / det;
              const dpdu = new THREE.Vector3(
                (duv2.y * dp1.x - duv1.y * dp2.x) * invDet,
                (duv2.y * dp1.y - duv1.y * dp2.y) * invDet,
                (duv2.y * dp1.z - duv1.y * dp2.z) * invDet
              );
              const dpdv = new THREE.Vector3(
                (-duv2.x * dp1.x + duv1.x * dp2.x) * invDet,
                (-duv2.x * dp1.y + duv1.x * dp2.y) * invDet,
                (-duv2.x * dp1.z + duv1.x * dp2.z) * invDet
              );

              sumLenU += dpdu.length();
              sumLenV += dpdv.length();
              validTriangles++;
            }
          }
        }

        const boundaryEdges = Array.from(edgeMap.values()).filter(e => e.count === 1);
        const outlineSegments = boundaryEdges.map(e => [e.a.x, e.a.y, e.b.x, e.b.y]);

        const adjacency = new Map<string, Set<string>>();
        const addNeighbor = (aKey: string, bKey: string) => {
          if (!adjacency.has(aKey)) adjacency.set(aKey, new Set<string>());
          adjacency.get(aKey)!.add(bKey);
        };

        for (const edge of boundaryEdges) {
          const ak = pointKey(edge.a);
          const bk = pointKey(edge.b);
          addNeighbor(ak, bk);
          addNeighbor(bk, ak);
        }

        const visitedEdges = new Set<string>();
        const edgeVisitKey = (aKey: string, bKey: string) => aKey < bKey ? `${aKey}|${bKey}` : `${bKey}|${aKey}`;
        const contours: number[][][] = [];

        for (const [startKey, neighbors] of adjacency.entries()) {
          for (const nextKey of neighbors) {
            const initialEdge = edgeVisitKey(startKey, nextKey);
            if (visitedEdges.has(initialEdge)) continue;

            const loopKeys: string[] = [startKey];
            let prevKey = startKey;
            let currKey = nextKey;
            visitedEdges.add(initialEdge);
            loopKeys.push(currKey);

            while (currKey !== startKey) {
              const currNeighbors = adjacency.get(currKey);
              if (!currNeighbors || currNeighbors.size === 0) break;

              let candidateKey: string | null = null;
              for (const nKey of currNeighbors) {
                if (nKey === prevKey) continue;
                const eKey = edgeVisitKey(currKey, nKey);
                if (!visitedEdges.has(eKey)) {
                  candidateKey = nKey;
                  break;
                }
              }

              if (!candidateKey) {
                for (const nKey of currNeighbors) {
                  const eKey = edgeVisitKey(currKey, nKey);
                  if (!visitedEdges.has(eKey)) {
                    candidateKey = nKey;
                    break;
                  }
                }
              }

              if (!candidateKey) break;
              visitedEdges.add(edgeVisitKey(currKey, candidateKey));
              prevKey = currKey;
              currKey = candidateKey;
              loopKeys.push(currKey);

              if (loopKeys.length > boundaryEdges.length + 2) break;
            }

            if (loopKeys.length >= 4 && loopKeys[0] === loopKeys[loopKeys.length - 1]) {
              const contour: number[][] = loopKeys
                .slice(0, -1)
                .map(k => {
                  const p = pointByKey.get(k)!;
                  return [p.x, p.y];
                });
              contours.push(contour);
            }
          }
        }

        const contourArea = (contour: number[][]) => {
          let area = 0;
          for (let i = 0; i < contour.length; i++) {
            const [x1, y1] = contour[i];
            const [x2, y2] = contour[(i + 1) % contour.length];
            area += x1 * y2 - x2 * y1;
          }
          return Math.abs(area / 2);
        };

        const sortedContours = contours.sort((a, b) => contourArea(b) - contourArea(a));
        const outerContour = sortedContours[0] || [];

        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;

        for (const [x, y] of outerContour) {
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        }

        if (!outerContour.length) {
          for (const edge of boundaryEdges) {
            minX = Math.min(minX, edge.a.x, edge.b.x);
            maxX = Math.max(maxX, edge.a.x, edge.b.x);
            minY = Math.min(minY, edge.a.y, edge.b.y);
            maxY = Math.max(maxY, edge.a.y, edge.b.y);
          }
        }

        if (!Number.isFinite(minX) || !Number.isFinite(maxX) || !Number.isFinite(minY) || !Number.isFinite(maxY)) {
          minX = 0;
          minY = 0;
          maxX = 1;
          maxY = 1;
        }

        let physicalWidth = maxX - minX;
        let physicalHeight = maxY - minY;
        if (validTriangles > 0) {
          const avgLenU = sumLenU / validTriangles;
          const avgLenV = sumLenV / validTriangles;
          physicalWidth = avgLenU * (maxX - minX);
          physicalHeight = avgLenV * (maxY - minY);
        }

        uvData = {
          outlineSegments,
          contours: outerContour.length ? [outerContour] : [],
          bounds: { minX, maxX, minY, maxY },
          width: maxX - minX,
          height: maxY - minY,
          physicalWidth,
          physicalHeight
        };
      }
    }

    return { gltf, targetMesh, uvData };
  } finally {
    if (isFile) {
      URL.revokeObjectURL(objectUrl);
    }
  }
}
