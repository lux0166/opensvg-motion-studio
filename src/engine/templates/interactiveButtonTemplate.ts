import { OpenSVGDocument } from '../format/nativeDocument';

/**
 * Creates the Canonical Killer Workflow Template: Interactive Button
 * Implements full interactive states: idle -> hover -> pressed -> loading -> success -> error.
 * Standardized per OPENSVG_CURRENT_STRATEGIC_ROADMAP.md (Section 16 & 17).
 */
export function createInteractiveButtonDocument(): OpenSVGDocument {
  const doc: OpenSVGDocument = {
    format: 'opensvg',
    schemaVersion: '2.0.0',
    metadata: {
      id: 'template-interactive-button',
      title: 'Interactive Smart Button',
      description: 'Production-ready interactive button with multi-state animations and state machine',
      author: 'OpenSVG Motion Studio',
      createdAt: 1787380000000,
      updatedAt: 1787380000000,
      generator: 'OpenSVG Motion Studio 2.0',
      tags: ['button', 'ui', 'interactive', 'state-machine']
    },
    scene: {
      width: 240,
      height: 60,
      fps: 60,
      duration: 3.0,
      background: 'transparent',
      clipContent: false
    },
    nodes: {
      'btn-container': {
        id: 'btn-container',
        name: 'Button Background',
        type: 'rect',
        visible: true,
        locked: false,
        x: 0,
        y: 0,
        width: 240,
        height: 60,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        borderRadius: 12,
        fill: '#4f46e5',
        shadowBlur: 12,
        shadowColor: 'rgba(79, 70, 229, 0.4)',
        shadowOffsetX: 0,
        shadowOffsetY: 4,
        tracks: [
          {
            id: 'tr-btn-scale',
            property: 'scaleX',
            label: 'Scale X',
            unit: 'x',
            color: '#6366f1',
            keyframes: [
              { id: 'k1', time: 0.0, value: 1.0, easing: 'ease-out' },
              { id: 'k2', time: 0.2, value: 1.05, easing: 'ease-out' },
              { id: 'k3', time: 0.4, value: 0.96, spring: { mass: 1, stiffness: 200, damping: 15 } }
            ]
          }
        ]
      },
      'btn-label': {
        id: 'btn-label',
        name: 'Submit Text',
        type: 'text',
        visible: true,
        locked: false,
        parentId: 'btn-container',
        x: 40,
        y: 20,
        width: 160,
        height: 24,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        borderRadius: 0,
        fill: '#ffffff',
        textContent: 'Confirm Action',
        fontSize: 16,
        fontFamily: 'Inter, sans-serif',
        fontWeight: '600',
        textAlign: 'center',
        tracks: []
      }
    },
    nodeOrder: ['btn-container', 'btn-label'],
    stateMachines: [
      {
        id: 'sm-btn-main',
        name: 'Button State Controller',
        inputs: [
          { id: 'inp-hover', name: 'isHovered', type: 'boolean', value: false },
          { id: 'inp-pressed', name: 'isPressed', type: 'boolean', value: false },
          { id: 'inp-loading', name: 'isLoading', type: 'boolean', value: false },
          { id: 'inp-success', name: 'isSuccess', type: 'trigger', value: false }
        ],
        layers: [
          {
            id: 'layer-visual',
            name: 'Visual States',
            defaultStateId: 'state-idle',
            states: [
              { id: 'state-idle', name: 'Idle', type: 'animation', duration: 0.2 },
              { id: 'state-hover', name: 'Hover', type: 'animation', duration: 0.2 },
              { id: 'state-pressed', name: 'Pressed', type: 'animation', duration: 0.1 },
              { id: 'state-loading', name: 'Loading', type: 'animation', duration: 1.0 },
              { id: 'state-success', name: 'Success', type: 'animation', duration: 0.5 }
            ],
            transitions: [
              {
                id: 'tr-idle-hover',
                fromStateId: 'state-idle',
                toStateId: 'state-hover',
                duration: 0.15,
                conditions: [{ inputId: 'inp-hover', operator: '==', value: true }]
              },
              {
                id: 'tr-hover-idle',
                fromStateId: 'state-hover',
                toStateId: 'state-idle',
                duration: 0.15,
                conditions: [{ inputId: 'inp-hover', operator: '==', value: false }]
              },
              {
                id: 'tr-hover-press',
                fromStateId: 'state-hover',
                toStateId: 'state-pressed',
                duration: 0.08,
                conditions: [{ inputId: 'inp-pressed', operator: '==', value: true }]
              },
              {
                id: 'tr-press-loading',
                fromStateId: 'state-pressed',
                toStateId: 'state-loading',
                duration: 0.2,
                conditions: [{ inputId: 'inp-loading', operator: '==', value: true }]
              },
              {
                id: 'tr-loading-success',
                fromStateId: 'state-loading',
                toStateId: 'state-success',
                duration: 0.3,
                conditions: [{ inputId: 'inp-success', operator: 'fired' }]
              }
            ]
          }
        ]
      }
    ]
  };

  return doc;
}
