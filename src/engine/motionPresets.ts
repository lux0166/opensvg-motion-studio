import { PropertyTrack, SceneNode, CubicBezierCurve, SpringConfig } from './types';

export type PresetCategory = 'entrance' | 'emphasis' | 'exit';

export interface PresetOptions {
  duration?: number; // Duration in seconds, default varies by preset (e.g. 0.8s)
  delay?: number; // Delay start in seconds, default 0
  intensity?: number; // Multiplier for offsets/scales (0.5 to 2.0), default 1.0
  replaceTracks?: boolean; // Whether to replace existing tracks of matching property, default true
}

export interface MotionPreset {
  id: string;
  name: string;
  category: PresetCategory;
  description: string;
  defaultDuration: number;
  icon: string; // Lucide icon name identifier
  generateTracks: (node: SceneNode, options: Required<PresetOptions>) => PropertyTrack[];
}

const EASING = {
  easeOutBack: { x1: 0.34, y1: 1.56, x2: 0.64, y2: 1 } as CubicBezierCurve,
  easeInOutCubic: { x1: 0.65, y1: 0, x2: 0.35, y2: 1 } as CubicBezierCurve,
  easeOutQuad: { x1: 0.25, y1: 1, x2: 0.5, y2: 1 } as CubicBezierCurve,
  easeInQuad: { x1: 0.5, y1: 0, x2: 0.75, y2: 0 } as CubicBezierCurve,
  anticipate: { x1: 0.36, y1: 0, x2: 0.66, y2: -0.56 } as CubicBezierCurve,
  smoothSine: { x1: 0.37, y1: 0, x2: 0.63, y2: 1 } as CubicBezierCurve,
};

const SPRING_PRESETS: Record<string, SpringConfig> = {
  bouncy: { mass: 1, stiffness: 180, damping: 12, velocity: 0 },
  snappy: { mass: 0.8, stiffness: 240, damping: 18, velocity: 0 },
  gentle: { mass: 1.2, stiffness: 120, damping: 14, velocity: 0 },
};

export const MOTION_PRESETS: MotionPreset[] = [
  // ==================== ENTRANCE PRESETS ====================
  {
    id: 'elastic-pop-in',
    name: 'Elastic Pop In',
    category: 'entrance',
    description: 'Bouncy spring scale-up from center with smooth opacity fade',
    defaultDuration: 0.8,
    icon: 'Sparkles',
    generateTracks: (node, { duration, delay, intensity }) => {
      const baseScaleX = node.scaleX || 1;
      const baseScaleY = node.scaleY || 1;
      const t0 = delay;
      const t1 = delay + duration * 0.45;
      const t2 = delay + duration * 0.75;
      const t3 = delay + duration;

      return [
        {
          id: `tr-preset-scalex-${Date.now()}`,
          property: 'scaleX',
          label: 'Scale X (Pop In)',
          unit: 'x',
          color: '#3b82f6',
          keyframes: [
            { id: `kf-sx-0`, time: t0, value: 0, curve: EASING.easeOutBack },
            { id: `kf-sx-1`, time: t1, value: parseFloat((baseScaleX * (1 + 0.25 * intensity)).toFixed(2)), curve: EASING.easeInOutCubic },
            { id: `kf-sx-2`, time: t2, value: parseFloat((baseScaleX * (1 - 0.08 * intensity)).toFixed(2)), curve: EASING.easeInOutCubic },
            { id: `kf-sx-3`, time: t3, value: baseScaleX, curve: EASING.easeOutQuad, spring: SPRING_PRESETS.bouncy }
          ]
        },
        {
          id: `tr-preset-scaley-${Date.now()}`,
          property: 'scaleY',
          label: 'Scale Y (Pop In)',
          unit: 'x',
          color: '#8b5cf6',
          keyframes: [
            { id: `kf-sy-0`, time: t0, value: 0, curve: EASING.easeOutBack },
            { id: `kf-sy-1`, time: t1, value: parseFloat((baseScaleY * (1 + 0.25 * intensity)).toFixed(2)), curve: EASING.easeInOutCubic },
            { id: `kf-sy-2`, time: t2, value: parseFloat((baseScaleY * (1 - 0.08 * intensity)).toFixed(2)), curve: EASING.easeInOutCubic },
            { id: `kf-sy-3`, time: t3, value: baseScaleY, curve: EASING.easeOutQuad, spring: SPRING_PRESETS.bouncy }
          ]
        },
        {
          id: `tr-preset-opacity-${Date.now()}`,
          property: 'opacity',
          label: 'Opacity (Fade In)',
          unit: '',
          color: '#10b981',
          keyframes: [
            { id: `kf-op-0`, time: t0, value: 0, curve: EASING.easeOutQuad },
            { id: `kf-op-1`, time: delay + duration * 0.4, value: 1, curve: EASING.easeOutQuad }
          ]
        }
      ];
    }
  },
  {
    id: 'slide-fade-up',
    name: 'Slide Fade Up',
    category: 'entrance',
    description: 'Smooth vertical rise with subtle overshoot and fade in',
    defaultDuration: 0.7,
    icon: 'ArrowUpCircle',
    generateTracks: (node, { duration, delay, intensity }) => {
      const baseY = node.y;
      const offset = 60 * intensity;
      const t0 = delay;
      const t1 = delay + duration;

      return [
        {
          id: `tr-preset-y-${Date.now()}`,
          property: 'y',
          label: 'Y Position (Slide Up)',
          unit: 'px',
          color: '#6366f1',
          keyframes: [
            { id: `kf-y-0`, time: t0, value: parseFloat((baseY + offset).toFixed(1)), curve: EASING.easeOutBack },
            { id: `kf-y-1`, time: t1, value: baseY, curve: EASING.easeOutQuad, spring: SPRING_PRESETS.snappy }
          ]
        },
        {
          id: `tr-preset-opacity-${Date.now()}`,
          property: 'opacity',
          label: 'Opacity (Fade In)',
          unit: '',
          color: '#10b981',
          keyframes: [
            { id: `kf-op-0`, time: t0, value: 0, curve: EASING.easeOutQuad },
            { id: `kf-op-1`, time: t1, value: 1, curve: EASING.easeOutQuad }
          ]
        }
      ];
    }
  },
  {
    id: 'slide-fade-left',
    name: 'Slide Fade Right',
    category: 'entrance',
    description: 'Horizontal slide into place with cubic deceleration',
    defaultDuration: 0.65,
    icon: 'ArrowRightCircle',
    generateTracks: (node, { duration, delay, intensity }) => {
      const baseX = node.x;
      const offset = -75 * intensity;
      const t0 = delay;
      const t1 = delay + duration;

      return [
        {
          id: `tr-preset-x-${Date.now()}`,
          property: 'x',
          label: 'X Position (Slide Right)',
          unit: 'px',
          color: '#ec4899',
          keyframes: [
            { id: `kf-x-0`, time: t0, value: parseFloat((baseX + offset).toFixed(1)), curve: EASING.easeOutBack },
            { id: `kf-x-1`, time: t1, value: baseX, curve: EASING.easeOutQuad }
          ]
        },
        {
          id: `tr-preset-opacity-${Date.now()}`,
          property: 'opacity',
          label: 'Opacity (Fade In)',
          unit: '',
          color: '#10b981',
          keyframes: [
            { id: `kf-op-0`, time: t0, value: 0, curve: EASING.easeOutQuad },
            { id: `kf-op-1`, time: t1, value: 1, curve: EASING.easeOutQuad }
          ]
        }
      ];
    }
  },
  {
    id: 'spin-in-360',
    name: 'Spin In 360°',
    category: 'entrance',
    description: 'Dynamic 360 degree rotation combined with scaling entrance',
    defaultDuration: 0.85,
    icon: 'RotateCw',
    generateTracks: (node, { duration, delay, intensity }) => {
      const baseRot = node.rotation || 0;
      const baseScaleX = node.scaleX || 1;
      const baseScaleY = node.scaleY || 1;
      const t0 = delay;
      const t1 = delay + duration;

      return [
        {
          id: `tr-preset-rot-${Date.now()}`,
          property: 'rotation',
          label: 'Rotation (Spin In)',
          unit: '°',
          color: '#f59e0b',
          keyframes: [
            { id: `kf-r-0`, time: t0, value: baseRot - 360 * intensity, curve: EASING.easeOutBack },
            { id: `kf-r-1`, time: t1, value: baseRot, curve: EASING.easeOutQuad }
          ]
        },
        {
          id: `tr-preset-scalex-${Date.now()}`,
          property: 'scaleX',
          label: 'Scale X (Zoom In)',
          unit: 'x',
          color: '#3b82f6',
          keyframes: [
            { id: `kf-sx-0`, time: t0, value: 0.1, curve: EASING.easeOutBack },
            { id: `kf-sx-1`, time: t1, value: baseScaleX, curve: EASING.easeOutQuad }
          ]
        },
        {
          id: `tr-preset-scaley-${Date.now()}`,
          property: 'scaleY',
          label: 'Scale Y (Zoom In)',
          unit: 'x',
          color: '#8b5cf6',
          keyframes: [
            { id: `kf-sy-0`, time: t0, value: 0.1, curve: EASING.easeOutBack },
            { id: `kf-sy-1`, time: t1, value: baseScaleY, curve: EASING.easeOutQuad }
          ]
        },
        {
          id: `tr-preset-opacity-${Date.now()}`,
          property: 'opacity',
          label: 'Opacity (Fade In)',
          unit: '',
          color: '#10b981',
          keyframes: [
            { id: `kf-op-0`, time: t0, value: 0, curve: EASING.easeOutQuad },
            { id: `kf-op-1`, time: t1, value: 1, curve: EASING.easeOutQuad }
          ]
        }
      ];
    }
  },
  {
    id: 'drop-bounce',
    name: 'Drop Bounce',
    category: 'entrance',
    description: 'Gravity fall from top with multi-stage elastic impact bouncing',
    defaultDuration: 0.9,
    icon: 'ArrowDownCircle',
    generateTracks: (node, { duration, delay, intensity }) => {
      const baseY = node.y;
      const dropHeight = 140 * intensity;
      const t0 = delay;
      const t1 = delay + duration * 0.4;
      const t2 = delay + duration * 0.65;
      const t3 = delay + duration * 0.85;
      const t4 = delay + duration;

      return [
        {
          id: `tr-preset-y-${Date.now()}`,
          property: 'y',
          label: 'Y Position (Drop Bounce)',
          unit: 'px',
          color: '#3b82f6',
          keyframes: [
            { id: `kf-db-0`, time: t0, value: parseFloat((baseY - dropHeight).toFixed(1)), curve: EASING.easeInQuad },
            { id: `kf-db-1`, time: t1, value: baseY, curve: EASING.easeOutQuad },
            { id: `kf-db-2`, time: t2, value: parseFloat((baseY - dropHeight * 0.28).toFixed(1)), curve: EASING.easeInQuad },
            { id: `kf-db-3`, time: t3, value: baseY, curve: EASING.easeOutQuad },
            { id: `kf-db-4`, time: t4, value: baseY, curve: EASING.easeOutQuad }
          ]
        },
        {
          id: `tr-preset-opacity-${Date.now()}`,
          property: 'opacity',
          label: 'Opacity (Fade In)',
          unit: '',
          color: '#10b981',
          keyframes: [
            { id: `kf-op-0`, time: t0, value: 0, curve: EASING.easeOutQuad },
            { id: `kf-op-1`, time: t0 + 0.15, value: 1, curve: EASING.easeOutQuad }
          ]
        }
      ];
    }
  },

  // ==================== EMPHASIS & LOOP PRESETS ====================
  {
    id: 'heartbeat-pulse',
    name: 'Heartbeat Pulse',
    category: 'emphasis',
    description: 'Double rhythmic beat pulsation mimicking natural heartbeat',
    defaultDuration: 1.2,
    icon: 'Heart',
    generateTracks: (node, { duration, delay, intensity }) => {
      const baseScaleX = node.scaleX || 1;
      const baseScaleY = node.scaleY || 1;
      const step = duration / 6;

      return [
        {
          id: `tr-preset-scalex-${Date.now()}`,
          property: 'scaleX',
          label: 'Scale X (Heartbeat)',
          unit: 'x',
          color: '#ef4444',
          keyframes: [
            { id: `kf-hb-0`, time: delay, value: baseScaleX, curve: EASING.easeOutQuad },
            { id: `kf-hb-1`, time: delay + step * 1, value: parseFloat((baseScaleX * (1 + 0.28 * intensity)).toFixed(2)), curve: EASING.easeInQuad },
            { id: `kf-hb-2`, time: delay + step * 2, value: baseScaleX, curve: EASING.easeOutQuad },
            { id: `kf-hb-3`, time: delay + step * 3, value: parseFloat((baseScaleX * (1 + 0.18 * intensity)).toFixed(2)), curve: EASING.easeInQuad },
            { id: `kf-hb-4`, time: delay + step * 4, value: baseScaleX, curve: EASING.smoothSine },
            { id: `kf-hb-5`, time: delay + duration, value: baseScaleX, curve: EASING.smoothSine }
          ]
        },
        {
          id: `tr-preset-scaley-${Date.now()}`,
          property: 'scaleY',
          label: 'Scale Y (Heartbeat)',
          unit: 'x',
          color: '#ef4444',
          keyframes: [
            { id: `kf-hby-0`, time: delay, value: baseScaleY, curve: EASING.easeOutQuad },
            { id: `kf-hby-1`, time: delay + step * 1, value: parseFloat((baseScaleY * (1 + 0.28 * intensity)).toFixed(2)), curve: EASING.easeInQuad },
            { id: `kf-hby-2`, time: delay + step * 2, value: baseScaleY, curve: EASING.easeOutQuad },
            { id: `kf-hby-3`, time: delay + step * 3, value: parseFloat((baseScaleY * (1 + 0.18 * intensity)).toFixed(2)), curve: EASING.easeInQuad },
            { id: `kf-hby-4`, time: delay + step * 4, value: baseScaleY, curve: EASING.smoothSine },
            { id: `kf-hby-5`, time: delay + duration, value: baseScaleY, curve: EASING.smoothSine }
          ]
        }
      ];
    }
  },
  {
    id: 'floating-levitation',
    name: 'Floating Levitation',
    category: 'emphasis',
    description: 'Smooth vertical sine hover motion with gentle rhythmic breathing',
    defaultDuration: 2.0,
    icon: 'Feather',
    generateTracks: (node, { duration, delay, intensity }) => {
      const baseY = node.y;
      const amp = 16 * intensity;
      const half = duration * 0.5;

      return [
        {
          id: `tr-preset-y-${Date.now()}`,
          property: 'y',
          label: 'Y Position (Floating)',
          unit: 'px',
          color: '#06b6d4',
          keyframes: [
            { id: `kf-fl-0`, time: delay, value: baseY, curve: EASING.smoothSine },
            { id: `kf-fl-1`, time: delay + half, value: parseFloat((baseY - amp).toFixed(1)), curve: EASING.smoothSine },
            { id: `kf-fl-2`, time: delay + duration, value: baseY, curve: EASING.smoothSine }
          ]
        },
        {
          id: `tr-preset-rot-${Date.now()}`,
          property: 'rotation',
          label: 'Rotation (Gentle Sway)',
          unit: '°',
          color: '#8b5cf6',
          keyframes: [
            { id: `kf-flr-0`, time: delay, value: 0, curve: EASING.smoothSine },
            { id: `kf-flr-1`, time: delay + duration * 0.25, value: parseFloat((-2.5 * intensity).toFixed(1)), curve: EASING.smoothSine },
            { id: `kf-flr-2`, time: delay + duration * 0.75, value: parseFloat((2.5 * intensity).toFixed(1)), curve: EASING.smoothSine },
            { id: `kf-flr-3`, time: delay + duration, value: 0, curve: EASING.smoothSine }
          ]
        }
      ];
    }
  },
  {
    id: 'neon-glow-pulse',
    name: 'Neon Glow Pulse',
    category: 'emphasis',
    description: 'Dynamic drop shadow blur radiance cycle for high-tech aesthetic',
    defaultDuration: 1.5,
    icon: 'Sun',
    generateTracks: (_node, { duration, delay, intensity }) => {
      const maxBlur = 32 * intensity;
      const minBlur = 4;
      const half = duration * 0.5;

      return [
        {
          id: `tr-preset-shadowblur-${Date.now()}`,
          property: 'shadowBlur',
          label: 'Shadow Blur (Glow)',
          unit: 'px',
          color: '#a855f7',
          keyframes: [
            { id: `kf-ng-0`, time: delay, value: minBlur, curve: EASING.smoothSine },
            { id: `kf-ng-1`, time: delay + half, value: parseFloat(maxBlur.toFixed(1)), curve: EASING.smoothSine },
            { id: `kf-ng-2`, time: delay + duration, value: minBlur, curve: EASING.smoothSine }
          ]
        }
      ];
    }
  },
  {
    id: 'wiggle-jitter',
    name: 'Wiggle Jitter',
    category: 'emphasis',
    description: 'Playful high-frequency angular rotation shake and wobble',
    defaultDuration: 0.8,
    icon: 'Activity',
    generateTracks: (node, { duration, delay, intensity }) => {
      const baseRot = node.rotation || 0;
      const maxRot = 12 * intensity;
      const step = duration / 6;

      return [
        {
          id: `tr-preset-rot-${Date.now()}`,
          property: 'rotation',
          label: 'Rotation (Wiggle)',
          unit: '°',
          color: '#eab308',
          keyframes: [
            { id: `kf-wg-0`, time: delay, value: baseRot, curve: EASING.easeInOutCubic },
            { id: `kf-wg-1`, time: delay + step * 1, value: parseFloat((baseRot - maxRot).toFixed(1)), curve: EASING.easeInOutCubic },
            { id: `kf-wg-2`, time: delay + step * 2, value: parseFloat((baseRot + maxRot).toFixed(1)), curve: EASING.easeInOutCubic },
            { id: `kf-wg-3`, time: delay + step * 3, value: parseFloat((baseRot - maxRot * 0.5).toFixed(1)), curve: EASING.easeInOutCubic },
            { id: `kf-wg-4`, time: delay + step * 4, value: parseFloat((baseRot + maxRot * 0.5).toFixed(1)), curve: EASING.easeInOutCubic },
            { id: `kf-wg-5`, time: delay + step * 5, value: parseFloat((baseRot - maxRot * 0.2).toFixed(1)), curve: EASING.easeInOutCubic },
            { id: `kf-wg-6`, time: delay + duration, value: baseRot, curve: EASING.easeOutQuad }
          ]
        }
      ];
    }
  },
  {
    id: 'breathing-opacity',
    name: 'Breathing Opacity',
    category: 'emphasis',
    description: 'Calm cyclical luminosity oscillation between dimmed and full opacity',
    defaultDuration: 1.8,
    icon: 'Eye',
    generateTracks: (_node, { duration, delay, intensity }) => {
      const minOp = Math.max(0.1, 0.4 / intensity);
      const half = duration * 0.5;

      return [
        {
          id: `tr-preset-op-${Date.now()}`,
          property: 'opacity',
          label: 'Opacity (Breathing)',
          unit: '',
          color: '#10b981',
          keyframes: [
            { id: `kf-br-0`, time: delay, value: 1.0, curve: EASING.smoothSine },
            { id: `kf-br-1`, time: delay + half, value: parseFloat(minOp.toFixed(2)), curve: EASING.smoothSine },
            { id: `kf-br-2`, time: delay + duration, value: 1.0, curve: EASING.smoothSine }
          ]
        }
      ];
    }
  },

  // ==================== EXIT PRESETS ====================
  {
    id: 'fade-shrink-out',
    name: 'Fade Shrink Out',
    category: 'exit',
    description: 'Anticipation micro-pop followed by rapid shrink zoom into void',
    defaultDuration: 0.6,
    icon: 'Minimize2',
    generateTracks: (node, { duration, delay, intensity }) => {
      const baseScaleX = node.scaleX || 1;
      const baseScaleY = node.scaleY || 1;
      const t0 = delay;
      const t1 = delay + duration * 0.2;
      const t2 = delay + duration;

      return [
        {
          id: `tr-preset-scalex-${Date.now()}`,
          property: 'scaleX',
          label: 'Scale X (Shrink Out)',
          unit: 'x',
          color: '#ef4444',
          keyframes: [
            { id: `kf-so-0`, time: t0, value: baseScaleX, curve: EASING.anticipate },
            { id: `kf-so-1`, time: t1, value: parseFloat((baseScaleX * (1 + 0.15 * intensity)).toFixed(2)), curve: EASING.easeInQuad },
            { id: `kf-so-2`, time: t2, value: 0.0, curve: EASING.easeInQuad }
          ]
        },
        {
          id: `tr-preset-scaley-${Date.now()}`,
          property: 'scaleY',
          label: 'Scale Y (Shrink Out)',
          unit: 'x',
          color: '#ef4444',
          keyframes: [
            { id: `kf-soy-0`, time: t0, value: baseScaleY, curve: EASING.anticipate },
            { id: `kf-soy-1`, time: t1, value: parseFloat((baseScaleY * (1 + 0.15 * intensity)).toFixed(2)), curve: EASING.easeInQuad },
            { id: `kf-soy-2`, time: t2, value: 0.0, curve: EASING.easeInQuad }
          ]
        },
        {
          id: `tr-preset-opacity-${Date.now()}`,
          property: 'opacity',
          label: 'Opacity (Fade Out)',
          unit: '',
          color: '#6b7280',
          keyframes: [
            { id: `kf-fo-0`, time: t0, value: 1.0, curve: EASING.easeInQuad },
            { id: `kf-fo-1`, time: t2, value: 0.0, curve: EASING.easeInQuad }
          ]
        }
      ];
    }
  },
  {
    id: 'slide-down-fade',
    name: 'Slide Down Exit',
    category: 'exit',
    description: 'Smooth downward sink off-screen with accelerated fading',
    defaultDuration: 0.55,
    icon: 'ArrowDown',
    generateTracks: (node, { duration, delay, intensity }) => {
      const baseY = node.y;
      const offset = 80 * intensity;
      const t0 = delay;
      const t1 = delay + duration;

      return [
        {
          id: `tr-preset-y-${Date.now()}`,
          property: 'y',
          label: 'Y Position (Sink Down)',
          unit: 'px',
          color: '#64748b',
          keyframes: [
            { id: `kf-sy-0`, time: t0, value: baseY, curve: EASING.easeInQuad },
            { id: `kf-sy-1`, time: t1, value: parseFloat((baseY + offset).toFixed(1)), curve: EASING.easeInQuad }
          ]
        },
        {
          id: `tr-preset-opacity-${Date.now()}`,
          property: 'opacity',
          label: 'Opacity (Fade Out)',
          unit: '',
          color: '#6b7280',
          keyframes: [
            { id: `kf-syo-0`, time: t0, value: 1.0, curve: EASING.easeInQuad },
            { id: `kf-syo-1`, time: t1, value: 0.0, curve: EASING.easeInQuad }
          ]
        }
      ];
    }
  },
  {
    id: 'spin-out-360',
    name: 'Spin Out & Disperse',
    category: 'exit',
    description: 'Accelerated 360 degree vortex rotation vanishing into focal point',
    defaultDuration: 0.75,
    icon: 'RotateCcw',
    generateTracks: (node, { duration, delay, intensity }) => {
      const baseRot = node.rotation || 0;
      const baseScaleX = node.scaleX || 1;
      const baseScaleY = node.scaleY || 1;
      const t0 = delay;
      const t1 = delay + duration;

      return [
        {
          id: `tr-preset-rot-${Date.now()}`,
          property: 'rotation',
          label: 'Rotation (Spin Out)',
          unit: '°',
          color: '#f59e0b',
          keyframes: [
            { id: `kf-sor-0`, time: t0, value: baseRot, curve: EASING.easeInQuad },
            { id: `kf-sor-1`, time: t1, value: baseRot + 360 * intensity, curve: EASING.easeInQuad }
          ]
        },
        {
          id: `tr-preset-scalex-${Date.now()}`,
          property: 'scaleX',
          label: 'Scale X (Vortex Out)',
          unit: 'x',
          color: '#ef4444',
          keyframes: [
            { id: `kf-sso-0`, time: t0, value: baseScaleX, curve: EASING.easeInQuad },
            { id: `kf-sso-1`, time: t1, value: 0.0, curve: EASING.easeInQuad }
          ]
        },
        {
          id: `tr-preset-scaley-${Date.now()}`,
          property: 'scaleY',
          label: 'Scale Y (Vortex Out)',
          unit: 'x',
          color: '#ef4444',
          keyframes: [
            { id: `kf-sso-y-0`, time: t0, value: baseScaleY, curve: EASING.easeInQuad },
            { id: `kf-sso-y-1`, time: t1, value: 0.0, curve: EASING.easeInQuad }
          ]
        },
        {
          id: `tr-preset-opacity-${Date.now()}`,
          property: 'opacity',
          label: 'Opacity (Fade Out)',
          unit: '',
          color: '#6b7280',
          keyframes: [
            { id: `kf-soo-0`, time: t0, value: 1.0, curve: EASING.easeInQuad },
            { id: `kf-soo-1`, time: t1, value: 0.0, curve: EASING.easeInQuad }
          ]
        }
      ];
    }
  }
];

/**
 * Apply a Motion Preset to a target SceneNode with merge options
 */
export function applyMotionPresetToNode(
  node: SceneNode,
  presetId: string,
  options?: Partial<PresetOptions>
): SceneNode {
  const preset = MOTION_PRESETS.find((p) => p.id === presetId);
  if (!preset) return node;

  const fullOptions: Required<PresetOptions> = {
    duration: options?.duration ?? preset.defaultDuration,
    delay: options?.delay ?? 0,
    intensity: options?.intensity ?? 1.0,
    replaceTracks: options?.replaceTracks ?? true
  };

  const newTracks = preset.generateTracks(node, fullOptions);
  const updatedTracks: PropertyTrack[] = [...(node.tracks || [])];

  for (const newTr of newTracks) {
    const existingIndex = updatedTracks.findIndex((t) => t.property === newTr.property);
    if (existingIndex >= 0 && fullOptions.replaceTracks) {
      // Replace existing track of this property with the generated preset track
      updatedTracks[existingIndex] = newTr;
    } else {
      updatedTracks.push(newTr);
    }
  }

  return {
    ...node,
    tracks: updatedTracks
  };
}
