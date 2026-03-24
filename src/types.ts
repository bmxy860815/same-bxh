export type ViewMode = '2d' | '3d';
export type BoxSide = 'outside' | 'inside';

export interface BoxElement {
  id: string;
  type: 'image' | 'text';
  side: BoxSide;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scaleX?: number;
  scaleY?: number;
  opacity: number;
  src?: string;
  text?: string;
  fontSize?: number;
  fill?: string;
}

export interface BoxDimensions {
  width: number;
  height: number;
  depth: number;
}
