import { Upload, FileText } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Card } from './ui/card';
import { useState } from 'react';

interface LogUploaderProps {
  onLogsSubmit: (logs: string) => void;
  isAnalyzing: boolean;
}

export function LogUploader({ onLogsSubmit, isAnalyzing }: LogUploaderProps) {
  const [logText, setLogText] = useState('');

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setLogText(content);
      };
      reader.readAsText(file);
    }
  };

  const handleSubmit = () => {
    if (logText.trim()) {
      onLogsSubmit(logText);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          <h2>Upload or Paste Logs</h2>
        </div>
        
        <div className="space-y-3">
          <div>
            <label 
              htmlFor="file-upload" 
              className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Upload Log File
            </label>
            <input
              id="file-upload"
              type="file"
              accept=".log,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          <Textarea
            placeholder="Or paste your OPNSense, Linux, or Unifi logs here..."
            value={logText}
            onChange={(e) => setLogText(e.target.value)}
            className="min-h-[300px] font-mono text-sm"
          />

          <Button 
            onClick={handleSubmit} 
            disabled={!logText.trim() || isAnalyzing}
            className="w-full"
          >
            {isAnalyzing ? 'Analyzing with Ollama AI...' : 'Analyze Logs'}
          </Button>
        </div>
      </div>
    </Card>
  );
}
