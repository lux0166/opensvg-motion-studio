import React from 'react';
import { useStudioStore } from '../../store/useStudioStore';
import { Palette, Check } from 'lucide-react';
import { generateColorHarmonies, ColorHarmonies } from '../../engine/colorHarmony';

type HarmonyName = keyof ColorHarmonies;

export const ColorHarmonyPanel: React.FC = () => {
  const { selectedId, selectedIds, nodes, updateNode, showToast } = useStudioStore();

  const activeNode = selectedId ? nodes[selectedId] : null;
  const baseColor = activeNode?.fill || '#3b82f6';

  const harmonyTypes: HarmonyName[] = ['complementary', 'analogous', 'triadic', 'tetradic', 'monochromatic'];
  const harmonies = generateColorHarmonies(baseColor);

  const applyColor = (hex: string) => {
    const targets = selectedIds.length > 0 ? selectedIds : selectedId ? [selectedId] : [];
    if (targets.length === 0) {
      showToast('Select an element to apply color', 'info');
      return;
    }

    for (const id of targets) {
      updateNode(id, { fill: hex });
    }
    showToast(`Applied color ${hex}`, 'success');
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col p-3 overflow-y-auto bg-white dark:bg-zinc-900 text-xs gap-3">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
          <Palette className="w-3.5 h-3.5 text-blue-500" />
          Color Harmonies
        </span>
        <span className="text-[10px] font-mono text-slate-400">
          Base: {baseColor}
        </span>
      </div>

      <div className="flex flex-col gap-2.5">
        {harmonyTypes.map((type) => {
          const colors: string[] = harmonies[type] || [];
          return (
            <div
              key={type}
              className="p-2 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/80 dark:border-zinc-800 flex flex-col gap-1.5"
            >
              <div className="flex items-center justify-between text-[11px]">
                <span className="capitalize font-medium text-slate-700 dark:text-zinc-300">{type}</span>
              </div>

              <div className="flex items-center gap-1.5">
                {colors.map((hex: string, idx: number) => (
                  <button
                    key={`${type}-${idx}-${hex}`}
                    type="button"
                    onClick={() => applyColor(hex)}
                    style={{ backgroundColor: hex }}
                    title={`Apply ${hex}`}
                    className="flex-1 h-6 rounded-lg border border-black/10 shadow-2xs hover:scale-110 active:scale-95 transition-transform flex items-center justify-center"
                  >
                    {activeNode?.fill?.toLowerCase() === hex.toLowerCase() && (
                      <Check className="w-3 h-3 text-white drop-shadow-md" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

