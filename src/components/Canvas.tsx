import React, { useRef, useEffect, useState } from 'react';
import { useStudioStore } from '../store/useStudioStore';
import { evaluateNode } from '../engine/evaluator';
import { renderCanvasScene } from '../engine/renderer';
import { Minus, Plus, Maximize2, Square } from 'lucide-react';

export const Canvas: React.FC = () => {
  const {
    rootFrame,
    nodes,
    nodeOrder,
    currentTime,
    selectedId,
    setSelectedId,
    zoom,
    setZoom,
    panX,
    panY,
    setPan,
    updateNode,
    showToast
  } = useStudioStore();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && (e.target as HTMLElement).tagName !== 'INPUT') {
        setIsSpacePressed(true);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  // Get evaluated state for all nodes at current time
  const evaluatedNodes = nodeOrder
    .map((id) => nodes[id])
    .filter(Boolean)
    .map((node) => evaluateNode(node, currentTime));

  // Render Loop on Canvas 2D
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = rootFrame.width * dpr;
    canvas.height = rootFrame.height * dpr;
    canvas.style.width = `${rootFrame.width}px`;
    canvas.style.height = `${rootFrame.height}px`;

    renderCanvasScene(ctx, rootFrame, evaluatedNodes, selectedId, dpr);
  }, [rootFrame, evaluatedNodes, selectedId, currentTime]);

  // Pan interaction with Space or Middle click
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || isSpacePressed || e.altKey) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panX, y: e.clientY - panY });
    } else {
      // Check click on canvas elements or select root frame
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const mouseX = (e.clientX - rect.left) / zoom;
        const mouseY = (e.clientY - rect.top) / zoom;

        // Check in reverse Z-order (topmost first)
        let clickedId: string | null = null;
        for (let i = evaluatedNodes.length - 1; i >= 0; i--) {
          const n = evaluatedNodes[i];
          if (
            mouseX >= n.x &&
            mouseX <= n.x + n.width &&
            mouseY >= n.y &&
            mouseY <= n.y + n.height
          ) {
            clickedId = n.id;
            break;
          }
        }

        if (clickedId) {
          setSelectedId(clickedId);
          initNodeDrag(e, clickedId);
        } else {
          setSelectedId('frame-1');
        }
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan(e.clientX - panStart.x, e.clientY - panStart.y);
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
      setZoom(zoom * zoomFactor);
    } else {
      setPan(panX - e.deltaX, panY - e.deltaY);
    }
  };

  const initNodeDrag = (startEvent: React.MouseEvent, nodeId: string) => {
    const node = nodes[nodeId];
    if (!node) return;

    const startClientX = startEvent.clientX;
    const startClientY = startEvent.clientY;
    const initialX = node.x;
    const initialY = node.y;

    const onMove = (moveEvent: MouseEvent) => {
      const dx = (moveEvent.clientX - startClientX) / zoom;
      const dy = (moveEvent.clientY - startClientY) / zoom;
      updateNode(nodeId, {
        x: Math.round(initialX + dx),
        y: Math.round(initialY + dy)
      });
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  return (
    <section
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      className={`flex-1 relative flex items-center justify-center overflow-hidden bg-[#f1f2f5] select-none ${
        isPanning ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
      }`}
    >
      {/* Canvas Label Badge */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
        <span
          onClick={() => setSelectedId('frame-1')}
          className="bg-blue-500 text-white text-xs px-3 py-1 rounded-md font-semibold shadow-sm flex items-center gap-1.5 cursor-pointer hover:bg-blue-600 transition-colors"
        >
          <Square className="w-3 h-3" /> {rootFrame.name}
        </span>
        {rootFrame.clipContent && (
          <span className="bg-blue-400 text-white text-[10px] px-2 py-1 rounded-md font-medium shadow-sm">
            Clip
          </span>
        )}
      </div>

      {/* Infinite Canvas Transform Container */}
      <div
        style={{
          transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
          transformOrigin: 'center center'
        }}
        className="transition-transform duration-75 ease-out flex items-center justify-center"
      >
        <div className="border-2 border-blue-400/80 shadow-md rounded-sm overflow-hidden bg-white">
          <canvas ref={canvasRef} className="block" />
        </div>
      </div>

      {/* Zoom Controls Bottom Left */}
      <div className="absolute bottom-5 left-5 bg-white/95 backdrop-blur-sm rounded-full shadow-md border border-gray-100 flex items-center px-2 py-1 z-20">
        <button
          title="Zoom Out (-)"
          onClick={() => setZoom(zoom - 0.1)}
          className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-blue-600 hover:bg-gray-50 rounded-full transition-colors"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button
          title="Reset to 100%"
          onClick={() => setZoom(1.0)}
          className="text-xs font-mono font-medium text-gray-700 px-2 min-w-[3.5rem] text-center hover:text-blue-600"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          title="Zoom In (+)"
          onClick={() => setZoom(zoom + 0.1)}
          className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-blue-600 hover:bg-gray-50 rounded-full transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
        <div className="w-[1px] h-4 bg-gray-200 mx-1" />
        <button
          title="Fit to Screen (56%)"
          onClick={() => {
            setZoom(0.56);
            setPan(0, 0);
            showToast('Canvas view reset');
          }}
          className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-blue-600 hover:bg-gray-50 rounded-full transition-colors"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </section>
  );
};
