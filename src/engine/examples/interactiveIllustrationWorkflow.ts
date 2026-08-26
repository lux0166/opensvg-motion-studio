import { OpenSVGDocument } from '../format/nativeDocument';
import { parseDocument, serializeDocument, validateDocument } from '../format/documentParser';
import { importSvgString } from '../svgImporter';
import { OpenSVGWebRuntime } from '../webRuntime/openSVGWebRuntime';
import { SceneNode } from '../types';

/**
 * Raw Real-World Complex SVG Vector Illustration
 * Contains:
 * - Nested hierarchy groups (<g id="...">)
 * - Linear gradient fills (<linearGradient>)
 * - Radial gradient glows (<radialGradient>)
 * - Cubic Bezier vector paths (<path d="...">)
 * - Compound paths with holes (fill-rule="evenodd")
 * - Text elements (<text>...</text>)
 * - Transform matrices & rotations
 */
export const COMPLEX_HERO_ILLUSTRATION_SVG = `
<svg width="800" height="600" viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3b82f6" />
      <stop offset="100%" stop-color="#1e3a8a" />
    </linearGradient>
    <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#60a5fa" />
      <stop offset="100%" stop-color="#1d4ed8" />
    </radialGradient>
  </defs>

  <!-- Background Frame Group -->
  <rect id="backdrop-card" x="40" y="30" width="720" height="540" rx="24" fill="#0f172a" stroke="#334155" stroke-width="2"/>
  
  <!-- Outer Shield Path with Cubic Bezier Contours -->
  <path id="shield-body" d="M 160 100 C 160 60 360 60 360 100 C 360 250 260 340 260 380 C 260 340 160 250 160 100 Z" fill="#2563eb" stroke="#93c5fd" stroke-width="4"/>
  
  <!-- Compound Path with Cutout Star/Hole -->
  <path id="shield-emblem" d="M 210 150 L 310 150 L 310 250 L 210 250 Z M 240 180 L 280 180 L 280 220 L 240 220 Z" fill="#38bdf8" fill-rule="evenodd"/>
  
  <!-- Energy Core Circle -->
  <circle id="energy-core" cx="260" cy="200" r="28" fill="#60a5fa"/>

  <!-- Typography & Status Header -->
  <text id="hero-title" x="420" y="160" font-family="Inter, sans-serif" font-size="28" font-weight="800" fill="#f8fafc">CYBER SHIELD ACTIVE</text>
  <text id="hero-subtitle" x="420" y="200" font-family="Inter, sans-serif" font-size="16" fill="#94a3b8">Interactive Vector Security Node</text>
  
  <!-- Action Trigger Badge -->
  <rect id="action-trigger-btn" x="420" y="240" width="180" height="48" rx="10" fill="#2563eb"/>
  <text id="action-btn-label" x="460" y="270" font-family="Inter, sans-serif" font-size="15" font-weight="600" fill="#ffffff">ACTIVATE SHIELD</text>
</svg>
`;

/**
 * End-to-End Workflow: Imports complex SVG, attaches interactive state machines and animations,
 * serializes to .osvg, and loads outside the Studio environment in OpenSVGWebRuntime.
 */
export function buildInteractiveHeroIllustrationDocument(): OpenSVGDocument {
  // 1. Parse raw SVG illustration
  const imported = importSvgString(COMPLEX_HERO_ILLUSTRATION_SVG);

  const nodes: Record<string, SceneNode> = {};
  const nodeOrder: string[] = [];

  for (const node of imported.nodes) {
    nodes[node.id] = { ...node };
    nodeOrder.push(node.id);
  }

  // 2. Attach production animation tracks & keyframes
  if (nodes['shield-body']) {
    nodes['shield-body'].tracks = [
      {
        id: 'track-shield-scale',
        property: 'scaleY',
        label: 'Shield Pulse',
        unit: '',
        keyframes: [
          { id: 'k1', time: 0, value: 1.0, easing: 'ease-in-out' },
          { id: 'k2', time: 1.5, value: 1.06, easing: 'ease-in-out' },
          { id: 'k3', time: 3.0, value: 1.0, easing: 'ease-in-out' }
        ]
      }
    ];
  }

  // 3. Attach State Machine with Idle, Hover, Arming, and Overdrive states
  const stateMachines = [
    {
      id: 'sm-cyber-shield',
      name: 'Cyber Shield Controller',
      inputs: [
        { id: 'inp-hover', name: 'isHovered', type: 'boolean' as const, value: false },
        { id: 'inp-active', name: 'isActive', type: 'boolean' as const, value: false },
        { id: 'trig-pulse', name: 'firePulse', type: 'trigger' as const, value: false }
      ],
      layers: [
        {
          id: 'layer-shield-core',
          name: 'Core Energy Layer',
          defaultStateId: 'state-idle',
          states: [
            {
              id: 'state-idle',
              name: 'Idle Core',
              type: 'animation' as const,
              propertyOverrides: {
                'energy-core': { fill: '#3b82f6', scaleX: 1.0, scaleY: 1.0 },
                'action-trigger-btn': { fill: '#2563eb' },
                'action-btn-label': { textContent: 'ACTIVATE SHIELD' }
              }
            },
            {
              id: 'state-hover',
              name: 'Hover Ready',
              type: 'animation' as const,
              propertyOverrides: {
                'energy-core': { fill: '#60a5fa', scaleX: 1.15, scaleY: 1.15 },
                'action-trigger-btn': { fill: '#3b82f6' },
                'action-btn-label': { textContent: 'READY TO ARM' }
              }
            },
            {
              id: 'state-active',
              name: 'Overdrive Active',
              type: 'animation' as const,
              propertyOverrides: {
                'energy-core': { fill: '#10b981', scaleX: 1.35, scaleY: 1.35 },
                'action-trigger-btn': { fill: '#059669' },
                'action-btn-label': { textContent: 'SYSTEM SECURED' }
              }
            }
          ],
          transitions: [
            {
              id: 'tr-1',
              fromStateId: 'state-idle',
              toStateId: 'state-hover',
              duration: 0.2,
              conditions: [{ inputId: 'inp-hover', operator: '==' as const, value: true }]
            },
            {
              id: 'tr-2',
              fromStateId: 'state-hover',
              toStateId: 'state-idle',
              duration: 0.2,
              conditions: [{ inputId: 'inp-hover', operator: '==' as const, value: false }]
            },
            {
              id: 'tr-3',
              fromStateId: 'state-hover',
              toStateId: 'state-active',
              duration: 0.15,
              conditions: [{ inputId: 'inp-active', operator: '==' as const, value: true }]
            }
          ]
        }
      ]
    }
  ];

  // 4. Attach Document Interactions
  const interactions = [
    {
      id: 'inter-btn-hover-enter',
      name: 'Hover Action Button',
      targetNodeId: 'action-trigger-btn',
      event: 'pointerenter' as const,
      action: { type: 'setInput' as const, inputName: 'isHovered', value: true }
    },
    {
      id: 'inter-btn-hover-leave',
      name: 'Leave Action Button',
      targetNodeId: 'action-trigger-btn',
      event: 'pointerleave' as const,
      action: { type: 'setInput' as const, inputName: 'isHovered', value: false }
    },
    {
      id: 'inter-btn-click-activate',
      name: 'Click Action Button',
      targetNodeId: 'action-trigger-btn',
      event: 'click' as const,
      action: { type: 'setInput' as const, inputName: 'isActive', value: true }
    }
  ];

  // 5. Construct canonical OpenSVGDocument
  const doc: OpenSVGDocument = {
    format: 'opensvg',
    schemaVersion: '2.0.0',
    metadata: {
      id: 'doc-cyber-shield-hero',
      title: 'Cyber Shield Interactive Illustration',
      author: 'OpenSVG Motion Studio',
      createdAt: 1700000000000,
      updatedAt: 1700000000000
    },
    scene: {
      width: imported.viewBox?.width || 800,
      height: imported.viewBox?.height || 600,
      fps: 60,
      duration: 3.0,
      background: '#0f172a'
    },
    nodes,
    nodeOrder,
    stateMachines,
    interactions
  };

  return doc;
}

/**
 * Runs the killer product workflow from end to end:
 * Import -> Animate -> Save .osvg -> Parse & Validate -> Standalone WebRuntime Execution
 */
export function executeKillerProductWorkflow(): {
  osvgJson: string;
  runtime: OpenSVGWebRuntime;
  isValid: boolean;
} {
  // Step 1: Create & Author Document
  const authoringDoc = buildInteractiveHeroIllustrationDocument();

  // Step 2: Save as .osvg JSON format
  const osvgJson = serializeDocument(authoringDoc);

  // Step 3: Validate the .osvg document format
  const validation = validateDocument(osvgJson);

  // Step 4: Standalone execution in WebRuntime outside Studio
  const runtime = new OpenSVGWebRuntime({ autoplay: false, interactive: true });
  const parsedDoc = parseDocument(osvgJson);
  runtime.load(parsedDoc);

  return {
    osvgJson,
    runtime,
    isValid: validation.valid
  };
}
