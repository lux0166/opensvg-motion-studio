import { OpenSVGWebRuntime } from '../../webRuntime/openSVGWebRuntime';
import { parseDocument } from '../../format/documentParser';

/**
 * Standard Web Component for OpenSVG Animation (<opensvg-animation>)
 * Allows universal usage in HTML:
 * <opensvg-animation src="button.osvg" autoplay></opensvg-animation>
 */
export class OpenSVGAnimationElement extends HTMLElement {
  private runtime: OpenSVGWebRuntime | null = null;
  private canvas: HTMLCanvasElement | null = null;

  static get observedAttributes(): string[] {
    return ['src', 'state', 'autoplay', 'loop'];
  }

  connectedCallback(): void {
    if (!this.canvas) {
      this.attachShadow({ mode: 'open' });
      this.canvas = document.createElement('canvas');
      this.canvas.style.width = '100%';
      this.canvas.style.height = '100%';
      this.canvas.style.display = 'block';

      this.shadowRoot?.appendChild(this.canvas);
    }

    const autoplay = this.hasAttribute('autoplay');
    const loopMode = this.getAttribute('loop') === 'once' ? 'once' : 'loop';

    this.runtime = new OpenSVGWebRuntime({ autoplay, loopMode });

    const src = this.getAttribute('src');
    if (src && this.canvas) {
      this.loadSrc(src);
    }
  }

  disconnectedCallback(): void {
    this.runtime?.unmount();
    this.runtime = null;
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (oldValue === newValue || !this.runtime) return;

    if (name === 'src' && newValue) {
      this.loadSrc(newValue);
    } else if (name === 'state' && newValue) {
      this.runtime.setState(newValue);
    }
  }

  private async loadSrc(src: string): Promise<void> {
    if (!this.runtime || !this.canvas) return;

    if (src.startsWith('{')) {
      // Inline JSON payload
      const doc = parseDocument(src);
      this.runtime.load(doc);
      await this.runtime.mount(this.canvas);
    } else {
      // Remote / Local URL fetch
      try {
        const res = await fetch(src);
        const json = await res.text();
        const doc = parseDocument(json);
        this.runtime.load(doc);
        await this.runtime.mount(this.canvas);
      } catch (err) {
        console.error(`Failed to load OpenSVG asset from ${src}:`, err);
      }
    }
  }

  // Public DOM methods
  public play(): void {
    this.runtime?.play();
  }

  public pause(): void {
    this.runtime?.pause();
  }

  public seek(time: number): void {
    this.runtime?.seek(time);
  }

  public setState(stateName: string): void {
    this.runtime?.setState(stateName);
  }

  public setBoolean(inputName: string, value: boolean): void {
    this.runtime?.setBoolean(inputName, value);
  }

  public setNumber(inputName: string, value: number): void {
    this.runtime?.setNumber(inputName, value);
  }

  public fireTrigger(inputName: string): void {
    this.runtime?.fireTrigger(inputName);
  }

  public getRuntime(): OpenSVGWebRuntime | null {
    return this.runtime;
  }
}

// Auto-register custom element in browser environment
if (typeof window !== 'undefined' && typeof customElements !== 'undefined') {
  if (!customElements.get('opensvg-animation')) {
    customElements.define('opensvg-animation', OpenSVGAnimationElement);
  }
}
