import React, { useEffect } from 'react';
import { useStudioStore } from './store/useStudioStore';
import { useStudioShortcuts } from './hooks/useStudioShortcuts';
import { TabBar } from './components/TabBar';
import { Header } from './components/Header';
import { Canvas } from './components/Canvas';
import { LayersPanel } from './components/LayersPanel';
import { PropertiesPanel } from './components/PropertiesPanel';
import { Timeline } from './components/Timeline';
import { ExportModal } from './components/ExportModal';

export const App: React.FC = () => {
  const { toastMessage, showToast } = useStudioStore();

  // Activate studio keyboard shortcuts (Ctrl+Z, Ctrl+Y, Space, V, P, T, Delete, Ctrl+S)
  useStudioShortcuts();

  useEffect(() => {
    showToast('OpenSVG Motion Studio Initialized');
  }, []);

  return (
    <div className="flex-1 flex flex-col p-2 md:p-4 lg:p-6 overflow-hidden select-none">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-gray-900 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-xs font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Main Studio Frame Window */}
      <div className="bg-app-bg rounded-3xl shadow-soft border border-app-border flex-1 flex flex-col overflow-hidden relative">
        <TabBar />
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
