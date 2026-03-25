import { describe, expect, it } from 'vitest';
import {
  calcMiniPreviewSizeFromBottomLeft,
  MINI_PREVIEW_MAX_HEIGHT,
  MINI_PREVIEW_MAX_WIDTH,
  MINI_PREVIEW_MIN_HEIGHT,
  MINI_PREVIEW_MIN_WIDTH
} from '../lib/miniPreviewResize';

describe('mini preview resize bounds', () => {
  it('在最小边界处正确钳制', () => {
    const size = calcMiniPreviewSizeFromBottomLeft(
      200, 200,
      2000, -2000,
      256, 192
    );
    expect(size.width).toBe(MINI_PREVIEW_MIN_WIDTH);
    expect(size.height).toBe(MINI_PREVIEW_MIN_HEIGHT);
  });

  it('在最大边界处正确钳制', () => {
    const size = calcMiniPreviewSizeFromBottomLeft(
      200, 200,
      -2000, 4000,
      256, 192
    );
    expect(size.width).toBe(MINI_PREVIEW_MAX_WIDTH);
    expect(size.height).toBe(MINI_PREVIEW_MAX_HEIGHT);
  });

  it('正常拖拽时按左下角手柄逻辑更新尺寸', () => {
    const size = calcMiniPreviewSizeFromBottomLeft(
      300, 300,
      280, 340,
      256, 192
    );
    expect(size.width).toBe(276);
    expect(size.height).toBe(232);
  });
});
