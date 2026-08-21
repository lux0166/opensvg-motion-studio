import React, { useRef, useEffect, useState } from 'react';
import { useStudioStore } from '../store/useStudioStore';
import { evaluateNode } from '../engine/evaluator';
import { renderCanvasScene, MarqueeRect } from '../engine/renderer';
import { computeSnapping } from '../engine/snapping';
import { importSvgString } from '../engine/svgImporter';
import { handleNodeTriggerEvent } from '../engine/stateMachine';
import { Minus, Plus, Maximize2, Square, UploadCloud } from 'lucide-react';

export const Canvas: React.FC = () => {
  const {
    rootFrame,
    nodes,
    nodeOrder,
    isPlaying,
    setPlaying,
    currentTime,
    setCurrentTime,
    selectedId,
    selectedIds,
    setSelectedId,
    setSelectedIds,
    toggleSelectId,
    selectedTool,
    setSelectedTool,
    selectedPointIndex,
    setSelectedPointIndex,
    activeSnapLines,
    setActiveSnapLines,
    pushSnapshot,
    zoom,
    setZoom,
    panX,
    panY,
    setPan,
    updateNode,
    addNode,
    addPathPoint,
    updatePathPoint,
    showToast
  } = useStudioStore();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [marqueeRect, setMarqueeRect] = useState<MarqueeRect | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

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

    renderCanvasScene(
      ctx,
      rootFrame,
      evaluatedNodes,
      selectedId,
      selectedTool,
      selectedPointIndex,
      dpr,
      activeSnapLines,
      selectedIds,
      marqueeRect
    );
  }, [
    rootFrame,
    evaluatedNodes,
    selectedId,
    selectedIds,
    selectedTool,
    selectedPointIndex,
    activeSnapLines,
    marqueeRect,
    currentTime
  ]);

  // Main Canvas Pointer Event Handler
  const handleMouseDown = (e: React.MouseEvent) => {
    // 1. Space Pan or Middle Mouse
    if (e.button === 1 || isSpacePressed || e.altKey || selectedTool === 'hand') {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panX, y: e.clientY - panY });
      return;
    }

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = Math.round((e.clientX - rect.left) / zoom);
    const mouseY = Math.round((e.clientY - rect.top) / zoom);

    // 2. Text Tool (T)
    if (selectedTool === 'text') {
      const newTextId = `text-${Date.now()}`;
      addNode({
        id: newTextId,
        name: 'Typography',
        type: 'text',
        visible: true,
        locked: false,
        x: mouseX,
        y: mouseY,
        width: 220,
        height: 48,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        borderRadius: 0,
        fill: '#111827',
        textContent: 'Type something...',
        fontSize: 28,
        fontWeight: 600,
        fontFamily: 'Inter, sans-serif',
        textAlign: 'left',
        tracks: []
      });
      setSelectedId(newTextId);
      setSelectedTool('select');
      setEditingTextId(newTextId);
      showToast('Created text layer');
      return;
    }

    // 3. Vector Pen Tool
    if (selectedTool === 'pen') {
      handlePenToolClick(mouseX, mouseY, e);
      return;
    }

    // 3. Direct Select Tool (A) for Path Points
    if (selectedTool === 'direct-select' && selectedId && nodes[selectedId]?.type === 'path') {
      const pathNode = nodes[selectedId];
      if (pathNode.pathPoints) {
        for (let i = 0; i < pathNode.pathPoints.length; i++) {
          const pt = pathNode.pathPoints[i];
          const px = pt.x + pathNode.x;
          const py = pt.y + pathNode.y;
          if (Math.hypot(mouseX - px, mouseY - py) < 10) {
            setSelectedPointIndex(i);
            initAnchorDrag(e, selectedId, i, pt);
            return;
          }
        }
      }
    }

    // 4. Check Selection Handles (Rotate, Resize) on currently selected node
    if (selectedId && selectedId !== 'frame-1') {
      const selectedNode = nodes[selectedId];
      if (selectedNode) {
        const handleType = getHandleUnderMouse(mouseX, mouseY, selectedNode);
        if (handleType === 'rotate') {
          initRotateDrag(e, selectedNode);
          return;
        } else if (handleType && handleType !== 'none') {
          initResizeDrag(e, selectedNode, handleType);
          return;
        }
      }
    }

    // 5. Hit Test Nodes on Canvas
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
      // Execute Interactive Triggers
      if (nodes[clickedId]) {
        handleNodeTriggerEvent(nodes[clickedId], 'onClick', {
          setCurrentTime,
          setPlaying,
          updateNode,
          showToast,
          isPlaying
        });
      }

      if (e.shiftKey) {
        toggleSelectId(clickedId, true);
      } else {
        if (!selectedIds.includes(clickedId)) {
          setSelectedId(clickedId);
        }
      }
      initNodeDrag(e, clickedId);
    } else {
      if (!e.shiftKey) {
        setSelectedId('frame-1');
        setSelectedPointIndex(null);
      }
      // Activate Marquee Drag Selection
      initMarqueeDrag(e, mouseX, mouseY);
    }
  };

  const initMarqueeDrag = (_startEvent: React.MouseEvent, startX: number, startY: number) => {
    const onMove = (moveEvent: MouseEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const currentX = Math.round((moveEvent.clientX - rect.left) / zoom);
      const currentY = Math.round((moveEvent.clientY - rect.top) / zoom);

      const mRect: MarqueeRect = { x1: startX, y1: startY, x2: currentX, y2: currentY };
      setMarqueeRect(mRect);

      const minX = Math.min(startX, currentX);
      const maxX = Math.max(startX, currentX);
      const minY = Math.min(startY, currentY);
      const maxY = Math.max(startY, currentY);

      const matchedIds: string[] = [];
      for (const node of evaluatedNodes) {
        if (!node.visible) continue;
        const inBox =
          !(node.x > maxX || node.x + node.width < minX || node.y > maxY || node.y + node.height < minY);
        if (inBox) {
          matchedIds.push(node.id);
        }
      }
      if (matchedIds.length > 0) {
        setSelectedIds(matchedIds);
      }
    };

    const onUp = () => {
      setMarqueeRect(null);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const handlePenToolClick = (x: number, y: number, startEvent: React.MouseEvent) => {
    let targetNodeId = selectedId;
    if (!targetNodeId || !nodes[targetNodeId] || nodes[targetNodeId].type !== 'path') {
      const newPathId = `path-${Date.now()}`;
      addNode({
        id: newPathId,
        name: 'Vector Path',
        type: 'path',
        visible: true,
        locked: false,
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        borderRadius: 0,
        fill: '#3b82f6',
        stroke: '#1d4ed8',
        strokeWidth: 2,
        pathPoints: [],
        tracks: []
      });
      targetNodeId = newPathId;
      setSelectedId(newPathId);
    }

    const currentPoints = nodes[targetNodeId]?.pathPoints || [];
    const newPointIndex = currentPoints.length;
    const newPoint = { x, y, type: 'cubic' as const };
    addPathPoint(targetNodeId, newPoint);
    setSelectedPointIndex(newPointIndex);
    showToast('Added anchor point (P)');

    const startClientX = startEvent.clientX;
    const startClientY = startEvent.clientY;

    const onMove = (moveEvent: MouseEvent) => {
      const dx = (moveEvent.clientX - startClientX) / zoom;
      const dy = (moveEvent.clientY - startClientY) / zoom;

      updatePathPoint(targetNodeId!, newPointIndex, {
        cp1x: x - dx,
        cp1y: y - dy,
        cp2x: x + dx,
        cp2y: y + dy
      });
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const initAnchorDrag = (startEvent: React.MouseEvent, nodeId: string, pointIndex: number, startPt: any) => {
    const startClientX = startEvent.clientX;
    const startClientY = startEvent.clientY;
    const initialX = startPt.x;
    const initialY = startPt.y;

    const onMove = (moveEvent: MouseEvent) => {
      const dx = (moveEvent.clientX - startClientX) / zoom;
      const dy = (moveEvent.clientY - startClientY) / zoom;

      updatePathPoint(nodeId, pointIndex, {
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

  const getHandleUnderMouse = (mouseX: number, mouseY: number, node: any): string => {
    const { x, y, width, height } = node;
    const thresh = 8;

    if (Math.hypot(mouseX - (x + width / 2), mouseY - (y - 20)) < thresh) return 'rotate';
    if (Math.hypot(mouseX - x, mouseY - y) < thresh) return 'nw';
    if (Math.hypot(mouseX - (x + width), mouseY - y) < thresh) return 'ne';
    if (Math.hypot(mouseX - (x + width), mouseY - (y + height)) < thresh) return 'se';
    if (Math.hypot(mouseX - x, mouseY - (y + height)) < thresh) return 'sw';
    if (Math.hypot(mouseX - (x + width / 2), mouseY - y) < thresh) return 'n';
    if (Math.hypot(mouseX - (x + width / 2), mouseY - (y + height)) < thresh) return 's';
    if (Math.hypot(mouseX - (x + width), mouseY - (y + height / 2)) < thresh) return 'e';
    if (Math.hypot(mouseX - x, mouseY - (y + height / 2)) < thresh) return 'w';

    return 'none';
  };

  const initRotateDrag = (_startEvent: React.MouseEvent, node: any) => {
    const cx = node.x + node.width / 2;
    const cy = node.y + node.height / 2;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    pushSnapshot();

    const onMove = (moveEvent: MouseEvent) => {
      const mouseX = (moveEvent.clientX - rect.left) / zoom;
      const mouseY = (moveEvent.clientY - rect.top) / zoom;
      const rad = Math.atan2(mouseY - cy, mouseX - cx);
      let deg = Math.round((rad * 180) / Math.PI) + 90;
      if (deg < 0) deg += 360;

      updateNode(node.id, { rotation: deg });
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const initResizeDrag = (startEvent: React.MouseEvent, node: any, handleType: string) => {
    const startClientX = startEvent.clientX;
    const startClientY = startEvent.clientY;
    const { x, y, width, height } = node;

    pushSnapshot();

    const onMove = (moveEvent: MouseEvent) => {
      const dx = (moveEvent.clientX - startClientX) / zoom;
      const dy = (moveEvent.clientY - startClientY) / zoom;

      let newX = x;
      let newY = y;
      let newW = width;
      let newH = height;

      if (handleType.includes('e')) newW = Math.max(10, Math.round(width + dx));
      if (handleType.includes('s')) newH = Math.max(10, Math.round(height + dy));
      if (handleType.includes('w')) {
        const potentialW = Math.max(10, Math.round(width - dx));
        newX = Math.round(x + (width - potentialW));
        newW = potentialW;
      }
      if (handleType.includes('n')) {
        const potentialH = Math.max(10, Math.round(height - dy));
        newY = Math.round(y + (height - potentialH));
        newH = potentialH;
      }

      updateNode(node.id, { x: newX, y: newY, width: newW, height: newH });
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
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

  const initNodeDrag = (startEvent: React.MouseEvent, primaryNodeId: string) => {
    const primaryNode = nodes[primaryNodeId];
    if (!primaryNode) return;

    const startClientX = startEvent.clientX;
    const startClientY = startEvent.clientY;

    // Collect all dragged nodes (if multi-selected)
    const activeDragIds =
      selectedIds.includes(primaryNodeId) && selectedIds.length > 1
        ? selectedIds.filter((id) => nodes[id])
        : [primaryNodeId];

    const initialPositions = activeDragIds.map((id) => ({
      id,
      x: nodes[id].x,
      y: nodes[id].y
    }));

    const initialPrimaryX = primaryNode.x;
    const initialPrimaryY = primaryNode.y;

    pushSnapshot();

    const onMove = (moveEvent: MouseEvent) => {
      const dx = (moveEvent.clientX - startClientX) / zoom;
      const dy = (moveEvent.clientY - startClientY) / zoom;
      const rawX = Math.round(initialPrimaryX + dx);
      const rawY = Math.round(initialPrimaryY + dy);

      const snapping = computeSnapping(
        primaryNodeId,
        rawX,
        rawY,
        primaryNode.width,
        primaryNode.height,
        rootFrame,
        evaluatedNodes.filter((n) => !activeDragIds.includes(n.id))
      );

      setActiveSnapLines(snapping.snapLines);

      const deltaX = snapping.x - initialPrimaryX;
      const deltaY = snapping.y - initialPrimaryY;

      for (const pos of initialPositions) {
        updateNode(pos.id, {
          x: Math.round(pos.x + deltaX),
          y: Math.round(pos.y + deltaY)
        });
      }
    };

    const onUp = () => {
      setActiveSnapLines([]);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mouseX = Math.round((e.clientX - rect.left) / zoom);
    const mouseY = Math.round((e.clientY - rect.top) / zoom);

    for (let i = evaluatedNodes.length - 1; i >= 0; i--) {
      const n = evaluatedNodes[i];
      if (
        n.type === 'text' &&
        mouseX >= n.x &&
        mouseX <= n.x + n.width &&
        mouseY >= n.y &&
        mouseY <= n.y + n.height
      ) {
        setEditingTextId(n.id);
        setSelectedId(n.id);
        return;
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.svg') || file.type === 'image/svg+xml') {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const svgContent = ev.target?.result as string;
          if (svgContent) {
            try {
              const { nodes: imported } = importSvgString(svgContent);
              if (imported.length > 0) {
                for (const node of imported) {
                  addNode(node);
                }
                setSelectedIds(imported.map((n) => n.id));
                setSelectedId(imported[0].id);
                showToast(`Imported ${imported.length} vector elements from ${file.name}`);
              }
            } catch (err) {
              showToast('Failed to parse SVG file', 'error');
            }
          }
        };
        reader.readAsText(file);
      }
    }
  };

  return (
    <section
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        setIsDraggingFile(true);
      }}
      onDragLeave={() => setIsDraggingFile(false)}
      onDrop={handleDrop}
      className={`flex-1 relative flex items-center justify-center overflow-hidden bg-[#f1f2f5] select-none ${
        isPanning || isSpacePressed ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
      }`}
    >
      {/* Drag & Drop Visual Dropzone Overlay */}
      {isDraggingFile && (
        <div className="absolute inset-6 z-50 bg-blue-500/10 backdrop-blur-xs border-2 border-dashed border-blue-500 rounded-3xl flex flex-col items-center justify-center text-blue-600 gap-3 pointer-events-none shadow-2xl">
          <UploadCloud className="w-12 h-12 animate-bounce text-blue-500" />
          <div className="text-sm font-bold text-blue-700">Drop SVG file here to import layers</div>
          <div className="text-xs text-blue-500">Vector paths, rects, circles and texts will be imported</div>
        </div>
      )}

      <div
        className="relative transition-transform duration-75 origin-center"
        style={{
          transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
          width: `${rootFrame.width}px`,
          height: `${rootFrame.height}px`
        }}
      >
        {/* Canvas Frame Label */}
        <div className="absolute -top-7 left-0 text-xs font-semibold text-gray-600 flex items-center gap-2">
          <Square className="w-3.5 h-3.5 text-blue-500" />
          <span>{rootFrame.name}</span>
          <span className="text-[10px] text-gray-400 font-mono">
            {rootFrame.width} × {rootFrame.height}
          </span>
        </div>

        {/* 2D Vector Canvas */}
        <canvas
          ref={canvasRef}
          className="rounded-2xl shadow-xl border border-gray-200/80 bg-white"
        />

        {/* In-Place Live Text Editor */}
        {editingTextId && nodes[editingTextId] && (
          <input
            autoFocus
            type="text"
            value={nodes[editingTextId].textContent || ''}
            onChange={(e) => updateNode(editingTextId, { textContent: e.target.value })}
            onBlur={() => setEditingTextId(null)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === 'Escape') {
                setEditingTextId(null);
              }
            }}
            className="absolute z-30 bg-white/95 border-2 border-blue-500 rounded-lg px-2 py-1 shadow-lg text-gray-900 outline-none"
            style={{
              left: `${nodes[editingTextId].x}px`,
              top: `${nodes[editingTextId].y}px`,
              fontSize: `${nodes[editingTextId].fontSize || 28}px`,
              fontWeight: nodes[editingTextId].fontWeight || 600,
              fontFamily: nodes[editingTextId].fontFamily || 'Inter, sans-serif',
              minWidth: '160px'
            }}
          />
        )}
      </div>

      {/* Floating Canvas Controls */}
      <div className="absolute bottom-5 right-5 flex items-center gap-1 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-md border border-gray-200 text-xs font-medium text-gray-700">
        <button
          title="Zoom Out"
          onClick={() => setZoom(zoom * 0.9)}
          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <span className="w-12 text-center font-mono font-bold text-gray-800">
          {Math.round(zoom * 100)}%
        </span>
        <button
          title="Zoom In"
          onClick={() => setZoom(zoom * 1.1)}
          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
        <div className="w-[1px] h-4 bg-gray-200 mx-1" />
        <button
          title="Fit Viewport"
          onClick={() => {
            setZoom(0.56);
            setPan(0, 0);
          }}
          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </section>
  );
};
