'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Rect, Circle, Text, Transformer, Line } from 'react-konva';
import type Konva from 'konva';
import type { CarouselSlide, CarouselTheme, CustomSlideElement, SlideElementPosition } from './karu_response_utility';

export default function KonvaElementEditor({
  slide,
  theme,
  onUpdate,
  selectedId,
  onSelect,
}: {
  slide: CarouselSlide;
  theme: CarouselTheme;
  onUpdate: (elements: CustomSlideElement[]) => void;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(() => setSize({ width: container.clientWidth, height: container.clientHeight }));
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const transformer = transformerRef.current;
    const selected = transformer?.getStage()?.findOne(`#custom-${selectedId}`);
    transformer?.nodes(selected ? [selected] : []);
    transformer?.getLayer()?.batchDraw();
  }, [selectedId, size, slide.elements]);

  const updateElement = (id: string, position: Partial<SlideElementPosition>) => {
    onUpdate((slide.elements ?? []).map(element => element.id === id
      ? { ...element, position: { ...element.position, ...position } }
      : element));
  };

  const snap = (value: number, target: number, threshold: number) =>
    Math.abs(value - target) <= threshold ? target : value;

  return (
    <div ref={containerRef} className="absolute inset-0 z-30 pointer-events-auto" aria-label="Slide design editor">
      <div className="absolute left-2 top-2 z-40 rounded-md bg-slate-900/90 px-2 py-1 text-[10px] font-semibold text-white shadow">
        {selectedId ? 'Selected element · drag or resize' : 'Click an element to select it'}
      </div>
      {size.width > 0 && (
        <Stage
          width={size.width}
          height={size.height}
          onMouseDown={event => {
            if (event.target === event.target.getStage()) onSelect(null);
          }}
        >
          <Layer>
            <Line points={[size.width / 2, 0, size.width / 2, size.height]} stroke="#6366f1" strokeWidth={1} dash={[5, 5]} opacity={0.55} listening={false} />
            <Line points={[0, size.height / 2, size.width, size.height / 2]} stroke="#6366f1" strokeWidth={1} dash={[5, 5]} opacity={0.55} listening={false} />
            <Rect x={1} y={1} width={size.width - 2} height={size.height - 2} stroke="#6366f1" strokeWidth={1} dash={[8, 6]} opacity={0.35} listening={false} />
            {(slide.elements ?? []).map(element => {
              const x = size.width / 2 + (element.position.x / 100) * size.width;
              const y = size.height / 2 + (element.position.y / 100) * size.height;
              const width = ((element.position.width ?? 30) / 100) * size.width;
              const height = ((element.position.height ?? 12) / 100) * size.height;
              const common = {
                id: `custom-${element.id}`,
                x,
                y,
                width,
                height,
                rotation: element.position.rotation ?? 0,
                offsetX: width / 2,
                offsetY: height / 2,
                draggable: true,
                onClick: () => onSelect(element.id),
                onTap: () => onSelect(element.id),
                onDragEnd: (event: Konva.KonvaEventObject<DragEvent>) => updateElement(element.id, {
                  x: snap(((event.target.x() - size.width / 2) / size.width) * 100, 0, 2),
                  y: snap(((event.target.y() - size.height / 2) / size.height) * 100, 0, 2),
                }),
                onTransformEnd: (event: Konva.KonvaEventObject<Event>) => {
                  const target = event.target;
                  updateElement(element.id, {
                    x: ((target.x() - size.width / 2) / size.width) * 100,
                    y: ((target.y() - size.height / 2) / size.height) * 100,
                    width: Math.max(2, (target.width() * target.scaleX() / size.width) * 100),
                    height: Math.max(2, (target.height() * target.scaleY() / size.height) * 100),
                    rotation: target.rotation(),
                  });
                  target.scaleX(1);
                  target.scaleY(1);
                },
              };
              if (element.type === 'text') {
                return <Text key={element.id} {...common} text={element.content ?? 'Text'} fill={element.color ?? theme.textColor} fontSize={element.fontSize ?? 18} padding={8} stroke={selectedId === element.id ? '#4f46e5' : undefined} strokeWidth={selectedId === element.id ? 0.5 : 0} />;
              }
              if (element.type === 'circle') {
                return <Circle key={element.id} {...common} radius={Math.min(width, height) / 2} fill={element.backgroundColor ?? theme.accentColor} stroke={selectedId === element.id ? '#4f46e5' : undefined} strokeWidth={selectedId === element.id ? 3 : 0} />;
              }
              return <Rect key={element.id} {...common} fill={element.backgroundColor ?? theme.accentColor} cornerRadius={element.position.borderRadius ?? 8} stroke={selectedId === element.id ? '#4f46e5' : undefined} strokeWidth={selectedId === element.id ? 3 : 0} />;
            })}
            <Transformer
              ref={transformerRef}
              rotateEnabled
              borderStroke="#4f46e5"
              borderStrokeWidth={2}
              anchorStroke="#4f46e5"
              anchorFill="#ffffff"
              anchorSize={12}
              anchorCornerRadius={2}
              rotateAnchorOffset={28}
              rotationSnaps={[0, 90, 180, 270]}
              enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
              boundBoxFunc={(oldBox, newBox) => newBox.width < 12 || newBox.height < 12 ? oldBox : newBox}
            />
          </Layer>
        </Stage>
      )}
    </div>
  );
}
