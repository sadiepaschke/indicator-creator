import React, { useState, useEffect } from 'react';
import { TocData, TocElement, MappedIndicator } from './types/toc';
import { parseUrlParams, tocDataToElements, detectSector } from './services/tocParser';
import { TocImporter } from './components/creator/TocImporter';
import { TocVisualizer } from './components/creator/TocVisualizer';
import { IndicatorPanel } from './components/creator/IndicatorPanel';
import { ExportPanel } from './components/creator/ExportPanel';
import { Button } from './components/ui/Button';

const App: React.FC = () => {
  const [darkMode, setDarkMode] = useState(true);
  const [tocData, setTocData] = useState<TocData | null>(null);
  const [elements, setElements] = useState<TocElement[]>([]);
  const [indicators, setIndicators] = useState<MappedIndicator[]>([]);
  const [selectedElement, setSelectedElement] = useState<TocElement | null>(null);
  const [fromWizard, setFromWizard] = useState(false);

  // Load from URL params on mount
  useEffect(() => {
    const { tocData: urlData, fromWizard: isFromWizard } = parseUrlParams();
    if (urlData) {
      handleImport(urlData);
      setFromWizard(isFromWizard);
    }

    // Load from localStorage if available
    const saved = localStorage.getItem('indicator-creator-session');
    if (saved && !urlData) {
      try {
        const { tocData: savedToc, indicators: savedIndicators } = JSON.parse(saved);
        if (savedToc) {
          setTocData(savedToc);
          setElements(tocDataToElements(savedToc));
          setIndicators(savedIndicators || []);
        }
      } catch (e) {
        console.error('Failed to load saved session');
      }
    }
  }, []);

  // Save to localStorage on changes
  useEffect(() => {
    if (tocData) {
      localStorage.setItem('indicator-creator-session', JSON.stringify({
        tocData,
        indicators,
        savedAt: new Date().toISOString(),
      }));
    }
  }, [tocData, indicators]);

  const handleImport = (data: TocData) => {
    // Auto-detect sector if not set
    if (!data.sector) {
      const allText = [
        data.impact,
        ...data.outcomes.longterm,
        ...data.outcomes.midterm,
        ...data.outcomes.shortterm,
        ...data.activities,
      ].filter(Boolean).join(' ');
      data.sector = detectSector(allText);
    }

    setTocData(data);
    setElements(tocDataToElements(data));
    setIndicators([]);
    setSelectedElement(null);
  };

  const handleReset = () => {
    setTocData(null);
    setElements([]);
    setIndicators([]);
    setSelectedElement(null);
    localStorage.removeItem('indicator-creator-session');
  };

  const handleAddIndicator = (indicator: MappedIndicator) => {
    setIndicators(prev => [...prev, indicator]);
  };

  const handleRemoveIndicator = (indicatorId: string) => {
    setIndicators(prev => prev.filter(i => i.id !== indicatorId));
  };

  const handleEditIndicator = (updated: MappedIndicator) => {
    setIndicators(prev => prev.map(i => i.id === updated.id ? updated : i));
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <div className="min-h-screen bg-[#fdfaf0] dark:bg-black text-gray-800 dark:text-[#cbb26a]">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/Logo.svg" alt="Anthralytic logo" className="h-10 w-10" />
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-[#c9a227] to-[#6d4c9b] bg-clip-text text-transparent">
                  Indicator Creator
                </h1>
                <span className="text-xs text-gray-500 dark:text-gray-400">by Anthralytic</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {tocData && (
                <Button onClick={handleReset}>
                  Start Over
                </Button>
              )}
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {darkMode ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8">
          {/* Context Banner from Impact Wizard */}
          {fromWizard && tocData && (
            <div className="mb-6 p-4 rounded-lg bg-gradient-to-r from-[#c9a227]/10 to-[#6d4c9b]/10 border border-[#c9a227]/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#c9a227]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="font-semibold text-[#c9a227]">
                    Connected from Impact Wizard
                  </span>
                  {tocData.projectName && (
                    <span className="text-sm text-gray-500">
                      — {tocData.projectName}
                    </span>
                  )}
                </div>
                <a
                  href="http://localhost:5173"
                  className="text-sm text-[#c9a227] hover:underline flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to Wizard
                </a>
              </div>
            </div>
          )}

          {!tocData ? (
            /* Import View */
            <TocImporter onImport={handleImport} />
          ) : (
            /* Creator View */
            <div className="space-y-6">
              {/* Title */}
              <div className="text-center mb-4">
                <h2 className="text-2xl font-bold">
                  {tocData.projectName || 'Indicator Matrix'}
                </h2>
                <p className="text-sm text-amber-600 dark:text-amber-400 mt-1 font-medium">
                  Coming soon!
                </p>
              </div>

              {/* Main content grid */}
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Left: ToC Visualizer */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Theory of Change</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Select an element to add indicators
                  </p>
                  <TocVisualizer
                    elements={elements}
                    indicators={indicators}
                    selectedElementId={selectedElement?.id}
                    onSelectElement={setSelectedElement}
                  />
                </div>

                {/* Right: Indicator Panel */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Indicators</h3>
                  {selectedElement ? (
                    <IndicatorPanel
                      element={selectedElement}
                      indicators={indicators}
                      onAddIndicator={handleAddIndicator}
                      onRemoveIndicator={handleRemoveIndicator}
                      onEditIndicator={handleEditIndicator}
                      sector={tocData.sector}
                    />
                  ) : (
                    <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-8 text-center text-gray-500">
                      <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <p>Select a ToC element from the left panel to create indicators</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Export Panel */}
              <ExportPanel
                elements={elements}
                indicators={indicators}
                projectName={tocData.projectName}
                sector={tocData.sector}
              />
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-200 dark:border-gray-800 py-6 mt-12">
          <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500 dark:text-gray-400">
            <p>A free tool for nonprofits</p>
            <p className="mt-1">&copy; 2025 Anthralytic</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;
