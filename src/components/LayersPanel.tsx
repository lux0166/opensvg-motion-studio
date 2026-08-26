import React from 'react';
import { useStudioStore } from '../store/useStudioStore';
import { Square, Eye, EyeOff, Lock, Unlock, ChevronDown, Folder, Circle, Star, PenTool, Type } from 'lucide-react';
import { SceneNode } from '../engine/types';
import { getNodeChildren, getTopLevelNodes } from '../engine/hierarchy/sceneGraph';

export const LayersPanel: React.FC = () => {
  const {
    rootFrame,
    nodes,
    nodeOrder,
    selectedId,
    selectedIds,
    setSelectedId,
    toggleSelectId,
    updateNode,
    showToast
  } = useStudioStore();

  const getNodeIcon = (node: SceneNode, isSelected: boolean) => {
    if (node.type === 'group') return <Folder className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-amber-500'}`} />;
    if (node.type === 'circle') return <Circle className={`w-3 h-3 shrink-0 ${isSelected ? 'text-white' : 'text-emerald-500'}`} />;
    if (node.type === 'star') return <Star className={`w-3 h-3 shrink-0 ${isSelected ? 'text-white' : 'text-amber-400'}`} />;
    if (node.type === 'path') return <PenTool className={`w-3 h-3 shrink-0 ${isSelected ? 'text-white' : 'text-blue-500'}`} />;
    if (node.type === 'text') return <Type className={`w-3 h-3 shrink-0 ${isSelected ? 'text-white' : 'text-purple-500'}`} />;
    return (
      <div
        className="w-3 h-3 rounded-xs shrink-0 border border-black/10"
        style={{ backgroundColor: node.fill || '#111827' }}
      />
    );
  };

  const renderLayerRow = (id: string, depth = 0) => {
    const node = nodes[id];
    if (!node) return null;

    const isSelected = selectedIds.includes(id) || selectedId === id;
    const childIds = getNodeChildren(id, nodes, nodeOrder);

    return (
      <React.Fragment key={id}>
        <div
          style={{ paddingLeft: `${depth * 14 + 10}px` }}
          className={`flex items-center justify-between pr-2.5 py-1 rounded-lg transition-all text-xs ${
            isSelected
              ? 'bg-blue-500 text-white font-medium shadow-xs'
              : 'hover:bg-gray-100 hover:dark:bg-zinc-800/70 text-gray-700 dark:text-zinc-300'
          }`}
        >
          <button
            type="button"
            onClick={(e) => {
              if (e.shiftKey) {
                toggleSelectId(id, true);
              } else {
                setSelectedId(id);
              }
            }}
            className="flex items-center gap-2 truncate flex-1 text-left outline-none py-0.5 focus-visible:underline"
          >
            {getNodeIcon(node, isSelected)}
            <span className="truncate">{node.name}</span>
          </button>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              title={node.visible ? 'Hide' : 'Show'}
              aria-label={node.visible ? `Hide ${node.name}` : `Show ${node.name}`}
              onClick={(e) => {
                e.stopPropagation();
                updateNode(id, { visible: !node.visible });
                showToast(node.visible ? `Hidden ${node.name}` : `Shown ${node.name}`);
              }}
              className={`p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors ${
                isSelected ? 'text-white' : 'text-gray-400 dark:text-zinc-500 hover:text-gray-600 hover:dark:text-zinc-300'
              }`}
            >
              {node.visible ? (
                <Eye className="w-3 h-3" />
              ) : (
                <EyeOff className="w-3 h-3 text-red-400" />
              )}
            </button>

            <button
              type="button"
              title={node.locked ? 'Unlock' : 'Lock'}
              aria-label={node.locked ? `Unlock ${node.name}` : `Lock ${node.name}`}
              onClick={(e) => {
                e.stopPropagation();
                updateNode(id, { locked: !node.locked });
              }}
              className={`p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors ${
                isSelected ? 'text-white' : 'text-gray-400 dark:text-zinc-500 hover:text-gray-600 hover:dark:text-zinc-300'
              }`}
            >
              {node.locked ? (
                <Lock className="w-3 h-3 text-amber-300" />
              ) : (
                <Unlock className="w-3 h-3" />
              )}
            </button>
          </div>
        </div>

        {/* Recursive Arbitrary-Depth Children */}
        {childIds && childIds.length > 0 &&
          childIds.map((childId) => renderLayerRow(childId, depth + 1))}
      </React.Fragment>
    );
  };

  // Top-level nodes (nodes that have no parentId)
  const topLevelOrder = getTopLevelNodes(nodes, nodeOrder);

  return (
    <aside className="w-full h-full min-h-0 bg-white dark:bg-zinc-900 flex flex-col z-10 select-none overflow-hidden">
      {/* Layer List */}
      <div role="listbox" aria-label="Scene Layers" className="flex-1 min-h-0 overflow-y-auto p-2 flex flex-col gap-1">
        {/* Root Frame Item */}
        <div
          role="option"
          aria-selected={selectedId === rootFrame.id}
          tabIndex={0}
          onClick={() => setSelectedId(rootFrame.id)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setSelectedId(rootFrame.id);
            }
          }}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition-all text-xs outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
            selectedId === rootFrame.id
              ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold border border-blue-200 dark:border-blue-800'
              : 'hover:bg-gray-50 hover:dark:bg-zinc-800/60 text-gray-700 dark:text-zinc-300'
          }`}
        >
          <ChevronDown className="w-3 h-3 text-gray-400 dark:text-zinc-500" />
          <Square className="w-3.5 h-3.5 text-blue-500" />
          <span className="flex-1 truncate">{rootFrame.name}</span>
          <span className="text-xs text-gray-400 dark:text-zinc-500">{topLevelOrder.length}</span>
        </div>

        {/* Children Rows */}
        <div className="py-0.5 flex flex-col gap-1">
          {topLevelOrder.map((id) => renderLayerRow(id, 0))}
        </div>
      </div>
    </aside>
  );
};
