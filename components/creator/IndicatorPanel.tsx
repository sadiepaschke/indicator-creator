import React, { useState, useMemo } from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { TocElement, MappedIndicator, tocLevelLabels, tocToIndicatorLevel } from '../../types/toc';
import { IndicatorForm } from './IndicatorForm';
import { indicators as libraryIndicators, searchIndicators } from '../../data/indicators';

interface IndicatorPanelProps {
  element: TocElement;
  indicators: MappedIndicator[];
  onAddIndicator: (indicator: MappedIndicator) => void;
  onRemoveIndicator: (indicatorId: string) => void;
  onEditIndicator: (indicator: MappedIndicator) => void;
  sector?: string;
}

export const IndicatorPanel: React.FC<IndicatorPanelProps> = ({
  element,
  indicators,
  onAddIndicator,
  onRemoveIndicator,
  onEditIndicator,
  sector,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingIndicator, setEditingIndicator] = useState<MappedIndicator | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Get indicators for this element
  const elementIndicators = indicators.filter(i => i.tocElementId === element.id);

  // Get suggested indicators from library
  const suggestions = useMemo(() => {
    const targetLevel = tocToIndicatorLevel[element.level];
    // Search library based on element text
    const words = element.text.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const query = words.slice(0, 3).join(' ');
    return searchIndicators(query, sector, targetLevel).slice(0, 5);
  }, [element, sector]);

  const handleSave = (indicator: MappedIndicator) => {
    if (editingIndicator) {
      onEditIndicator(indicator);
    } else {
      onAddIndicator(indicator);
    }
    setShowForm(false);
    setEditingIndicator(null);
  };

  const handleEdit = (indicator: MappedIndicator) => {
    setEditingIndicator(indicator);
    setShowForm(true);
  };

  const handleAddFromLibrary = (libraryIndicator: typeof libraryIndicators[0]) => {
    const mapped: MappedIndicator = {
      id: crypto.randomUUID(),
      tocElementId: element.id,
      name: libraryIndicator.name,
      definition: libraryIndicator.definition,
      level: libraryIndicator.level,
      dataSource: libraryIndicator.dataSource,
      collectionMethod: libraryIndicator.collectionMethod,
      frequency: libraryIndicator.frequency,
      disaggregation: libraryIndicator.disaggregation,
      numerator: libraryIndicator.numerator,
      denominator: libraryIndicator.denominator,
      unitOfMeasure: libraryIndicator.unitOfMeasure,
    };
    onAddIndicator(mapped);
    setShowSuggestions(false);
  };

  if (showForm) {
    return (
      <IndicatorForm
        tocElement={element}
        existingIndicator={editingIndicator || undefined}
        onSave={handleSave}
        onCancel={() => { setShowForm(false); setEditingIndicator(null); }}
      />
    );
  }

  return (
    <Card className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Badge variant={element.level === 'impact' ? 'error' : element.level === 'activities' ? 'default' : 'warning'}>
            {tocLevelLabels[element.level]}
          </Badge>
          <h3 className="font-semibold mt-2">{element.text}</h3>
        </div>
      </div>

      {/* Existing indicators */}
      {elementIndicators.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-[#c9a227]">
            Indicators ({elementIndicators.length})
          </h4>
          {elementIndicators.map(indicator => (
            <div
              key={indicator.id}
              className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="font-medium text-sm">{indicator.name}</p>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{indicator.definition}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge>{indicator.level}</Badge>
                    {indicator.smartScore && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        indicator.smartScore >= 70 ? 'bg-green-500/20 text-green-600' :
                        indicator.smartScore >= 40 ? 'bg-yellow-500/20 text-yellow-600' :
                        'bg-red-500/20 text-red-600'
                      }`}>
                        SMART: {indicator.smartScore}%
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(indicator)}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                    title="Edit"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onRemoveIndicator(indicator.id)}
                    className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-500"
                    title="Remove"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button primary onClick={() => setShowForm(true)}>
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Custom
        </Button>
        {suggestions.length > 0 && (
          <Button onClick={() => setShowSuggestions(!showSuggestions)}>
            {showSuggestions ? 'Hide' : 'Show'} Suggestions ({suggestions.length})
          </Button>
        )}
      </div>

      {/* Library suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-500">From Indicator Library</h4>
          {suggestions.map(suggestion => (
            <div
              key={suggestion.id}
              className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="font-medium text-sm">{suggestion.name}</p>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{suggestion.definition}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="info">{suggestion.sector}</Badge>
                    <Badge>{suggestion.level}</Badge>
                  </div>
                </div>
                <Button onClick={() => handleAddFromLibrary(suggestion)}>
                  Add
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
