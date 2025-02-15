import React, { useState } from 'react';
import { Upload, Calendar, FileOutput, Settings2 } from 'lucide-react';
import axios from 'axios';

interface ProcessingFunction {
  id: string;
  name: string;
  description: string;
}

interface ProcessingStatus {
  progress: number;
  message: string;
}

function App() {
  const [files, setFiles] = useState<File[]>([]);
  const [text1, setText1] = useState('');
  const [text2, setText2] = useState('');
  const [text3, setText3] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processedFilePath, setProcessedFilePath] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>({
    progress: 0,
    message: ''
  });
  
  const processingFunctions: ProcessingFunction[] = [
    { id: 'func1', name: 'Merge Files', description: 'Combine multiple Excel files into one' },
    { id: 'func2', name: 'Filter Data', description: 'Remove duplicate entries' },
    { id: 'func3', name: 'Sort Data', description: 'Sort by specified column' },
    { id: 'func4', name: 'Calculate Sum', description: 'Sum numeric columns' },
    { id: 'func5', name: 'Format Dates', description: 'Standardize date formats' },
    { id: 'func6', name: 'Remove Empty', description: 'Remove empty rows and columns' },
    { id: 'func7', name: 'Validate Data', description: 'Check data consistency' },
    { id: 'func8', name: 'Generate Report', description: 'Create summary report' },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
      setError(null);
    }
  };

  const handleProcessing = async (functionId: string) => {
    try {
      setLoading(true);
      setError(null);
      setProcessingStatus({ progress: 0, message: 'Starting processing...' });

      const formData = new FormData();
      files.forEach(file => formData.append('files', file));
      formData.append('text1', text1);
      formData.append('text2', text2);
      formData.append('text3', text3);
      formData.append('selected_date', selectedDate);

      const eventSource = new EventSource(`http://localhost:8000/api/status/${functionId}`);
      
      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setProcessingStatus({
          progress: data.progress,
          message: data.message
        });
      };

      const response = await axios.post(
        `http://localhost:8000/api/process/${functionId}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      eventSource.close();

      if (response.data.output_file) {
        setProcessedFilePath(response.data.output_file);
        setProcessingStatus({ progress: 100, message: 'Processing complete!' });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setProcessingStatus({ progress: 0, message: '' });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!processedFilePath) return;

    try {
      setLoading(true);
      const filename = processedFilePath.split('/').pop();
      const response = await axios.get(
        `http://localhost:8000/api/export/${filename}`,
        { responseType: 'blob' }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `processed_${filename}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Settings2 className="h-6 w-6 text-indigo-600" />
            <h1 className="text-xl font-semibold text-gray-900">Excel Processor</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Add Progress Status Display */}
        {loading && (
          <div className="mb-6 bg-white p-4 rounded-lg shadow-sm">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Processing Status</span>
                <span className="text-sm text-gray-500">{processingStatus.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300" 
                  style={{ width: `${processingStatus.progress}%` }}
                ></div>
              </div>
              {processingStatus.message && (
                <p className="text-sm text-gray-600">{processingStatus.message}</p>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* Input Section */}
          <div className="space-y-6 bg-white p-6 rounded-lg shadow-sm">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Excel Files
              </label>
              <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500">
                      <span>Upload files</span>
                      <input
                        id="file-upload"
                        type="file"
                        multiple
                        accept=".xlsx,.xls"
                        className="sr-only"
                        onChange={handleFileChange}
                        disabled={loading}
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">Excel files only</p>
                </div>
              </div>
              {files.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-gray-500">{files.length} file(s) selected</p>
                  <ul className="mt-1 text-xs text-gray-500">
                    {files.map((file, index) => (
                      <li key={index}>{file.name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Text Input 1</label>
                <input
                  type="text"
                  value={text1}
                  onChange={(e) => setText1(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Text Input 2</label>
                <input
                  type="text"
                  value={text2}
                  onChange={(e) => setText2(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Text Input 3</label>
                <input
                  type="text"
                  value={text3}
                  onChange={(e) => setText3(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="block w-full pl-10 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Processing Functions */}
          <div className="space-y-6 bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-medium text-gray-900">Processing Functions</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {processingFunctions.map((func) => (
                <button
                  key={func.id}
                  onClick={() => handleProcessing(func.id)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading || files.length === 0}
                >
                  {func.name}
                </button>
              ))}
            </div>

            {/* Export Button */}
            <div className="mt-6 border-t border-gray-200 pt-6">
              <button
                onClick={handleExport}
                disabled={loading || !processedFilePath}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileOutput className="mr-2 h-5 w-5" />
                {loading ? 'Processing...' : 'Export Processed File'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;