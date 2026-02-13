import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { TocElement, MappedIndicator, tocToIndicatorLevel } from '../../types/toc';

interface IndicatorFormProps {
  tocElement: TocElement;
  existingIndicator?: MappedIndicator;
  onSave: (indicator: MappedIndicator) => void;
  onCancel: () => void;
}

const DISAGGREGATION_OPTIONS = [
  'Sex', 'Age', 'Geographic location', 'Disability status',
  'Income level', 'Education level', 'Urban/Rural', 'Ethnicity',
];

const FREQUENCY_OPTIONS = [
  'Monthly', 'Quarterly', 'Annually', 'Baseline/Endline', 'Continuous',
];

// Simple SMART analysis
const analyzeSmartScore = (name: string, definition: string): number => {
  let score = 0;
  const combined = `${name} ${definition}`.toLowerCase();

  // Specific: Has target group?
  if (/of\s+\w+|among\s+\w+|for\s+\w+/.test(combined)) score += 20;

  // Measurable: Has quantifier?
  if (/percentage|number|rate|%|count|score|ratio|proportion/.test(combined)) score += 25;

  // Achievable: Reasonable length indicates detail
  if (definition.length > 30) score += 15;

  // Relevant: Connected to outcome
  if (name.length > 15 && definition.length > 20) score += 20;

  // Time-bound: Has timeframe?
  if (/annual|monthly|quarterly|by\s+\d{4}|within|per\s+year|baseline|endline/.test(combined)) score += 20;

  return Math.min(100, score);
};

export const IndicatorForm: React.FC<IndicatorFormProps> = ({
  tocElement,
  existingIndicator,
  onSave,
  onCancel,
}) => {
  const [name, setName] = useState(existingIndicator?.name || '');
  const [definition, setDefinition] = useState(existingIndicator?.definition || '');
  const [numerator, setNumerator] = useState(existingIndicator?.numerator || '');
  const [denominator, setDenominator] = useState(existingIndicator?.denominator || '');
  const [unitOfMeasure, setUnitOfMeasure] = useState(existingIndicator?.unitOfMeasure || '');
  const [dataSource, setDataSource] = useState(existingIndicator?.dataSource || '');
  const [collectionMethod, setCollectionMethod] = useState(existingIndicator?.collectionMethod || '');
  const [frequency, setFrequency] = useState(existingIndicator?.frequency || '');
  const [disaggregation, setDisaggregation] = useState<string[]>(existingIndicator?.disaggregation || []);
  const [baseline, setBaseline] = useState(existingIndicator?.baseline || '');
  const [target, setTarget] = useState(existingIndicator?.target || '');

  const [smartScore, setSmartScore] = useState(0);

  useEffect(() => {
    setSmartScore(analyzeSmartScore(name, definition));
  }, [name, definition]);

  const handleSave = () => {
    if (!name.trim() || !definition.trim()) return;

    const indicator: MappedIndicator = {
      id: existingIndicator?.id || crypto.randomUUID(),
      tocElementId: tocElement.id,
      name: name.trim(),
      definition: definition.trim(),
      level: tocToIndicatorLevel[tocElement.level],
      numerator: numerator.trim() || undefined,
      denominator: denominator.trim() || undefined,
      unitOfMeasure: unitOfMeasure.trim() || undefined,
      dataSource: dataSource.trim() || undefined,
      collectionMethod: collectionMethod.trim() || undefined,
      frequency: frequency || undefined,
      disaggregation: disaggregation.length > 0 ? disaggregation : undefined,
      baseline: baseline.trim() || undefined,
      target: target.trim() || undefined,
      smartScore,
    };

    onSave(indicator);
  };

  const toggleDisaggregation = (option: string) => {
    setDisaggregation(prev =>
      prev.includes(option)
        ? prev.filter(d => d !== option)
        : [...prev, option]
    );
  };

  return (
    <Card className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold text-lg">
            {existingIndicator ? 'Edit Indicator' : 'Create Indicator'}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            For: {tocElement.text.slice(0, 60)}{tocElement.text.length > 60 ? '...' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">SMART Score</span>
          <span className={`text-lg font-bold ${
            smartScore >= 70 ? 'text-green-500' :
            smartScore >= 40 ? 'text-yellow-500' : 'text-red-500'
          }`}>
            {smartScore}%
          </span>
        </div>
      </div>

      <div className="grid gap-4">
        <Input
          label="Indicator Name *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Percentage of youth employed within 6 months of training"
        />

        <Textarea
          label="Definition *"
          value={definition}
          onChange={(e) => setDefinition(e.target.value)}
          placeholder="Describe what this indicator measures and how it's calculated..."
          rows={3}
        />

        <div className="grid md:grid-cols-2 gap-4">
          <Input
            label="Numerator"
            value={numerator}
            onChange={(e) => setNumerator(e.target.value)}
            placeholder="e.g., Number of youth employed"
          />
          <Input
            label="Denominator"
            value={denominator}
            onChange={(e) => setDenominator(e.target.value)}
            placeholder="e.g., Total youth trained"
          />
        </div>

        <Input
          label="Unit of Measure"
          value={unitOfMeasure}
          onChange={(e) => setUnitOfMeasure(e.target.value)}
          placeholder="e.g., Percentage, Number, Rate per 1000"
        />

        <div className="grid md:grid-cols-2 gap-4">
          <Input
            label="Data Source"
            value={dataSource}
            onChange={(e) => setDataSource(e.target.value)}
            placeholder="e.g., Program records, Surveys"
          />
          <Input
            label="Collection Method"
            value={collectionMethod}
            onChange={(e) => setCollectionMethod(e.target.value)}
            placeholder="e.g., Phone survey, Admin data"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Frequency</label>
          <div className="flex flex-wrap gap-2">
            {FREQUENCY_OPTIONS.map(option => (
              <button
                key={option}
                type="button"
                onClick={() => setFrequency(option === frequency ? '' : option)}
                className={`px-3 py-1 rounded-full text-sm transition ${
                  frequency === option
                    ? 'bg-[#c9a227] text-white'
                    : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Disaggregation</label>
          <div className="flex flex-wrap gap-2">
            {DISAGGREGATION_OPTIONS.map(option => (
              <button
                key={option}
                type="button"
                onClick={() => toggleDisaggregation(option)}
                className={`px-3 py-1 rounded-full text-sm transition ${
                  disaggregation.includes(option)
                    ? 'bg-[#c9a227] text-white'
                    : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Input
            label="Baseline Value"
            value={baseline}
            onChange={(e) => setBaseline(e.target.value)}
            placeholder="e.g., 25%"
          />
          <Input
            label="Target Value"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="e.g., 60%"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button onClick={onCancel}>Cancel</Button>
        <Button primary onClick={handleSave} disabled={!name.trim() || !definition.trim()}>
          {existingIndicator ? 'Update' : 'Add'} Indicator
        </Button>
      </div>
    </Card>
  );
};
