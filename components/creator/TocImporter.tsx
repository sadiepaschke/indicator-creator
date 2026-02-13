import React, { useState, useRef } from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Textarea } from '../ui/Textarea';
import { Input } from '../ui/Input';
import { TocData } from '../../types/toc';
import {
  parseJsonToc,
  parseCsvToc,
  parsePdfFile,
  parseWordFile,
  parseImageFile,
  parseTextToToc,
} from '../../services/tocParser';

interface TocImporterProps {
  onImport: (data: TocData) => void;
  initialData?: TocData;
}

type ImportMethod = 'file' | 'paste' | 'manual';

export const TocImporter: React.FC<TocImporterProps> = ({ onImport, initialData }) => {
  const [method, setMethod] = useState<ImportMethod>('manual');
  const [pasteContent, setPasteContent] = useState('');
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [extractedText, setExtractedText] = useState('');
  const [showExtractedText, setShowExtractedText] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manual entry state
  const [impact, setImpact] = useState(initialData?.impact || '');
  const [longterm, setLongterm] = useState(initialData?.outcomes?.longterm?.join('\n') || '');
  const [midterm, setMidterm] = useState(initialData?.outcomes?.midterm?.join('\n') || '');
  const [shortterm, setShortterm] = useState(initialData?.outcomes?.shortterm?.join('\n') || '');
  const [activities, setActivities] = useState(initialData?.activities?.join('\n') || '');
  const [projectName, setProjectName] = useState(initialData?.projectName || '');

  const handleFileUpload = async (file: File) => {
    setError('');
    setIsProcessing(true);
    setExtractedText('');
    setShowExtractedText(false);

    try {
      const fileName = file.name.toLowerCase();
      let data: TocData;

      if (fileName.endsWith('.json')) {
        setProcessingStatus('Parsing JSON...');
        const content = await file.text();
        data = parseJsonToc(content);
        onImport(data);
      } else if (fileName.endsWith('.csv')) {
        setProcessingStatus('Parsing CSV...');
        const content = await file.text();
        data = parseCsvToc(content);
        onImport(data);
      } else if (fileName.endsWith('.pdf')) {
        setProcessingStatus('Extracting text from PDF...');
        const text = await parsePdfFile(file);
        setExtractedText(text);
        setProcessingStatus('Analyzing structure...');
        data = parseTextToToc(text);

        // If we found structure, import it; otherwise show extracted text for review
        if (data.impact || data.outcomes.longterm.length || data.outcomes.midterm.length ||
            data.outcomes.shortterm.length || data.activities.length) {
          onImport(data);
        } else {
          setShowExtractedText(true);
          setError('Could not automatically detect ToC structure. Please review the extracted text below and copy relevant sections to manual entry.');
        }
      } else if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
        setProcessingStatus('Extracting text from Word document...');
        const text = await parseWordFile(file);
        setExtractedText(text);
        setProcessingStatus('Analyzing structure...');
        data = parseTextToToc(text);

        if (data.impact || data.outcomes.longterm.length || data.outcomes.midterm.length ||
            data.outcomes.shortterm.length || data.activities.length) {
          onImport(data);
        } else {
          setShowExtractedText(true);
          setError('Could not automatically detect ToC structure. Please review the extracted text below and copy relevant sections to manual entry.');
        }
      } else if (fileName.endsWith('.png') || fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) {
        setProcessingStatus('Processing image...');
        await parseImageFile(file); // Read file but we can't OCR client-side
        // For images, we need OCR - show message to user
        setExtractedText('');
        setShowExtractedText(false);
        setError('Image files require OCR processing. Please use a tool like Google Lens or an OCR service to extract text, then paste it using the "Paste Text" option.');
      } else {
        throw new Error('Unsupported file type. Use JSON, CSV, PDF, Word (.docx), or image files.');
      }
    } catch (e: any) {
      console.error('File parsing error:', e);
      setError(e.message || 'Failed to parse file');
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const handlePasteImport = () => {
    setError('');
    try {
      // First try JSON
      try {
        const data = parseJsonToc(pasteContent);
        onImport(data);
        return;
      } catch {
        // Not valid JSON, try as plain text
      }

      // Parse as plain text
      const data = parseTextToToc(pasteContent);
      if (data.impact || data.outcomes.longterm.length || data.outcomes.midterm.length ||
          data.outcomes.shortterm.length || data.activities.length) {
        onImport(data);
      } else {
        setError('Could not detect ToC structure. Try using Manual Entry instead.');
      }
    } catch (e: any) {
      setError(e.message || 'Failed to parse content');
    }
  };

  const handleManualImport = () => {
    const parseLines = (text: string) =>
      text.split('\n').map(l => l.trim()).filter(Boolean);

    const data: TocData = {
      projectName: projectName || undefined,
      impact: impact.trim() || undefined,
      outcomes: {
        longterm: parseLines(longterm),
        midterm: parseLines(midterm),
        shortterm: parseLines(shortterm),
      },
      activities: parseLines(activities),
    };

    if (!data.impact && !data.outcomes.longterm.length && !data.outcomes.midterm.length &&
        !data.outcomes.shortterm.length && !data.activities.length) {
      setError('Please enter at least one element');
      return;
    }

    onImport(data);
  };

  const copyToManual = () => {
    // Pre-fill manual entry with extracted text for user to organize
    setMethod('manual');
    // Put all text in the impact field so user can reorganize
    setImpact(extractedText.slice(0, 500));
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">Import Your Logic Model</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Start by importing your theory of change or logic model
        </p>
      </div>

      {/* Method tabs */}
      <div className="flex justify-center gap-2 mb-6">
        {[
          { id: 'manual', label: 'Manual Entry' },
          { id: 'file', label: 'Upload File' },
          { id: 'paste', label: 'Paste Text' },
        ].map(({ id, label }) => (
          <button
            key={id}
            onClick={() => { setMethod(id as ImportMethod); setError(''); setShowExtractedText(false); }}
            className={`px-4 py-2 rounded-lg transition ${
              method === id
                ? 'bg-gradient-to-r from-[#c9a227] to-[#6d4c9b] text-white'
                : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {method === 'file' && (
        <Card>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => !isProcessing && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-12 text-center transition ${
              isProcessing ? 'cursor-wait' : 'cursor-pointer'
            } ${
              dragOver
                ? 'border-[#c9a227] bg-[#c9a227]/10'
                : 'border-gray-300 dark:border-gray-700 hover:border-[#c9a227]'
            }`}
          >
            {isProcessing ? (
              <>
                <svg className="w-12 h-12 mx-auto mb-4 text-[#c9a227] animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p className="text-lg font-medium mb-1">{processingStatus}</p>
                <p className="text-sm text-gray-500">Please wait...</p>
              </>
            ) : (
              <>
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-lg font-medium mb-1">Drop your file here</p>
                <p className="text-sm text-gray-500">or click to browse</p>
                <div className="flex flex-wrap justify-center gap-2 mt-3">
                  <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">PDF</span>
                  <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">Word</span>
                  <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">PNG/JPG</span>
                  <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">JSON</span>
                  <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">CSV</span>
                </div>
              </>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.csv,.pdf,.doc,.docx,.png,.jpg,.jpeg"
            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
            className="hidden"
          />

          {/* Show extracted text for review */}
          {showExtractedText && extractedText && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">Extracted Text</h4>
                <Button onClick={copyToManual}>
                  Edit in Manual Entry
                </Button>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg max-h-64 overflow-y-auto">
                <pre className="text-xs whitespace-pre-wrap font-mono">{extractedText}</pre>
              </div>
            </div>
          )}
        </Card>
      )}

      {method === 'paste' && (
        <Card>
          <Textarea
            label="Paste your logic model content"
            value={pasteContent}
            onChange={(e) => setPasteContent(e.target.value)}
            placeholder="Paste text from your logic model document, or JSON format..."
            rows={10}
          />
          <p className="text-xs text-gray-500 mt-2">
            Tip: Include section headers like "Impact:", "Long-term Outcomes:", "Activities:" for better parsing.
          </p>
          <Button primary onClick={handlePasteImport} className="mt-4">
            Import Content
          </Button>
        </Card>
      )}

      {method === 'manual' && (
        <div className="space-y-4">
          <Card>
            <Input
              label="Project Name (optional)"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g., Youth Employment Program"
            />
          </Card>

          <Card>
            <Textarea
              label="Impact Statement"
              value={impact}
              onChange={(e) => setImpact(e.target.value)}
              placeholder="Your 5-year vision or ultimate goal..."
              rows={2}
            />
          </Card>

          <Card>
            <Textarea
              label="Long-term Outcomes (one per line)"
              value={longterm}
              onChange={(e) => setLongterm(e.target.value)}
              placeholder="Outcome that takes 3-5 years to achieve..."
              rows={3}
            />
          </Card>

          <Card>
            <Textarea
              label="Mid-term Outcomes (one per line)"
              value={midterm}
              onChange={(e) => setMidterm(e.target.value)}
              placeholder="Outcome that takes 1-3 years to achieve..."
              rows={3}
            />
          </Card>

          <Card>
            <Textarea
              label="Short-term Outcomes (one per line)"
              value={shortterm}
              onChange={(e) => setShortterm(e.target.value)}
              placeholder="Immediate changes (within 1 year)..."
              rows={3}
            />
          </Card>

          <Card>
            <Textarea
              label="Activities / Outputs (one per line)"
              value={activities}
              onChange={(e) => setActivities(e.target.value)}
              placeholder="What your program does or delivers..."
              rows={3}
            />
          </Card>

          <Button primary onClick={handleManualImport} className="w-full">
            Create Indicator Matrix
          </Button>
        </div>
      )}
    </div>
  );
};
