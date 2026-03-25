import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Stage, Layer, Image as KonvaImage, Text as KonvaText, Rect, Line, Transformer, Path, Group } from 'react-konva';
import { BoxElement } from '../types';
import { BoxType } from '../types/box';
import useImage from 'use-image';
import { ParsedGLB } from '../lib/glbParser';
import { TextureSizeConfig } from '../lib/modelPanel';

interface DesignCanvasProps {
  elements: BoxElement[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onChange: (elements: BoxElement[]) => void;
  canvasColor: string;
  canvasTexture: string | null;
  boxType: BoxType;
  glbData?: ParsedGLB | null;
  textureSizeConfig?: TextureSizeConfig;
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
}

const URLImage = ({ element, isSelected, onSelect, onChange, hideSelectionForExport }: { 
  element: BoxElement, 
  isSelected: boolean, 
  onSelect: () => void,
  onChange: (newAttrs: Partial<BoxElement>) => void,
  hideSelectionForExport?: boolean
}) => {
  const [img] = useImage(element.src || '', 'anonymous');
  const shapeRef = useRef<any>(null);
  const trRef = useRef<any>(null);

  useEffect(() => {
    if (isSelected && !hideSelectionForExport && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected, hideSelectionForExport]);

  return (
    <React.Fragment>
      <KonvaImage
        image={img}
        ref={shapeRef}
        x={element.x}
        y={element.y}
        width={element.width}
        height={element.height}
        offsetX={element.width / 2}
        offsetY={element.height / 2}
        scaleX={element.scaleX || 1}
        scaleY={element.scaleY || 1}
        rotation={element.rotation}
        opacity={element.opacity}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragMove={(e) => {
          onChange({
            x: e.target.x(),
            y: e.target.y(),
          });
        }}
        onTransform={(e) => {
          const node = shapeRef.current;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          
          const flipX = scaleX < 0 ? -1 : 1;
          const flipY = scaleY < 0 ? -1 : 1;

          // Reset scale and update width/height
          node.scaleX(flipX);
          node.scaleY(flipY);
          
          const newWidth = Math.max(5, node.width() * Math.abs(scaleX));
          const newHeight = Math.max(5, node.height() * Math.abs(scaleY));
          
          onChange({
            x: node.x(),
            y: node.y(),
            width: newWidth,
            height: newHeight,
            rotation: node.rotation(),
            scaleX: flipX,
            scaleY: flipY,
          });
        }}
      />
      {isSelected && !hideSelectionForExport && (
        <Transformer
          ref={trRef}
          rotateEnabled={true}
          enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right', 'top-center', 'bottom-center', 'left-center', 'right-center']}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 5 || newBox.height < 5) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </React.Fragment>
  );
};

const URLText = ({ element, isSelected, onSelect, onChange, hideSelectionForExport }: { 
  element: BoxElement, 
  isSelected: boolean, 
  onSelect: () => void,
  onChange: (newAttrs: Partial<BoxElement>) => void,
  hideSelectionForExport?: boolean
}) => {
  const shapeRef = useRef<any>(null);
  const trRef = useRef<any>(null);

  useEffect(() => {
    if (isSelected && !hideSelectionForExport && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected, hideSelectionForExport]);

  return (
    <React.Fragment>
      <KonvaText
        text={element.text}
        ref={shapeRef}
        x={element.x}
        y={element.y}
        fontSize={element.fontSize}
        fill={element.fill}
        width={element.width}
        height={element.height}
        offsetX={element.width / 2}
        offsetY={element.height / 2}
        scaleX={element.scaleX || 1}
        scaleY={element.scaleY || 1}
        rotation={element.rotation}
        opacity={element.opacity}
        draggable
        align="center"
        verticalAlign="middle"
        onClick={onSelect}
        onTap={onSelect}
        onDragMove={(e) => {
          onChange({
            x: e.target.x(),
            y: e.target.y(),
          });
        }}
        onTransform={(e) => {
          const node = shapeRef.current;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();

          const flipX = scaleX < 0 ? -1 : 1;
          const flipY = scaleY < 0 ? -1 : 1;

          node.scaleX(flipX);
          node.scaleY(flipY);
          
          const newWidth = Math.max(5, node.width() * Math.abs(scaleX));
          const newHeight = Math.max(5, node.height() * Math.abs(scaleY));
          
          onChange({
            x: node.x(),
            y: node.y(),
            width: newWidth,
            height: newHeight,
            rotation: node.rotation(),
            scaleX: flipX,
            scaleY: flipY,
          });
        }}
      />
      {isSelected && !hideSelectionForExport && (
        <Transformer
          ref={trRef}
          rotateEnabled={true}
          enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right', 'top-center', 'bottom-center', 'left-center', 'right-center']}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 5 || newBox.height < 5) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </React.Fragment>
  );
};

export function DesignCanvas({ elements, selectedId, onSelect, onChange, canvasColor, canvasTexture, boxType, glbData, textureSizeConfig, onCanvasReady }: DesignCanvasProps) {
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const designLayerRef = useRef<any>(null);
  const [texImg] = useImage(canvasTexture || '', 'anonymous');

  const { faces } = boxType.dieLine;
  const frontFace = faces.find(f => f.type === 'front') || faces[0];
  const centerX = frontFace.canvasX;
  const centerY = frontFace.canvasY;
  const isGlbMode = !!glbData;
  const uvWidth = glbData?.uvData?.width || 1;
  const uvHeight = glbData?.uvData?.height || 1;
  const uvMinX = glbData?.uvData?.bounds.minX || 0;
  const uvMinY = glbData?.uvData?.bounds.minY || 0;

  const autoCanvasWidth = useMemo(() => {
    const maxSide = 1600;
    const minSide = 800;
    if (uvWidth >= uvHeight) return maxSide;
    return Math.max(minSide, Math.round(maxSide * (uvWidth / uvHeight)));
  }, [uvWidth, uvHeight]);

  const autoCanvasHeight = useMemo(() => {
    const maxSide = 1600;
    const minSide = 800;
    if (uvHeight > uvWidth) return maxSide;
    return Math.max(minSide, Math.round(maxSide * (uvHeight / uvWidth)));
  }, [uvWidth, uvHeight]);

  const glbCanvasSizeFromConfig = useMemo(() => {
    if (!textureSizeConfig) return null;
    const unitToPx: Record<TextureSizeConfig['unit'], number> = {
      px: 1,
      mm: 300 / 25.4,
      cm: 300 / 2.54,
      in: 300
    };
    const factor = unitToPx[textureSizeConfig.unit];
    return {
      width: Math.max(256, Math.min(8192, Math.round(textureSizeConfig.width * factor))),
      height: Math.max(256, Math.min(8192, Math.round(textureSizeConfig.height * factor)))
    };
  }, [textureSizeConfig]);

  const glbCanvasWidth = glbCanvasSizeFromConfig?.width || autoCanvasWidth;
  const glbCanvasHeight = glbCanvasSizeFromConfig?.height || autoCanvasHeight;

  const contourPadding = 60;
  const { contourScaleX, contourScaleY } = useMemo(() => {
    const usableW = Math.max(1, glbCanvasWidth - contourPadding * 2);
    const usableH = Math.max(1, glbCanvasHeight - contourPadding * 2);
    return {
      contourScaleX: usableW / Math.max(uvWidth, 1e-6),
      contourScaleY: usableH / Math.max(uvHeight, 1e-6)
    };
  }, [glbCanvasWidth, glbCanvasHeight, uvWidth, uvHeight]);

  const contourPoints = useMemo(() => {
    const contour = glbData?.uvData?.contours?.[0] || [];
    return contour.map(([u, v]) => [
      contourPadding + (u - uvMinX) * contourScaleX,
      contourPadding + (v - uvMinY) * contourScaleY
    ]);
  }, [glbData?.uvData?.contours, uvMinX, uvMinY, contourScaleX, contourScaleY]);

  const contourFlatPoints = useMemo(
    () => contourPoints.flat(),
    [contourPoints]
  );

  const scale = useMemo(() => {
    if (isGlbMode && containerSize.width && containerSize.height) {
      const scaleX = containerSize.width / glbCanvasWidth;
      const scaleY = containerSize.height / glbCanvasHeight;
      return Math.min(scaleX, scaleY) * 0.9;
    }
    return 1;
  }, [isGlbMode, containerSize.width, containerSize.height, glbCanvasWidth, glbCanvasHeight]);

  const canvasOffsetX = isGlbMode ? (containerSize.width - glbCanvasWidth * scale) / 2 : (containerSize.width / 2 - centerX);
  const canvasOffsetY = isGlbMode ? (containerSize.height - glbCanvasHeight * scale) / 2 : (containerSize.height / 2 - centerY);

  const renderCanvasToTexture = React.useCallback(() => {
    if (!designLayerRef.current || !onCanvasReady || !isGlbMode) return;
    
    try {
      const width = isGlbMode ? glbCanvasWidth * scale : boxType.dieLine.width;
      const height = isGlbMode ? glbCanvasHeight * scale : boxType.dieLine.height;
      
      // temporarily hide transformer for 3D texture rendering
      const layer = designLayerRef.current;
      const transformers = layer.find('Transformer');
      transformers.forEach((tr: any) => tr.hide());
      layer.draw();
      
      const canvas = layer.toCanvas({ 
        pixelRatio: isGlbMode ? (0.5 / scale) : 1, // Use lower pixelRatio for fast previews
        x: canvasOffsetX, 
        y: canvasOffsetY,
        width: width,
        height: height,
      });
      
      transformers.forEach((tr: any) => tr.show());
      layer.draw();
      
      onCanvasReady(canvas);
    } catch (e) {
      console.warn("Failed to render canvas to texture", e);
    }
  }, [isGlbMode, glbCanvasWidth, glbCanvasHeight, scale, boxType.dieLine.width, boxType.dieLine.height, canvasOffsetX, canvasOffsetY, onCanvasReady]);

  // Debounced effect for triggering the render
  useEffect(() => {
    // For glb mode, only trigger render when there are changes, don't trigger constantly
    const timer = setTimeout(renderCanvasToTexture, 100);
    return () => clearTimeout(timer);
  }, [elements, canvasColor, canvasTexture, isGlbMode, boxType.id, renderCanvasToTexture]);

  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);





  const handleStageClick = (e: any) => {
    if (e.target === e.target.getStage() || e.target.name() === 'background') {
      onSelect(null);
    }
  };

  if (containerSize.width === 0 || containerSize.height === 0) {
    return <div ref={containerRef} className="w-full h-full bg-[#F5F5F5]" />;
  }

  const faceProps = {
    fill: canvasTexture ? undefined : (canvasColor === 'transparent' ? undefined : canvasColor),
    fillPatternImage: canvasTexture ? texImg : undefined,
    fillPatternScale: canvasTexture ? { x: 0.5, y: 0.5 } : undefined,
    stroke: "rgba(0,0,0,0.1)",
    strokeWidth: 0.5,
  };

  const renderElements = (isExport = false) => {
    return elements.map((el) => (
      el.type === 'image' ? (
        <URLImage
          key={el.id}
          element={el}
          isSelected={el.id === selectedId}
          hideSelectionForExport={isExport}
          onSelect={() => onSelect(el.id)}
          onChange={(newAttrs) => {
            const newElements = elements.map((item) => 
              item.id === el.id ? { ...item, ...newAttrs } : item
            );
            onChange(newElements);
          }}
        />
      ) : (
        <URLText
          key={el.id}
          element={el}
          isSelected={el.id === selectedId}
          hideSelectionForExport={isExport}
          onSelect={() => onSelect(el.id)}
          onChange={(newAttrs) => {
            const newElements = elements.map((item) => 
              item.id === el.id ? { ...item, ...newAttrs } : item
            );
            onChange(newElements);
          }}
        />
      )
    ));
  };

  return (
    <div ref={containerRef} className="w-full h-full bg-[#F5F5F5] relative overflow-hidden">
      <Stage
        width={containerSize.width}
        height={containerSize.height}
        onMouseDown={handleStageClick}
        onTouchStart={handleStageClick}
      >
        <Layer 
          ref={designLayerRef}
          x={canvasOffsetX} 
          y={canvasOffsetY} 
          scaleX={scale} 
          scaleY={scale}
        >
          <Rect
            name="background"
            x={0}
            y={0}
            width={isGlbMode ? glbCanvasWidth : containerSize.width}
            height={isGlbMode ? glbCanvasHeight : containerSize.height}
            fill="transparent"
          />

          {isGlbMode && glbData?.uvData ? (
            <Group>
              {contourFlatPoints.length >= 6 && (
                <Line
                  points={contourFlatPoints}
                  closed
                  fill={canvasTexture ? undefined : canvasColor}
                  fillPatternImage={canvasTexture ? texImg : undefined}
                  stroke="#FF00FF"
                  strokeWidth={2}
                />
              )}
              
              <Group
                clipFunc={(context) => {
                  if (contourPoints.length >= 3) {
                    context.beginPath();
                    context.moveTo(contourPoints[0][0], contourPoints[0][1]);
                    for (let i = 1; i < contourPoints.length; i++) {
                      context.lineTo(contourPoints[i][0], contourPoints[i][1]);
                    }
                    context.closePath();
                  } else {
                    context.rect(contourPadding, contourPadding, glbCanvasWidth - contourPadding * 2, glbCanvasHeight - contourPadding * 2);
                  }
                }}
              >
                {renderElements()}
              </Group>
            </Group>
          ) : (
            <Group>
              {/* Render all faces from boxType */}
              {faces.map((face, index) => (
                <React.Fragment key={face.type + index}>
                  <Rect
                    x={face.canvasX - face.canvasW / 2}
                    y={face.canvasY - face.canvasH / 2}
                    width={face.canvasW}
                    height={face.canvasH}
                    {...faceProps}
                  />
                  {/* Add fold lines for certain faces if needed */}
                  {face.type === 'front' && (
                    <>
                      <Line points={[face.canvasX - face.canvasW/2, face.canvasY - face.canvasH/2, face.canvasX + face.canvasW/2, face.canvasY - face.canvasH/2]} stroke="white" dash={[5, 5]} />
                      <Line points={[face.canvasX - face.canvasW/2, face.canvasY + face.canvasH/2, face.canvasX + face.canvasW/2, face.canvasY + face.canvasH/2]} stroke="white" dash={[5, 5]} />
                    </>
                  )}
                </React.Fragment>
              ))}

              {renderElements()}
            </Group>
          )}
        </Layer>
      </Stage>
      
      {/* Zoom controls overlay */}
      <div className="absolute bottom-4 left-4 flex flex-col gap-2">
        {isGlbMode && glbCanvasSizeFromConfig && (
          <div className="bg-white rounded-md shadow-sm border border-gray-200 px-3 py-2 text-xs text-gray-700">
            画布尺寸: {textureSizeConfig?.width} × {textureSizeConfig?.height} {textureSizeConfig?.unit}
          </div>
        )}
        {!isGlbMode && (
          <div className="bg-white rounded-md shadow-sm border border-gray-200 px-3 py-2 text-xs text-gray-700">
            画布尺寸: {Math.round(boxType.dieLine.width)} × {Math.round(boxType.dieLine.height)} mm
          </div>
        )}
        <div className="bg-white rounded-md shadow-sm border border-gray-200 p-1 flex items-center gap-2">
          <button className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 rounded">-</button>
          <span className="text-xs font-medium w-10 text-center">47%</span>
          <button className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 rounded">+</button>
        </div>
      </div>
    </div>
  );
}
