import { SceneNode } from '../types';

/**
 * OpenSVG Component / Instance System
 * Adheres strictly to CORE_ENGINE_DEPTH.md (Section 10) & RUNTIME_FOUNDATION_IMPLEMENTATION_PLAN.md (CORE-08)
 * INVARIANT: Component definitions are canonical single sources of truth. Instances reflect master updates while preserving isolated local overrides.
 */

export interface ComponentPropertyDef {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'color';
  defaultValue: any;
  nodeId?: string; // target node within component tree
  propertyKey: string; // target property (e.g. 'fill', 'text', 'opacity')
}

export interface ComponentDefinition {
  id: string;
  name: string;
  rootNode: SceneNode;
  childNodes?: SceneNode[];
  exposedProperties?: ComponentPropertyDef[];
}

export interface ComponentInstance {
  id: string;
  name: string;
  componentDefId: string;
  x: number;
  y: number;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
  opacity?: number;
  overrides: Record<string, any>; // propertyKey -> overridden value
  runtimeState?: Record<string, any>;
}

export class ComponentRegistry {
  private definitions: Map<string, ComponentDefinition> = new Map();

  public register(def: ComponentDefinition): void {
    this.definitions.set(def.id, JSON.parse(JSON.stringify(def)));
  }

  public get(defId: string): ComponentDefinition | undefined {
    return this.definitions.get(defId);
  }

  public updateDefinition(defId: string, updater: (def: ComponentDefinition) => void): void {
    const def = this.definitions.get(defId);
    if (!def) return;
    updater(def);
  }

  /**
   * Instantiates a component definition with optional initial overrides
   */
  public instantiate(
    defId: string,
    instanceId: string,
    instanceName: string,
    position: { x: number; y: number },
    overrides: Record<string, any> = {}
  ): ComponentInstance {
    const def = this.definitions.get(defId);
    if (!def) {
      throw new Error(`Cannot instantiate unknown component definition: ${defId}`);
    }

    return {
      id: instanceId,
      name: instanceName,
      componentDefId: defId,
      x: position.x,
      y: position.y,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      opacity: 1,
      overrides: { ...overrides },
      runtimeState: {}
    };
  }

  /**
   * Resolves a ComponentInstance into a fully realized SceneNode hierarchy,
   * propagating definition changes while strictly respecting local overrides (Rule CORE-08)
   */
  public resolveInstance(instance: ComponentInstance): SceneNode {
    const def = this.definitions.get(instance.componentDefId);
    if (!def) {
      throw new Error(`Component definition not found for instance: ${instance.id}`);
    }

    const resolved: SceneNode = JSON.parse(JSON.stringify(def.rootNode));
    resolved.id = instance.id;
    resolved.name = instance.name;
    resolved.x = instance.x;
    resolved.y = instance.y;
    if (instance.rotation !== undefined) resolved.rotation = instance.rotation;
    if (instance.scaleX !== undefined) resolved.scaleX = instance.scaleX;
    if (instance.scaleY !== undefined) resolved.scaleY = instance.scaleY;
    if (instance.opacity !== undefined) resolved.opacity = instance.opacity;

    // Apply local property overrides
    for (const [key, val] of Object.entries(instance.overrides)) {
      if (val !== undefined && !key.includes('.')) {
        (resolved as any)[key] = val;
      }
    }

    return resolved;
  }

  /**
   * Resolves a ComponentInstance into its full node hierarchy including child nodes (Rule CORE-08)
   */
  public resolveInstanceHierarchy(instance: ComponentInstance): SceneNode[] {
    const root = this.resolveInstance(instance);
    const def = this.definitions.get(instance.componentDefId);
    if (!def || !def.childNodes || def.childNodes.length === 0) {
      return [root];
    }

    const resolvedChildren: SceneNode[] = def.childNodes.map((child, idx) => {
      const childClone: SceneNode = JSON.parse(JSON.stringify(child));
      childClone.id = `${instance.id}-child-${child.id || idx}`;
      childClone.parentId = instance.id;

      // Apply child-targeted overrides
      const childOverrideKey = child.id;
      if (instance.overrides[childOverrideKey] && typeof instance.overrides[childOverrideKey] === 'object') {
        Object.assign(childClone, instance.overrides[childOverrideKey]);
      }
      for (const [key, val] of Object.entries(instance.overrides)) {
        if (key.startsWith(`${child.id}.`)) {
          const propName = key.split('.')[1];
          (childClone as any)[propName] = val;
        }
      }

      return childClone;
    });

    return [root, ...resolvedChildren];
  }
}
