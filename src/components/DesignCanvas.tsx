import React, { useRef, useEffect, useState } from 'react';
import { Stage, Layer, Image as KonvaImage, Text as KonvaText, Rect, Line, Transformer } from 'react-konva';
import { BoxElement } from '../types';
import { BoxType } from '../types/box';
import useImage from 'use-image';

interface DesignCanvasProps {
  elements: BoxElement[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onChange: (elements: BoxElement[]) => void;
  canvasColor: string;
  canvasTexture: string | null;
  boxType: BoxType;
}

const URLImage = ({ element, isSelected, onSelect, onChange }: { 
  element: BoxElement, 
  isSelected: boolean, 
  onSelect: () => void,
  onChange: (newAttrs: Partial<BoxElement>) => void
}) => {
  const [img] = useImage(element.src || '');
  const shapeRef = useRef<any>(null);
  const trRef = useRef<any>(null);

  useEffect(() => {
    if (isSelected) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

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
      {isSelected && (
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

const URLText = ({ element, isSelected, onSelect, onChange }: { 
  element: BoxElement, 
  isSelected: boolean, 
  onSelect: () => void,
  onChange: (newAttrs: Partial<BoxElement>) => void
}) => {
  const shapeRef = useRef<any>(null);
  const trRef = useRef<any>(null);

  useEffect(() => {
    if (isSelected) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

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
      {isSelected && (
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

export function DesignCanvas({ elements, selectedId, onSelect, onChange, canvasColor, canvasTexture, boxType }: DesignCanvasProps) {
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [texImg] = useImage(canvasTexture || '');

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

  // Use values from boxType
  const { faces } = boxType.dieLine;
  
  // Find a reference point (center of front face) for centering the view
  const frontFace = faces.find(f => f.type === 'front') || faces[0];
  const centerX = frontFace.canvasX;
  const centerY = frontFace.canvasY;
  
  const handleStageClick = (e: any) => {
    if (e.target === e.target.getStage()) {
      onSelect(null);
    }
  };

  if (containerSize.width === 0 || containerSize.height === 0) {
    return <div ref={containerRef} className="w-full h-full bg-[#F5F5F5]" />;
  }

  // Calculate offset to keep the die-line centered in the view while maintaining fixed coordinates
  const offsetX = containerSize.width / 2 - centerX;
  const offsetY = containerSize.height / 2 - centerY;

  const faceProps = {
    fill: canvasTexture ? undefined : canvasColor,
    fillPatternImage: canvasTexture ? texImg : undefined,
    fillPatternScale: canvasTexture ? { x: 0.5, y: 0.5 } : undefined,
    stroke: "#FFFFFF",
    strokeWidth: 1,
  };

  return (
    <div ref={containerRef} className="w-full h-full bg-[#F5F5F5] relative overflow-hidden">
      <Stage
        width={containerSize.width}
        height={containerSize.height}
        onMouseDown={handleStageClick}
        onTouchStart={handleStageClick}
      >
        <Layer x={offsetX} y={offsetY}>
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

          {elements.map((el) => (
            el.type === 'image' ? (
              <URLImage
                key={el.id}
                element={el}
                isSelected={el.id === selectedId}
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
                onSelect={() => onSelect(el.id)}
                onChange={(newAttrs) => {
                  const newElements = elements.map((item) => 
                    item.id === el.id ? { ...item, ...newAttrs } : item
                  );
                  onChange(newElements);
                }}
              />
            )
          ))}
        </Layer>
      </Stage>
      
      {/* Zoom controls overlay */}
      <div className="absolute bottom-4 left-4 flex gap-2">
        <div className="bg-white rounded-md shadow-sm border border-gray-200 p-1 flex items-center gap-2">
          <button className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 rounded">-</button>
          <span className="text-xs font-medium w-10 text-center">47%</span>
          <button className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 rounded">+</button>
        </div>
      </div>
    </div>
  );
}
