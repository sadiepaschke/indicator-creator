import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { TocElement, MappedIndicator, IndicatorMatrix, tocLevelLabels } from '../../types/toc';

interface ExportPanelProps {
  elements: TocElement[];
  indicators: MappedIndicator[];
  projectName?: string;
  sector?: string;
}

export const ExportPanel: React.FC<ExportPanelProps> = ({
  elements,
  indicators,
  projectName,
  sector,
}) => {
  const [copied, setCopied] = useState(false);

  const buildMatrix = (): IndicatorMatrix => ({
    projectName,
    sector,
    createdAt: new Date().toISOString(),
    elements,
    indicators,
  });

  const exportJSON = () => {
    const matrix = buildMatrix();
    const blob = new Blob([JSON.stringify(matrix, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `indicator-matrix-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    const headers = [
      'ToC Level',
      'ToC Element',
      'Indicator Name',
      'Definition',
      'Indicator Level',
      'Numerator',
      'Denominator',
      'Unit of Measure',
      'Data Source',
      'Collection Method',
      'Frequency',
      'Disaggregation',
      'Baseline',
      'Target',
      'SMART Score',
    ];

    const rows = indicators.map(ind => {
      const element = elements.find(e => e.id === ind.tocElementId);
      return [
        element ? tocLevelLabels[element.level] : '',
        element?.text || '',
        ind.name,
        ind.definition,
        ind.level,
        ind.numerator || '',
        ind.denominator || '',
        ind.unitOfMeasure || '',
        ind.dataSource || '',
        ind.collectionMethod || '',
        ind.frequency || '',
        ind.disaggregation?.join('; ') || '',
        ind.baseline || '',
        ind.target || '',
        ind.smartScore?.toString() || '',
      ].map(cell => `"${cell.replace(/"/g, '""')}"`);
    });

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `indicator-matrix-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = () => {
    const text = indicators.map(ind => {
      const element = elements.find(e => e.id === ind.tocElementId);
      return `${tocLevelLabels[element?.level || 'activities']}: ${element?.text}\n` +
        `  Indicator: ${ind.name}\n` +
        `  Definition: ${ind.definition}\n` +
        (ind.baseline || ind.target ? `  Baseline: ${ind.baseline || 'TBD'} → Target: ${ind.target || 'TBD'}\n` : '');
    }).join('\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Calculate summary stats
  const totalIndicators = indicators.length;
  const elementsWithIndicators = new Set(indicators.map(i => i.tocElementId)).size;
  const totalElements = elements.length;
  const avgSmartScore = indicators.length > 0
    ? Math.round(indicators.reduce((sum, i) => sum + (i.smartScore || 0), 0) / indicators.length)
    : 0;

  return (
    <Card className="space-y-4">
      <h3 className="font-semibold text-lg">Export Indicator Matrix</h3>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <p className="text-2xl font-bold text-[#c9a227]">{totalIndicators}</p>
          <p className="text-xs text-gray-500">Total Indicators</p>
        </div>
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <p className="text-2xl font-bold">{elementsWithIndicators}/{totalElements}</p>
          <p className="text-xs text-gray-500">Elements Covered</p>
        </div>
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <p className={`text-2xl font-bold ${
            avgSmartScore >= 70 ? 'text-green-500' :
            avgSmartScore >= 40 ? 'text-yellow-500' : 'text-red-500'
          }`}>
            {avgSmartScore}%
          </p>
          <p className="text-xs text-gray-500">Avg SMART Score</p>
        </div>
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <p className="text-2xl font-bold">{Math.round((elementsWithIndicators / totalElements) * 100)}%</p>
          <p className="text-xs text-gray-500">Coverage</p>
        </div>
      </div>

      {/* Export buttons */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={exportCSV}>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export CSV
        </Button>
        <Button onClick={exportJSON}>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export JSON
        </Button>
        <Button onClick={copyToClipboard}>
          {copied ? (
            <>
              <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy to Clipboard
            </>
          )}
        </Button>
      </div>

      {indicators.length === 0 && (
        <p className="text-sm text-gray-500 italic">
          No indicators created yet. Select a ToC element and add indicators to enable export.
        </p>
      )}
    </Card>
  );
};
