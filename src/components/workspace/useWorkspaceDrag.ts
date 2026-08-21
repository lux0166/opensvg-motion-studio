import { useRef } from 'react';
import { useStudioStore } from '../../store/useStudioStore';
import { PanelId, SnapPosition, PANEL_CATALOG } from '../../engine/workspaceTypes';

export function useWorkspaceDrag() {
  const {
    activeDraggingPanel,
    dragHoverTarget,
    setDraggingPanel,
    setDragHoverTarget,
    movePanel,
    setActivePanelInContainer
  } = useStudioStore();

  const dragRef = useRef<{
    panelId: PanelId;
    sourceContainerId: string;
    startX: number;
    startY: number;
    hasMoved: boolean;
  } | null>(null);

  const handleTabPointerDown = (
    panelId: PanelId,
    sourceContainerId: string,
    e: React.PointerEvent
  ) => {
    // Only primary mouse button (left-click)
    if (e.button !== 0) return;

    const meta = PANEL_CATALOG[panelId] || { id: panelId, title: panelId, iconName: 'Layers' };
    const startX = e.clientX;
    const startY = e.clientY;

    dragRef.current = {
      panelId,
      sourceContainerId,
      startX,
      startY,
      hasMoved: false
    };

    const onPointerMove = (moveEv: PointerEvent) => {
      if (!dragRef.current) return;

      const deltaX = Math.abs(moveEv.clientX - startX);
      const deltaY = Math.abs(moveEv.clientY - startY);

      if (!dragRef.current.hasMoved && (deltaX > 4 || deltaY > 4)) {
        dragRef.current.hasMoved = true;
      }

      if (dragRef.current.hasMoved) {
        setDraggingPanel({
          panelId,
          sourceContainerId,
          title: meta.title,
          iconName: meta.iconName,
          currentX: moveEv.clientX,
          currentY: moveEv.clientY
        });

        // Hit-test dock containers on screen
        const containerEls = document.querySelectorAll<HTMLElement>('.dock-container[data-container-id]');
        let foundTarget = false;

        for (const el of Array.from(containerEls)) {
          const rect = el.getBoundingClientRect();
          const targetId = el.getAttribute('data-container-id');

          if (
            targetId &&
            moveEv.clientX >= rect.left &&
            moveEv.clientX <= rect.right &&
            moveEv.clientY >= rect.top &&
            moveEv.clientY <= rect.bottom
          ) {
            const relX = (moveEv.clientX - rect.left) / rect.width;
            const relY = (moveEv.clientY - rect.top) / rect.height;

            let pos: SnapPosition = 'tab';
            if (relY < 0.22) {
              pos = 'top';
            } else if (relY > 0.78) {
              pos = 'bottom';
            } else if (relX < 0.22) {
              pos = 'left';
            } else if (relX > 0.78) {
              pos = 'right';
            } else {
              pos = 'tab';
            }

            setDragHoverTarget({
              containerId: targetId,
              position: pos,
              rect: {
                left: rect.left,
                top: rect.top,
                width: rect.width,
                height: rect.height
              }
            });
            foundTarget = true;
            break;
          }
        }

        if (!foundTarget) {
          setDragHoverTarget(null);
        }
      }
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);

      const dragInfo = dragRef.current;
      const currentHover = useStudioStore.getState().dragHoverTarget;

      if (dragInfo) {
        if (dragInfo.hasMoved && currentHover) {
          movePanel(
            dragInfo.sourceContainerId,
            currentHover.containerId,
            currentHover.position,
            dragInfo.panelId
          );
        } else if (!dragInfo.hasMoved) {
          // Pure tab click
          setActivePanelInContainer(dragInfo.sourceContainerId, dragInfo.panelId);
        }
      }

      dragRef.current = null;
      setDraggingPanel(null);
      setDragHoverTarget(null);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  return {
    activeDraggingPanel,
    dragHoverTarget,
    handleTabPointerDown
  };
}
