import React, { useCallback, useRef, useState } from 'react';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Trash2, FileText, Loader2, Download } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { parseCSV, ParseResult } from '@/lib/csvParser';
import { api } from '@/lib/api';
import { useFiles, useInvalidateStr } from '@/hooks/useStrData';
import { formatNumber } from '@/lib/analytics';
import { cn } from '@/lib/utils';

const SAMPLE_CSV = `date,property,guest,nights,revenue,expenses,occupancy,source
2026-05-01,Sunset Villa,John Smith,3,12500,2500,85,Airbnb
2026-05-04,Ocean Breeze Condo,Mary Johnson,5,18900,4200,92,VRBO
2026-05-09,Mountain Retreat,Carlos Lopez,2,8400,1800,75,Airbnb
2026-05-11,City Loft Manila,Anna Reyes,7,21000,4800,88,Booking.com
2026-05-18,Sunset Villa,Lee Chen,4,16800,3200,90,Airbnb`;

export const UploadPage: React.FC = () => {
  const { session, logActivity } = useAuth();
  const { data: files = [], isLoading, refetch } = useFiles();
  const invalidate = useInvalidateStr();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ parse: ParseResult; fileName: string } | null>(null);

  const handleFile = useCallback(async (file: File) => {
    setParsing(true);
    setResult(null);
    try {
      if (file.size > 10 * 1024 * 1024) {
        setResult({ parse: { success: false, records: [], detectedColumns: {}, errors: ['File exceeds 10MB limit.'], source: '' }, fileName: file.name });
        return;
      }
      if (!file.name.toLowerCase().endsWith('.csv')) {
        setResult({ parse: { success: false, records: [], detectedColumns: {}, errors: ['Only CSV files are accepted.'], source: '' }, fileName: file.name });
        return;
      }
      const text = await file.text();
      const parse = parseCSV(text, file.name);
      setResult({ parse, fileName: file.name });
    } catch {
      setResult({ parse: { success: false, records: [], detectedColumns: {}, errors: ['Failed to read file.'], source: '' }, fileName: file.name });
    } finally {
      setParsing(false);
    }
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const confirmImport = async () => {
    if (!result || !result.parse.success || !session) return;
    setImporting(true);
    try {
      await api.uploadCsv(result.fileName, result.parse.source, result.parse.records);
      logActivity('CSV_UPLOAD', `Uploaded ${result.fileName} with ${result.parse.records.length} records`);
      setResult(null);
      invalidate.records();
      invalidate.files();
      refetch();
    } catch (err) {
      setResult({
        ...result,
        parse: {
          ...result.parse,
          success: false,
          errors: [(err as Error).message || 'Upload failed. Is the API running?'],
        },
      });
    } finally {
      setImporting(false);
    }
  };

  const deleteFile = async (id: string) => {
    const f = files.find(x => x.id === id);
    try {
      await api.deleteFile(id);
      logActivity('FILE_DELETE', `Deleted file: ${f?.fileName}`);
      invalidate.records();
      invalidate.files();
      refetch();
    } catch {
      /* toast could be added */
    }
  };

  const downloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'str_sample.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const visibleFiles = session?.role === 'admin'
    ? files
    : files.filter(f => f.userId === session?.userId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">CSV Upload</h1>
          <p className="text-gray-500 dark:text-purple-300 text-sm mt-1">
            Upload data from Airbnb, VRBO, Booking.com — stored in MySQL
          </p>
        </div>
        <button
          onClick={downloadSample}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-purple-200 dark:border-purple-700 text-sm text-purple-700 dark:text-purple-200 hover:bg-purple-50 dark:hover:bg-purple-900/40 transition"
        >
          <Download className="h-4 w-4" />
          Download sample CSV
        </button>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all',
          dragOver
            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30'
            : 'border-purple-200 dark:border-purple-700/40 hover:border-purple-400 dark:hover:border-purple-500 bg-white dark:bg-gradient-to-br dark:from-[#231340] dark:to-[#1a0b2e]'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 mb-4 shadow-lg shadow-purple-500/30">
          {parsing ? <Loader2 className="h-7 w-7 text-white animate-spin" /> : <Upload className="h-7 w-7 text-white" />}
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
          {parsing ? 'Parsing file...' : 'Drop your CSV file here'}
        </h3>
        <p className="text-sm text-gray-500 dark:text-purple-300">
          or <span className="text-purple-600 dark:text-purple-400 font-medium">click to browse</span> (max 10MB)
        </p>
      </div>

      {result && (
        <div className={cn(
          'rounded-2xl p-6 border',
          result.parse.success
            ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30'
            : 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30'
        )}>
          <div className="flex items-start gap-3 mb-4">
            {result.parse.success
              ? <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              : <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400 flex-shrink-0" />}
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white">{result.fileName}</h3>
              <p className="text-sm text-gray-600 dark:text-purple-200">
                {result.parse.success
                  ? `Successfully parsed ${result.parse.records.length} records — Source: ${result.parse.source}`
                  : 'Parsing failed. See errors below.'}
              </p>
            </div>
          </div>

          {result.parse.errors.length > 0 && (
            <div className="mb-4 max-h-32 overflow-y-auto bg-white dark:bg-black/20 rounded-lg p-3 border border-red-200 dark:border-red-500/20">
              {result.parse.errors.slice(0, 10).map((err, i) => (
                <p key={i} className="text-xs text-red-700 dark:text-red-300">• {err}</p>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            {result.parse.success && (
              <button
                onClick={confirmImport}
                disabled={importing}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-violet-600 text-white text-sm font-medium disabled:opacity-60 flex items-center gap-2"
              >
                {importing && <Loader2 className="h-4 w-4 animate-spin" />}
                Confirm &amp; Import to MySQL
              </button>
            )}
            <button
              onClick={() => setResult(null)}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-purple-700 text-gray-700 dark:text-purple-200 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gradient-to-br dark:from-[#231340] dark:to-[#1a0b2e] rounded-2xl p-6 border border-purple-100 dark:border-purple-800/40 shadow-sm">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-purple-500" />
          Uploaded Files ({visibleFiles.length})
        </h3>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 text-purple-500 animate-spin" /></div>
        ) : visibleFiles.length === 0 ? (
          <p className="text-sm text-gray-400 py-6 text-center">No files uploaded yet</p>
        ) : (
          <div className="space-y-2">
            {visibleFiles.map(f => (
              <div key={f.id} className="flex items-center justify-between p-3 rounded-lg bg-purple-50/50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800/30">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center flex-shrink-0">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-gray-900 dark:text-white text-sm truncate">{f.fileName}</div>
                    <div className="text-xs text-gray-500 dark:text-purple-300">
                      {formatNumber(f.rowCount)} rows · {f.source} · {new Date(f.uploadedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => deleteFile(f.id)}
                  className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                  aria-label="Delete file"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
