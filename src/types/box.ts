export type FaceType = 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom';

export interface FaceDefinition {
  type: FaceType;
  /** Width in 3D units */
  width3D: number;
  /** Height in 3D units */
  height3D: number;
  /** X position in 2D canvas (center of the face) */
  canvasX: number;
  /** Y position in 2D canvas (center of the face) */
  canvasY: number;
  /** Width in 2D canvas pixels */
  canvasW: number;
  /** Height in 2D canvas pixels */
  canvasH: number;
}

export interface BoxType {
  id: string;
  name: string;
  description?: string;
  /** Physical dimensions in mm or other units */
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  /** Normalized 3D dimensions for Three.js */
  box3D: {
    w: number;
    h: number;
    d: number;
  };
  /** Die-line layout information */
  dieLine: {
    /** Overall canvas width for this die-line template */
    width: number;
    /** Overall canvas height for this die-line template */
    height: number;
    /** Definitions for each face's position on the canvas */
    faces: FaceDefinition[];
  };
}
