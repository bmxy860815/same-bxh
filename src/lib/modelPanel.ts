export type ModelPanelMode = 'white_uv' | 'default';
export type TextureSizeUnit = 'px' | 'mm' | 'cm' | 'in';

export interface TextureSizeConfig {
  width: number;
  height: number;
  unit: TextureSizeUnit;
}

export function getModelExtension(source: string | File | null): string {
  if (!source) return '';
  const raw = typeof source === 'string' ? source : source.name;
  const idx = raw.lastIndexOf('.');
  if (idx < 0) return '';
  return raw.slice(idx).toLowerCase();
}

export function createModelCacheKey(source: string | File | null, primitiveId: string): string {
  if (!source) return `primitive:${primitiveId}`;
  if (typeof source === 'string') return `model:${source}`;
  return `model:${source.name}:${source.size}:${source.lastModified}`;
}

export function resolveModelPanelMode(
  source: string | File | null,
  hasTextureChannel: boolean
): ModelPanelMode {
  if (!source) return 'default';
  const ext = getModelExtension(source);
  if (ext === '.glb' || ext === '.gltf') {
    return hasTextureChannel ? 'default' : 'white_uv';
  }
  return 'default';
}

export function getDefaultTextureSize(width: number, height: number): TextureSizeConfig {
  const base = 1200;
  if (width <= 0 || height <= 0) return { width: base, height: base, unit: 'px' };
  if (width >= height) return { width: base, height: Math.max(200, Math.round(base * (height / width))), unit: 'px' };
  return { width: Math.max(200, Math.round(base * (width / height))), height: base, unit: 'px' };
}

export function resolveTextureSizeFromCache(
  cache: Record<string, TextureSizeConfig>,
  key: string,
  uvWidth: number,
  uvHeight: number
): TextureSizeConfig {
  return cache[key] || getDefaultTextureSize(uvWidth, uvHeight);
}
