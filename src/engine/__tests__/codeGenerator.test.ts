import { describe, it, expect } from 'vitest';
import { generateReactFramerMotionCode, generateStandaloneHtmlBundle, sanitizeIdentifier } from '../codeGenerator';
import { SceneProject } from '../types';

describe('Code Generation & Multi-Target Compiler (Rules E5, E6, E7, E9)', () => {
  const mockProject: SceneProject = {
    id: 'proj-1',
    name: 'Sample Motion 101',
    version: '1.0',
    duration: 2.0,
    fps: 60,
    rootFrame: {
      id: 'frame-1', name: 'Root', type: 'frame', visible: true, locked: false, clipContent: true,
      canvasBg: '#111827', x: 0, y: 0, width: 800, height: 600, rotation: 0, scaleX: 1, scaleY: 1,
      opacity: 1, borderRadius: 0, fill: '#111827', tracks: []
    },
    nodes: {
      heroBox: {
        id: 'heroBox', name: 'Hero Box', type: 'rect', visible: true, locked: false,
        x: 100, y: 150, width: 200, height: 120, rotation: 0, scaleX: 1, scaleY: 1,
        opacity: 1, borderRadius: 12, fill: '#3b82f6',
        tracks: [
          {
            id: 'tr-1', property: 'x', label: 'X', unit: 'px',
            keyframes: [
              { id: 'k1', time: 0, value: 100 },
              { id: 'k2', time: 2.0, value: 400 }
            ]
          }
        ]
      }
    },
    nodeOrder: ['heroBox']
  };

  it('sanitizes identifiers safely (Rule E6 & E7)', () => {
    expect(sanitizeIdentifier('Hero Box $100')).toBe('Hero_Box__100');
    expect(sanitizeIdentifier('123Start')).toBe('node_123Start');
  });

  it('compiles clean React + Framer Motion component code (Rule E5)', () => {
    const code = generateReactFramerMotionCode(mockProject);
    expect(code).toContain("import React from 'react';");
    expect(code).toContain("import { motion } from 'framer-motion';");
    expect(code).toContain('export const Sample_Motion_101');
    expect(code).toContain('Hero_Box');
  });

  it('compiles zero-dependency standalone HTML5 bundle (Rule E9)', () => {
    const html = generateStandaloneHtmlBundle(mockProject);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<canvas id="cvs"');
    expect(html).toContain('btnPlay');
  });
});
