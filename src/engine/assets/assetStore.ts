import { AssetManifestEntry } from '../format/nativeDocument';

export type AssetStatus = 'unloaded' | 'loading' | 'ready' | 'error';

export interface RuntimeAsset {
  manifest: AssetManifestEntry;
  status: AssetStatus;
  dataUrl?: string;
  resolvedUrl?: string;
  nativeImage?: any;
  error?: string;
}

/**
 * OpenSVG Runtime Asset Store & Resolution Subsystem
 * Standardized per P0-2 Asset Runtime Contract
 * INVARIANT: Canonical asset resolution across embedded dataUrl, relative paths, and CDN URLs with strict failure semantics.
 */
export class AssetStore {
  private assets: Map<string, RuntimeAsset> = new Map();

  /**
   * Loads or replaces the asset manifest from an OpenSVGDocument
   */
  public loadManifest(manifest?: Record<string, AssetManifestEntry>): void {
    this.assets.clear();
    if (!manifest) return;

    for (const [id, entry] of Object.entries(manifest)) {
      this.registerAsset(entry, id);
    }
  }

  /**
   * Registers a single asset entry into the store
   */
  public registerAsset(entry: AssetManifestEntry, aliasId?: string): void {
    const id = aliasId || entry.id;
    const resolvedUrl = entry.dataUrl || entry.url || '';
    const status: AssetStatus = entry.dataUrl ? 'ready' : (entry.url ? 'unloaded' : 'error');

    this.assets.set(id, {
      manifest: { ...entry, id },
      status,
      dataUrl: entry.dataUrl,
      resolvedUrl,
      error: !resolvedUrl ? 'Asset missing dataUrl and url source.' : undefined
    });
  }

  /**
   * Gets a runtime asset entry by ID
   */
  public getAsset(id: string): RuntimeAsset | undefined {
    return this.assets.get(id);
  }

  /**
   * Resolves the usable source URL / dataUrl for a given asset ID
   */
  public resolveSource(id: string): string | undefined {
    const asset = this.assets.get(id);
    return asset?.dataUrl || asset?.resolvedUrl;
  }

  /**
   * Returns all registered assets
   */
  public getAllAssets(): RuntimeAsset[] {
    return Array.from(this.assets.values());
  }

  /**
   * Returns the count of registered assets
   */
  public get size(): number {
    return this.assets.size;
  }

  /**
   * Clears the asset store
   */
  public clear(): void {
    this.assets.clear();
  }
}
