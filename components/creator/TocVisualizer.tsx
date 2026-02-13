import React from 'react';
import { Badge } from '../ui/Badge';
import { TocElement, TocLevel, tocLevelLabels, tocLevelOrder, MappedIndicator } from '../../types/toc';

interface TocVisualizerProps {
  elements: TocElement[];
  indicators: MappedIndicator[];
  selectedElementId?: string;
  onSelectElement: (element: TocElement) => void;
}

export const TocVisualizer: React.FC<TocVisualizerProps> = ({
  elements,
  indicators,
  selectedElementId,
  onSelectElement,
}) => {
  // Group elements by level
  const grouped = tocLevelOrder.reduce((acc, level) => {
    acc[level] = elements.filter(e => e.level === level);
    return acc;
  }, {} as Record<TocLevel, TocElement[]>);

  // Count indicators per element
  const indicatorCounts = indicators.reduce((acc, ind) => {
    acc[ind.tocElementId] = (acc[ind.tocElementId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Count total indicators per level
  const levelCounts = tocLevelOrder.reduce((acc, level) => {
    acc[level] = elements
      .filter(e => e.level === level)
      .reduce((sum, e) => sum + (indicatorCounts[e.id] || 0), 0);
    return acc;
  }, {} as Record<TocLevel, number>);

  const getLevelColor = (level: TocLevel) => {
    switch (level) {
      case 'impact': return 'bg-purple-500/20 border-purple-500/50';
      case 'longterm': return 'bg-blue-500/20 border-blue-500/50';
      case 'midterm': return 'bg-teal-500/20 border-teal-500/50';
      case 'shortterm': return 'bg-amber-500/20 border-amber-500/50';
      case 'activities': return 'bg-gray-500/20 border-gray-500/50';
    }
  };

  const getBadgeVariant = (level: TocLevel) => {
    switch (level) {
      case 'impact': return 'error';
      case 'longterm': return 'info';
      case 'midterm': return 'success';
      case 'shortterm': return 'warning';
      case 'activities': return 'default';
    }
  };

  return (
    <div className="space-y-3">
      {tocLevelOrder.map(level => {
        const levelElements = grouped[level];
        if (levelElements.length === 0) return null;

        return (
          <div key={level} className={`rounded-lg border p-4 ${getLevelColor(level)}`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm uppercase tracking-wide">
                {tocLevelLabels[level]}
              </h3>
              <Badge variant={getBadgeVariant(level)}>
                {levelCounts[level]} indicator{levelCounts[level] !== 1 ? 's' : ''}
              </Badge>
            </div>

            <div className="space-y-2">
              {levelElements.map(element => {
                const count = indicatorCounts[element.id] || 0;
                const isSelected = element.id === selectedElementId;

                return (
                  <button
                    key={element.id}
                    onClick={() => onSelectElement(element)}
                    className={`w-full text-left p-3 rounded-lg transition flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'bg-[#c9a227]/20 ring-2 ring-[#c9a227]'
                        : 'bg-white/50 dark:bg-black/30 hover:bg-white dark:hover:bg-black/50'
                    }`}
                  >
                    <span className="flex-1">{element.text}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      count > 0
                        ? 'bg-green-500/20 text-green-600 dark:text-green-400'
                        : 'bg-gray-500/20 text-gray-500'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
