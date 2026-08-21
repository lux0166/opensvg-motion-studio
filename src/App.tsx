import React from 'react';
import { useStudioStore } from './store/useStudioStore';
import { useStudioShortcuts } from './hooks/useStudioShortcuts';
import { Header } from './components/Header';
import { Canvas } from './components/Canvas';
import { LayersPanel } from './components/LayersPanel';
import { PropertiesPanel } from './components/PropertiesPanel';
import { Timeline } from './components/Timeline';
import { ExportModal } from './components/ExportModal';

export const App: React.FC = () => {
  const { toastMessage } = useStudioStore();

  // Activate studio keyboard shortcuts (Ctrl+Z, Ctrl+Y, Space, V, P, T, Delete, Ctrl+S)
  useStudioShortcuts();

  return (
    <div className="flex-1 flex flex-col p-2 md:p-4 lg:p-6 overflow-hidden select-none">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-white/95 backdrop-blur-md text-slate-800 border border-slate-200 px-4 py-2 rounded-xl shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="w-2 h-2 rounded-full bg-blue-500 motion-safe:animate-pulse" />
          <span className="text-xs font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Main Studio Frame Window */}
      <div className="bg-app-bg rounded-3xl shadow-soft border border-app-border flex-1 flex flex-col overflow-hidden relative">
        <Header />

        <main className="flex-1 flex overflow-hidden relative">
          <LayersPanel />
          <Canvas />
          <PropertiesPanel />
        </main>

        <Timeline />
      </div>

      <ExportModal />
    </div>
  );
};

export default App;
