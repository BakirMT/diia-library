import * as React from "react"
import { X, FileText, Upload, FileUp } from "lucide-react"
import { Button } from "@/src/components/ui/button"

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: any[]) => void;
  type: 'books' | 'members' | 'librarians';
}

function parseCSV(csvText: string) {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) {
    throw new Error("CSV must have a header row and at least one data row.");
  }

  const parseLine = (line: string) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseLine(lines[0]);
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    const rowLine = lines[i];
    if (!rowLine.trim()) continue;
    const row = parseLine(rowLine);
    
    const obj: any = {};
    headers.forEach((header, index) => {
      let value = row[index] || '';
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      }
      obj[header] = value;
    });
    data.push(obj);
  }
  
  return data;
}

export function BulkImportModal({ isOpen, onClose, onImport, type }: BulkImportModalProps) {
  const [csvText, setCsvText] = React.useState('');
  const [error, setError] = React.useState('');
  const [activeTab, setActiveTab] = React.useState<'paste' | 'upload'>('upload');
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = React.useState('');

  if (!isOpen) return null;

  const handleImport = () => {
    try {
      if (!csvText.trim()) {
        throw new Error("No CSV data provided");
      }
      const parsed = parseCSV(csvText);
      onImport(parsed);
      setCsvText('');
      setFileName('');
      setError('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Invalid CSV format');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setError("Please upload a .csv file");
      return;
    }

    setFileName(file.name);
    setError('');

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === 'string') {
        setCsvText(text);
      }
    };
    reader.onerror = () => {
      setError("Error reading file");
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />
      
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl ring-1 ring-slate-100 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h2 className="text-lg font-bold text-slate-900">Bulk Import {type === 'books' ? 'Books' : 'Members'}</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="flex border-b border-slate-100 shrink-0">
          <button 
            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'upload' ? 'text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setActiveTab('upload')}
          >
            Upload CSV File
          </button>
          <button 
            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'paste' ? 'text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setActiveTab('paste')}
          >
            Paste CSV Text
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <div className="space-y-4">
            <div className="bg-blue-50 text-blue-700 p-4 rounded-xl text-sm">
              <p className="font-semibold mb-1">CSV Format Required</p>
              <p>Please provide CSV data containing the {type} data. The first row must contain the header columns.</p>
            </div>
            
            {activeTab === 'paste' ? (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">CSV Text</label>
                <textarea 
                  value={csvText}
                  onChange={e => {
                    setCsvText(e.target.value);
                    setError('');
                  }}
                  className="flex w-full rounded-xl bg-slate-100 px-4 py-3 text-sm text-[var(--color-text-main)] outline-none transition-colors placeholder:text-slate-400 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-teal-200 min-h-[200px] font-mono resize-y whitespace-pre" 
                  placeholder={`title,author,category\nExample Book,John Doe,Fiction`}
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div 
                  className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FileUp className="h-10 w-10 text-slate-400 mb-3" />
                  <p className="text-sm font-medium text-slate-900 mb-1">Click to upload Excel CSV file</p>
                  <p className="text-xs text-slate-500">Only .csv files are supported</p>
                  <input 
                    type="file" 
                    accept=".csv"
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                  />
                </div>
                {fileName && (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <FileText className="h-5 w-5 text-[var(--color-primary)]" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{fileName}</p>
                      <p className="text-xs text-slate-500">Ready to import</p>
                    </div>
                  </div>
                )}
              </div>
            )}
            {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
          </div>
        </div>
        
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 shrink-0 rounded-b-2xl">
          <Button variant="ghost" onClick={onClose} className="rounded-full">Cancel</Button>
          <Button onClick={handleImport} className="rounded-full px-6 flex items-center" disabled={!csvText.trim()}>
            <FileText className="w-4 h-4 mr-2" />
            Import Data
          </Button>
        </div>
      </div>
    </div>
  )
}
