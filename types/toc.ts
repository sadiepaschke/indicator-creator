// Theory of Change types for Indicator Creator

export type TocLevel = 'impact' | 'longterm' | 'midterm' | 'shortterm' | 'activities';

export interface TocElement {
  id: string;
  text: string;
  level: TocLevel;
}

export interface TocData {
  projectName?: string;
  sector?: string;
  impact?: string;
  outcomes: {
    longterm: string[];
    midterm: string[];
    shortterm: string[];
  };
  activities: string[];
}

export interface MappedIndicator {
  id: string;
  tocElementId: string;
  name: string;
  definition: string;
  level: 'output' | 'outcome' | 'impact';
  dataSource?: string;
  collectionMethod?: string;
  frequency?: string;
  disaggregation?: string[];
  numerator?: string;
  denominator?: string;
  unitOfMeasure?: string;
  baseline?: string;
  target?: string;
  smartScore?: number;
}

export interface IndicatorMatrix {
  projectName?: string;
  sector?: string;
  createdAt: string;
  elements: TocElement[];
  indicators: MappedIndicator[];
}

// Map ToC level to indicator level
export const tocToIndicatorLevel: Record<TocLevel, 'output' | 'outcome' | 'impact'> = {
  impact: 'impact',
  longterm: 'outcome',
  midterm: 'outcome',
  shortterm: 'output',
  activities: 'output',
};

export const tocLevelLabels: Record<TocLevel, string> = {
  impact: 'Impact',
  longterm: 'Long-term Outcomes',
  midterm: 'Mid-term Outcomes',
  shortterm: 'Short-term Outcomes',
  activities: 'Activities / Outputs',
};

export const tocLevelOrder: TocLevel[] = ['impact', 'longterm', 'midterm', 'shortterm', 'activities'];
