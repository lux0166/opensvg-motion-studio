import React from 'react';

interface SplitterProps {
  direction: 'horizontal' | 'vertical';
  onResize: (stepDeltaPx: number) => void;
  className?: string;
  valueNow?: number;
  valueMin?: number;
  valueMax?: number;
}

export const Splitter: React.FC<SplitterProps> = ({
  direction,
  onResize,
  className = '',
  valueNow = 50,
  valueMin = 15,
  valueMax = 85
}) => {
  const isHorizontal = direction === 'horizontal';

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();

    let lastX = e.clientX;
    let lastY = e.clientY;

    // Lock cursor and prevent text selection during resizing
    document.body.style.userSelect = 'none';
    document.body.style.cursor = isHorizontal ? 'col-resize' : 'row-resize';

    const onPointerMove = (moveEv: PointerEvent) => {
      const stepDeltaX = moveEv.clientX - lastX;
      const stepDeltaY = moveEv.clientY - lastY;
      lastX = moveEv.clientX;
      lastY = moveEv.clientY;

      if (isHorizontal) {
        if (stepDeltaX !== 0) onResize(stepDeltaX);
      } else {
        if (stepDeltaY !== 0) onResize(stepDeltaY);
      }
    };

    const onPointerUp = () => {
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 20 : 5;
    if (isHorizontal) {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onResize(-step);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        onResize(step);
      }
    } else {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        onResize(-step);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        onResize(step);
      }
    }
  };

  return (
    <div
      role="separator"
      tabIndex={0}
      aria-orientation={isHorizontal ? 'vertical' : 'horizontal'}
      aria-valuenow={valueNow}
      aria-valuemin={valueMin}
      aria-valuemax={valueMax}
      aria-label={`Resize workspace panel ${isHorizontal ? 'width' : 'height'}`}
      onPointerDown={handlePointerDown}
      onKeyDown={handleKeyDown}
      className={`group relative z-30 flex items-center justify-center transition-colors motion-reduce:transition-none select-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-full ${
        isHorizontal
          ? 'w-2 cursor-col-resize hover:bg-blue-500/40 active:bg-blue-600 touch-pan-y'
          : 'h-2 cursor-row-resize hover:bg-blue-500/40 active:bg-blue-600 touch-pan-x'
      } ${className}`}
    >
      <div
        className={`rounded-full transition-opacity motion-reduce:transition-none opacity-40 group-hover:opacity-100 group-focus-visible:opacity-100 group-active:opacity-100 bg-slate-300 dark:bg-zinc-700 group-hover:bg-blue-500 ${
          isHorizontal ? 'w-1 h-8 shadow-sm' : 'h-1 w-8 shadow-sm'
        }`}
      />
    </div>
  );
};
