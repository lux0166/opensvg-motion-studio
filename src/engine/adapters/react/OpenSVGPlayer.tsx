import React, { useEffect, useRef } from 'react';
import { OpenSVGWebRuntime, WebRuntimeOptions } from '../../webRuntime/openSVGWebRuntime';
import { OpenSVGDocument } from '../../format/nativeDocument';

export interface OpenSVGPlayerProps extends WebRuntimeOptions {
  src: OpenSVGDocument | string;
  state?: string;
  inputs?: Record<string, boolean | number>;
  bindingValues?: Record<string, any>;
  className?: string;
  style?: React.CSSProperties;
  onEvent?: (eventType: string, payload: any) => void;
}

/**
 * OpenSVG Player Component for React (Standardized per Section 14)
 * Allows developers to consume interactive OpenSVG animations with declarative props.
 */
export const OpenSVGPlayer: React.FC<OpenSVGPlayerProps> = ({
  src,
  state,
  inputs,
  bindingValues,
  autoplay = true,
  loopMode = 'loop',
  dpr,
  interactive = true,
  className,
  style,
  onEvent
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const runtimeRef = useRef<OpenSVGWebRuntime | null>(null);

  useEffect(() => {
    const runtime = new OpenSVGWebRuntime({ autoplay, loopMode, dpr, interactive });
    runtimeRef.current = runtime;

    let unsubscribeEvent: (() => void) | undefined;
    if (onEvent) {
      unsubscribeEvent = runtime.addEventListener(onEvent);
    }

    if (canvasRef.current) {
      runtime.load(src);
      runtime.mount(canvasRef.current);
    }

    return () => {
      unsubscribeEvent?.();
      runtime.unmount();
      runtimeRef.current = null;
    };
  }, [src, autoplay, loopMode, dpr, interactive]);

  // Update State dynamically
  useEffect(() => {
    if (state && runtimeRef.current) {
      runtimeRef.current.setState(state);
    }
  }, [state]);

  // Update Inputs dynamically
  useEffect(() => {
    if (inputs && runtimeRef.current) {
      for (const [name, val] of Object.entries(inputs)) {
        if (typeof val === 'boolean') {
          runtimeRef.current.setBoolean(name, val);
        } else if (typeof val === 'number') {
          runtimeRef.current.setNumber(name, val);
        }
      }
    }
  }, [inputs]);

  // Update Binding Values dynamically
  useEffect(() => {
    if (bindingValues && runtimeRef.current) {
      for (const [path, val] of Object.entries(bindingValues)) {
        runtimeRef.current.setBindingValue(path, val);
      }
    }
  }, [bindingValues]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        display: 'block',
        width: '100%',
        height: '100%',
        touchAction: 'none',
        ...style
      }}
    />
  );
};
