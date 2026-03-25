import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { PropertiesPanel } from '../components/PropertiesPanel';
import {
  createModelCacheKey,
  resolveModelPanelMode,
  resolveTextureSizeFromCache,
  TextureSizeConfig
} from '../lib/modelPanel';

const baseProps = {
  selectedElement: null,
  onUpdate: vi.fn(),
  onDelete: vi.fn(),
  onAnalyze: vi.fn(),
  canvasColor: '#FFFFFF',
  onCanvasColorChange: vi.fn(),
  canvasTexture: null,
  onCanvasTextureChange: vi.fn(),
  metalness: 0.5,
  onMetalnessChange: vi.fn(),
  roughness: 0.5,
  onRoughnessChange: vi.fn()
};

describe('Model Panel UI Logic', () => {
  it('白模(glb/gltf无贴图)显示贴图尺寸控件并支持数值绑定', () => {
    expect(resolveModelPanelMode('/demo.glb', false)).toBe('white_uv');
    const onTextureSizeChange = vi.fn();
    render(
      <PropertiesPanel
        {...baseProps}
        modelPanelMode="white_uv"
        textureSizeConfig={{ width: 1024, height: 512, unit: 'px' }}
        onTextureSizeChange={onTextureSizeChange}
      />
    );

    expect(screen.getByText('贴图尺寸')).toBeTruthy();
    expect(screen.getByTestId('uv-size-controls')).toBeTruthy();
    expect(screen.queryByTestId('default-size-material')).toBeNull();

    fireEvent.change(screen.getByTestId('uv-width-input'), { target: { value: '2048' } });
    fireEvent.change(screen.getByTestId('uv-height-input'), { target: { value: '768' } });
    fireEvent.change(screen.getByTestId('uv-unit-select'), { target: { value: 'mm' } });

    expect(onTextureSizeChange).toHaveBeenCalledWith({ width: 2048 });
    expect(onTextureSizeChange).toHaveBeenCalledWith({ height: 768 });
    expect(onTextureSizeChange).toHaveBeenCalledWith({ unit: 'mm' });
  });

  it('内置盒模型保持尺寸材质标题与控件', () => {
    expect(resolveModelPanelMode(null, false)).toBe('default');
    render(
      <PropertiesPanel
        {...baseProps}
        modelPanelMode="default"
        textureSizeConfig={{ width: 1024, height: 1024, unit: 'px' }}
        onTextureSizeChange={vi.fn()}
      />
    );

    expect(screen.getByText('尺寸/材质')).toBeTruthy();
    expect(screen.getByTestId('default-size-material')).toBeTruthy();
    expect(screen.queryByTestId('uv-size-controls')).toBeNull();
  });

  it('带贴图模型或非白模格式保持默认面板且可恢复缓存', () => {
    expect(resolveModelPanelMode('/demo.gltf', true)).toBe('default');
    expect(resolveModelPanelMode('/demo.fbx', true)).toBe('default');
    expect(resolveModelPanelMode('/demo.obj', true)).toBe('default');

    const cacheKey = createModelCacheKey('/demo.glb', 'standard-box');
    const cache: Record<string, TextureSizeConfig> = {
      [cacheKey]: { width: 1600, height: 900, unit: 'px' }
    };
    const restored = resolveTextureSizeFromCache(cache, cacheKey, 1, 1);
    expect(restored.width).toBe(1600);
    expect(restored.height).toBe(900);
    expect(restored.unit).toBe('px');
  });
});
