import { useState, useRef } from 'react';
import { Upload, Flame, FileSpreadsheet, AlertCircle } from 'lucide-react';
import Papa from 'papaparse';

export default function CSVUploader({ onLeadsLoaded }) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);

  const processCSV = (file) => {
    setIsLoading(true);
    setError(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setIsLoading(false);
        
        if (results.errors.length > 0) {
          setError('Error parsing CSV file. Please check the format.');
          return;
        }

        // Try to find phone number column
        const headers = results.meta.fields || [];
        const phoneColumn = headers.find(h => 
          /phone|mobile|cell|tel|number/i.test(h)
        );
        const nameColumn = headers.find(h => 
          /name|business|company|title/i.test(h)
        );
        const addressColumn = headers.find(h => 
          /address|location|street/i.test(h)
        );

        if (!phoneColumn) {
          setError('No phone number column found. Please ensure your CSV has a column with "phone", "mobile", or "number" in the header.');
          return;
        }

        const leads = results.data
          .filter(row => row[phoneColumn] && row[phoneColumn].trim())
          .map((row, index) => ({
            id: index + 1,
            name: nameColumn ? row[nameColumn] : `Lead ${index + 1}`,
            phone: row[phoneColumn].replace(/[^\d+]/g, ''),
            phoneDisplay: row[phoneColumn],
            address: addressColumn ? row[addressColumn] : null,
            raw: row,
          }));

        if (leads.length === 0) {
          setError('No valid leads found with phone numbers.');
          return;
        }

        onLeadsLoaded(leads);
      },
      error: () => {
        setIsLoading(false);
        setError('Failed to read file. Please try again.');
      }
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'text/csv') {
      processCSV(file);
    } else {
      setError('Please upload a CSV file.');
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      processCSV(file);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 safe-area-top safe-area-bottom">
      {/* Header */}
      <div className="text-center mb-12 animate-fade-in-up">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-14 h-14 rounded-2xl brand-gradient flex items-center justify-center shadow-lg">
            <Flame className="w-8 h-8 text-white" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-slate-800 mb-2">
          <span className="brand-gradient-text">Prometheus</span>
        </h1>
        <p className="text-slate-500 text-lg">Ignite your sales pipeline</p>
      </div>

      {/* Upload Area */}
      <div 
        className={`
          w-full max-w-md aspect-square rounded-[3rem] border-3 border-dashed 
          transition-all duration-300 flex flex-col items-center justify-center
          cursor-pointer touch-feedback premium-surface
          ${isDragging 
            ? 'border-[var(--color-brand-orange)] bg-orange-50/50 scale-[1.02]' 
            : 'border-slate-200 hover:border-slate-300'
          }
          ${isLoading ? 'pointer-events-none opacity-70' : ''}
        `}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          className="hidden"
        />

        {isLoading ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full border-4 border-slate-200 border-t-[var(--color-brand-orange)] animate-spin" />
            <p className="text-slate-500 font-medium">Processing leads...</p>
          </div>
        ) : (
          <>
            <div className={`
              w-20 h-20 rounded-3xl mb-6 flex items-center justify-center
              transition-all duration-300
              ${isDragging ? 'brand-gradient scale-110' : 'bg-slate-100'}
            `}>
              {isDragging ? (
                <FileSpreadsheet className="w-10 h-10 text-white" />
              ) : (
                <Upload className="w-10 h-10 text-slate-400" />
              )}
            </div>
            
            <h2 className="text-xl font-semibold text-slate-700 mb-2">
              {isDragging ? 'Drop your leads' : 'Upload Leads CSV'}
            </h2>
            <p className="text-slate-400 text-center px-8">
              Tap here or drag & drop your CSV file with lead phone numbers
            </p>
          </>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-6 px-6 py-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 max-w-md animate-fade-in-up">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Hint */}
      <p className="mt-8 text-slate-400 text-sm text-center max-w-xs">
        Your CSV should have a column for phone numbers. We'll detect it automatically.
      </p>
    </div>
  );
}
