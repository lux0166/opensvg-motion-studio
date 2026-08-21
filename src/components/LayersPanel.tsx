import React from 'react';
import { useStudioStore } from '../store/useStudioStore';
import { Layers, Square, Eye, EyeOff, Lock, Unlock, ChevronDown } from 'lucide-react';

export const LayersPanel: React.FC = () => {
  const {
    rootFrame,
    nodes,
    nodeOrder,
    selectedId,
    setSelectedId,
    updateNode,
    showToast
  } = useStudioStore();

  return (
    <aside className="w-64 bg-white m-3 rounded-2xl shadow-sm border border-gray-100 flex flex-col z-10 select-none overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center font-semibold text-gray-800">
        <span className="flex items-center gap-2 text-xs">
          <Layers className="w-3.5 h-3.5 text-blue-500" /> Layers
        </span>
        <span className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
          {nodeOrder.length} items
        </span>
      </div>

      {/* Layer List */}
      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
        {/* Root Frame Item */}
        <div
          onClick={() => setSelectedId('frame-1')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition-all text-xs ${
            selectedId === 'frame-1'
              ? 'bg-blue-50 text-blue-600 font-semibold border border-blue-200'
              : 'hover:bg-gray-50 text-gray-700'
          }`}
        >
          <ChevronDown className="w-3 h-3 text-gray-400" />
          <Square className="w-3.5 h-3.5 text-blue-500" />
          <span className="flex-1 truncate">{rootFrame.name}</span>
          <span className="text-[10px] text-gray-400">{nodeOrder.length}</span>
        </div>

        {/* Children Rows */}
        <div className="pl-5 pr-1 py-0.5 flex flex-col gap-1">
          {nodeOrder.map((id) => {
            const node = nodes[id];
            if (!node) return null;

            const isSelected = selectedId === id;

            return (
              <div
                key={id}
                onClick={() => setSelectedId(id)}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition-all text-xs ${
                  isSelected
                    ? 'bg-blue-500 text-white font-medium shadow-xs'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2 truncate flex-1">
                  <div
                    className={`w-3 h-3 shrink-0 ${
                      node.type === 'circle' ? 'rounded-full' : 'rounded-xs'
                    }`}
                    style={{ backgroundColor: node.fill }}
                  />
                  <span className="truncate">{node.name}</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    title={node.visible ? 'Hide' : 'Show'}
                    onClick={(e) => {
                      e.stopPropagation();
                      updateNode(id, { visible: !node.visible });
                      showToast(node.visible ? `Hidden ${node.name}` : `Shown ${node.name}`);
                    }}
                    className={`p-1 rounded hover:bg-black/10 transition-colors ${
                      isSelected ? 'text-white' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {node.visible ? (
                      <Eye className="w-3 h-3" />
                    ) : (
                      <EyeOff className="w-3 h-3 text-red-400" />
                    )}
                  </button>

                  <button
                    title={node.locked ? 'Unlock' : 'Lock'}
                    onClick={(e) => {
                      e.stopPropagation();
                      updateNode(id, { locked: !node.locked });
                    }}
                    className={`p-1 rounded hover:bg-black/10 transition-colors ${
                      isSelected ? 'text-white' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {node.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3 opacity-0 group-hover:opacity-100" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
};
