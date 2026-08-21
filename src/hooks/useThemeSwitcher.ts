import { useEffect } from 'react';
import { flushSync } from 'react-dom';
import { useStudioStore } from '../store/useStudioStore';

/**
 * Circular Reveal Theme Switcher Hook
 * Implements Obsidian Knowledge Graph specifications:
 * - 450ms Corner Sweep (endRadius = maxDistance + 150, 450ms cubic-bezier(0.4, 0, 0.2, 1))
 * - Zero-Flicker View Transitions API (document.startViewTransition)
 * - Synchronous React DOM Commit (flushSync)
 */
export const toggleThemeWithAnimation = (event?: React.MouseEvent | MouseEvent) => {
  const isCurrentlyDark = document.documentElement.classList.contains('dark');
  const nextTheme: 'light' | 'dark' = isCurrentlyDark ? 'light' : 'dark';

  // Check if browser does not support View Transitions API
  // @ts-ignore
  if (!document.startViewTransition) {
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('kinetic_theme', nextTheme);
    useStudioStore.getState().setTheme(nextTheme);
    return;
  }

  // Calculate click origin coordinates
  let x = window.innerWidth - 60;
  let y = 28;
  if (event) {
    const mouseEvent = event as MouseEvent;
    if (typeof mouseEvent.clientX === 'number' && mouseEvent.clientX > 0) {
      x = mouseEvent.clientX;
      y = mouseEvent.clientY;
    } else if (event.currentTarget && typeof (event.currentTarget as HTMLElement).getBoundingClientRect === 'function') {
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      x = rect.left + rect.width / 2;
      y = rect.top + rect.height / 2;
    }
  }

  // Calculate maximum distance to all 4 corners of the viewport + 150px safety buffer
  const maxDistance = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  );
  const endRadius = maxDistance + 150;

  // Set CSS custom properties on documentElement before transition starts
  document.documentElement.style.setProperty('--reveal-x', `${x}px`);
  document.documentElement.style.setProperty('--reveal-y', `${y}px`);
  document.documentElement.style.setProperty('--reveal-r', `${endRadius}px`);

  // Execute View Transition with React flushSync to guarantee immediate DOM commit
  // @ts-ignore
  document.startViewTransition(() => {
    flushSync(() => {
      if (nextTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      localStorage.setItem('kinetic_theme', nextTheme);
      useStudioStore.getState().setTheme(nextTheme);
    });
  });
};

export const useThemeInitialization = () => {
  const { setTheme } = useStudioStore();

  useEffect(() => {
    const savedTheme = localStorage.getItem('kinetic_theme') as 'light' | 'dark' | null;
    const initialTheme: 'light' | 'dark' = savedTheme || 'dark';

    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    setTheme(initialTheme);
  }, [setTheme]);
};
