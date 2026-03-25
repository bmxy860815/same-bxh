export const MINI_PREVIEW_MIN_WIDTH = 160;
export const MINI_PREVIEW_MAX_WIDTH = 800;
export const MINI_PREVIEW_MIN_HEIGHT = 120;
export const MINI_PREVIEW_MAX_HEIGHT = 600;

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function calcMiniPreviewSizeFromBottomLeft(
  startX: number,
  startY: number,
  moveX: number,
  moveY: number,
  startWidth: number,
  startHeight: number
) {
  const deltaX = startX - moveX;
  const deltaY = moveY - startY;
  return {
    width: clamp(startWidth + deltaX, MINI_PREVIEW_MIN_WIDTH, MINI_PREVIEW_MAX_WIDTH),
    height: clamp(startHeight + deltaY, MINI_PREVIEW_MIN_HEIGHT, MINI_PREVIEW_MAX_HEIGHT)
  };
}
