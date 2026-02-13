import { TocData, TocElement } from '../types/toc';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// Parse URL params from Impact Wizard
export const parseUrlParams = (): { tocData: TocData | null; fromWizard: boolean } => {
  const params = new URLSearchParams(window.location.search);
  const fromWizard = params.get('from') === 'wizard';

  if (!fromWizard && !params.get('impact') && !params.get('outcomes')) {
    return { tocData: null, fromWizard: false };
  }

  const impact = params.get('impact') || undefined;
  const outcomesRaw = params.get('outcomes');
  const sector = params.get('sector') || undefined;
  const projectName = params.get('program') || undefined;

  // Parse pipe-separated outcomes
  const outcomesList = outcomesRaw
    ? outcomesRaw.split('|').map(o => o.trim()).filter(Boolean)
    : [];

  // Distribute outcomes across tiers (simple heuristic: split evenly)
  const third = Math.ceil(outcomesList.length / 3);

  return {
    tocData: {
      projectName,
      sector,
      impact,
      outcomes: {
        longterm: outcomesList.slice(0, third),
        midterm: outcomesList.slice(third, third * 2),
        shortterm: outcomesList.slice(third * 2),
      },
      activities: [],
    },
    fromWizard,
  };
};

// Parse JSON file content
export const parseJsonToc = (content: string): TocData => {
  try {
    const data = JSON.parse(content);

    // Handle Impact Wizard format
    if (data.outcomes && Array.isArray(data.outcomes)) {
      const longterm = data.outcomes
        .filter((o: any) => o.tier === 'longterm')
        .map((o: any) => o.text);
      const midterm = data.outcomes
        .filter((o: any) => o.tier === 'midterm')
        .map((o: any) => o.text);
      const shortterm = data.outcomes
        .filter((o: any) => o.tier === 'shortterm')
        .map((o: any) => o.text);

      return {
        projectName: data.purpose?.goal?.[0] || undefined,
        sector: undefined,
        impact: data.impact || undefined,
        outcomes: { longterm, midterm, shortterm },
        activities: data.activities?.map((a: any) => a.text || a.output || a) || [],
      };
    }

    // Handle simple format
    return {
      projectName: data.projectName,
      sector: data.sector,
      impact: data.impact,
      outcomes: {
        longterm: data.outcomes?.longterm || data.longtermOutcomes || [],
        midterm: data.outcomes?.midterm || data.midtermOutcomes || [],
        shortterm: data.outcomes?.shortterm || data.shorttermOutcomes || [],
      },
      activities: data.activities || data.outputs || [],
    };
  } catch (e) {
    throw new Error('Invalid JSON format');
  }
};

// Parse CSV content (expects columns: level, text)
export const parseCsvToc = (content: string): TocData => {
  const lines = content.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV must have a header row and at least one data row');
  }

  const header = lines[0].toLowerCase().split(',').map(h => h.trim());
  const levelIdx = header.findIndex(h => h === 'level' || h === 'tier');
  const textIdx = header.findIndex(h => h === 'text' || h === 'description' || h === 'outcome' || h === 'activity');

  if (levelIdx === -1 || textIdx === -1) {
    throw new Error('CSV must have "level" and "text" columns');
  }

  const result: TocData = {
    outcomes: { longterm: [], midterm: [], shortterm: [] },
    activities: [],
  };

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
    const level = cols[levelIdx]?.toLowerCase();
    const text = cols[textIdx];

    if (!text) continue;

    switch (level) {
      case 'impact':
        result.impact = text;
        break;
      case 'longterm':
      case 'long-term':
      case 'long term':
        result.outcomes.longterm.push(text);
        break;
      case 'midterm':
      case 'mid-term':
      case 'mid term':
        result.outcomes.midterm.push(text);
        break;
      case 'shortterm':
      case 'short-term':
      case 'short term':
        result.outcomes.shortterm.push(text);
        break;
      case 'activity':
      case 'activities':
      case 'output':
      case 'outputs':
        result.activities.push(text);
        break;
    }
  }

  return result;
};

// Convert TocData to flat TocElement array
export const tocDataToElements = (data: TocData): TocElement[] => {
  const elements: TocElement[] = [];

  if (data.impact) {
    elements.push({
      id: 'impact-0',
      text: data.impact,
      level: 'impact',
    });
  }

  data.outcomes.longterm.forEach((text, i) => {
    elements.push({ id: `longterm-${i}`, text, level: 'longterm' });
  });

  data.outcomes.midterm.forEach((text, i) => {
    elements.push({ id: `midterm-${i}`, text, level: 'midterm' });
  });

  data.outcomes.shortterm.forEach((text, i) => {
    elements.push({ id: `shortterm-${i}`, text, level: 'shortterm' });
  });

  data.activities.forEach((text, i) => {
    elements.push({ id: `activities-${i}`, text, level: 'activities' });
  });

  return elements;
};

// Detect sector from text content
export const detectSector = (text: string): string | undefined => {
  const lower = text.toLowerCase();
  if (/education|school|student|teacher|learning|literacy/.test(lower)) return 'Education';
  if (/health|medical|disease|mortality|maternal|child health|immuniz/.test(lower)) return 'Health';
  if (/income|employment|job|business|enterprise|economic|financ/.test(lower)) return 'Economic Development';
  if (/agricult|farm|crop|food|nutrition|hunger/.test(lower)) return 'Agriculture & Food Security';
  if (/water|sanitation|wash|hygiene|toilet/.test(lower)) return 'WASH';
  if (/gender|women|girl|gbv|violence|disability|inclusion/.test(lower)) return 'Gender & Social Inclusion';
  if (/climate|environment|emission|energy|sustainab/.test(lower)) return 'Environment & Climate';
  if (/governance|civil society|civic|democrat|transparenc/.test(lower)) return 'Governance & Civil Society';
  if (/humanitarian|emergency|refugee|shelter|displaced/.test(lower)) return 'Humanitarian';
  if (/youth|young people|adolescent/.test(lower)) return 'Youth Development';
  return undefined;
};

// Parse PDF file
export const parsePdfFile = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    fullText += pageText + '\n';
  }

  return fullText;
};

// Parse Word document
export const parseWordFile = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
};

// Parse image file to base64 for AI processing
export const parseImageFile = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Extract ToC structure from unstructured text using pattern matching
export const parseTextToToc = (text: string): TocData => {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  const result: TocData = {
    outcomes: { longterm: [], midterm: [], shortterm: [] },
    activities: [],
  };

  type SectionType = 'impact' | 'longterm' | 'midterm' | 'shortterm' | 'activities';
  let currentSection: SectionType | null = null;

  // Pattern matching for section headers
  const sectionPatterns: Record<SectionType, RegExp> = {
    impact: /^(impact|goal|vision|ultimate\s*outcome|long[\s-]*term\s*goal)/i,
    longterm: /^(long[\s-]*term|final|ultimate|3-5\s*year)/i,
    midterm: /^(mid[\s-]*term|medium[\s-]*term|intermediate|1-3\s*year)/i,
    shortterm: /^(short[\s-]*term|immediate|initial|0-1\s*year|output)/i,
    activities: /^(activit|intervention|input|what\s*we\s*do|program\s*component)/i,
  };

  for (const line of lines) {
    // Check if this line is a section header
    let foundSection = false;
    for (const [section, pattern] of Object.entries(sectionPatterns)) {
      if (pattern.test(line)) {
        currentSection = section as SectionType;
        foundSection = true;
        break;
      }
    }

    if (foundSection) continue;

    // Skip short lines that are likely headers/labels
    if (line.length < 10) continue;

    // Add content to current section
    // Clean up bullet points and numbering
    const cleanLine = line.replace(/^[\s•\-\*\d\.\)]+/, '').trim();
    if (!cleanLine || cleanLine.length < 10) continue;

    if (currentSection === 'impact') {
      if (!result.impact) {
        result.impact = cleanLine;
      }
    } else if (currentSection === 'longterm') {
      result.outcomes.longterm.push(cleanLine);
    } else if (currentSection === 'midterm') {
      result.outcomes.midterm.push(cleanLine);
    } else if (currentSection === 'shortterm') {
      result.outcomes.shortterm.push(cleanLine);
    } else if (currentSection === 'activities') {
      result.activities.push(cleanLine);
    } else {
      // No section detected yet - try to infer from content
      if (/outcome|result|change|improvement|increase|decrease|reduce/i.test(cleanLine)) {
        // Likely an outcome - add to midterm by default
        result.outcomes.midterm.push(cleanLine);
      } else if (/train|workshop|provide|deliver|conduct|implement/i.test(cleanLine)) {
        // Likely an activity
        result.activities.push(cleanLine);
      }
    }
  }

  // If no structured sections found, try to distribute content intelligently
  if (!result.impact && result.outcomes.longterm.length === 0 &&
      result.outcomes.midterm.length === 0 && result.outcomes.shortterm.length === 0) {
    // Fall back to treating each substantial line as a potential outcome
    const substantiveLines = lines
      .map(l => l.replace(/^[\s•\-\*\d\.\)]+/, '').trim())
      .filter(l => l.length > 20);

    if (substantiveLines.length > 0) {
      result.impact = substantiveLines[0];
      const remaining = substantiveLines.slice(1);
      const third = Math.ceil(remaining.length / 3);
      result.outcomes.longterm = remaining.slice(0, third);
      result.outcomes.midterm = remaining.slice(third, third * 2);
      result.outcomes.shortterm = remaining.slice(third * 2);
    }
  }

  return result;
};
