import { SceneNode } from '../types';

/**
 * OpenSVG Data Binding Engine v1
 * Adheres strictly to CORE_ENGINE_DEPTH.md (Section 11) & RUNTIME_FOUNDATION_IMPLEMENTATION_PLAN.md (CORE-09)
 * INVARIANT: Headless runtime data-binding evaluation. Zero React-only convention dependencies.
 */

export type DataBindingDataType = 'boolean' | 'number' | 'string' | 'color' | 'enum' | 'trigger';

export interface DataBinding {
  id: string;
  sourcePath: string; // e.g. 'ViewModel.progress' or 'user.level'
  targetNodeId: string;
  targetProperty: string; // e.g. 'opacity', 'fill', 'text', 'scaleX'
  dataType?: DataBindingDataType;
  converter?: (sourceValue: any) => any;
}

export class DataBindingEngine {
  private bindings: Map<string, DataBinding> = new Map();
  private sourceValues: Map<string, any> = new Map();

  public registerBinding(binding: DataBinding): void {
    this.bindings.set(binding.id, { ...binding });
  }

  public unregisterBinding(bindingId: string): void {
    this.bindings.delete(bindingId);
  }

  public setSourceValue(sourcePath: string, value: any): void {
    this.sourceValues.set(sourcePath, value);
  }

  public getSourceValue(sourcePath: string): any {
    return this.sourceValues.get(sourcePath);
  }

  public clear(): void {
    this.bindings.clear();
    this.sourceValues.clear();
  }

  /**
   * Evaluates all active bindings against a node map and returns calculated delta updates (Rule CORE-09)
   */
  public evaluateBindings(nodes: Record<string, SceneNode>): Record<string, Partial<SceneNode>> {
    const updates: Record<string, Partial<SceneNode>> = {};

    for (const binding of this.bindings.values()) {
      const node = nodes[binding.targetNodeId];
      if (!node) continue;

      const rawVal = this.sourceValues.get(binding.sourcePath);
      if (rawVal === undefined) continue;

      let finalVal = rawVal;
      if (binding.converter && typeof binding.converter === 'function') {
        try {
          finalVal = binding.converter(rawVal);
        } catch (err) {
          console.error(`DataBinding converter error for ${binding.id}:`, err);
          continue;
        }
      }

      if (!updates[binding.targetNodeId]) {
        updates[binding.targetNodeId] = {};
      }

      (updates[binding.targetNodeId] as any)[binding.targetProperty] = finalVal;
    }

    return updates;
  }
}
