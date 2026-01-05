import { AlertTriangle, CheckCircle, XCircle, Info, Shield, Server } from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';

export interface LogEntry {
  id?: string;
  timestamp: string;
  source: 'opnsense' | 'linux' | 'unifi' | 'unknown';
  severity: 'critical' | 'warning' | 'info' | 'normal';
  message: string;
  aiAnalysis?: string;
  category?: 'security' | 'system-failure' | 'network' | 'other';
}

interface LogAnalyzerProps {
  logs: LogEntry[];
}

export function LogAnalyzer({ logs }: LogAnalyzerProps) {
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
      default:
        return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
  };

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'security':
        return <Shield className="w-4 h-4" />;
      case 'system-failure':
        return <Server className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500/10 border-red-500/20 text-red-700';
      case 'warning':
        return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-700';
      case 'info':
        return 'bg-blue-500/10 border-blue-500/20 text-blue-700';
      default:
        return 'bg-gray-500/10 border-gray-500/20 text-gray-700';
    }
  };

  const criticalLogs = logs.filter(log => log.severity === 'critical');
  const warningLogs = logs.filter(log => log.severity === 'warning');

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Logs</p>
              <p className="text-2xl">{logs.length}</p>
            </div>
            <FileText className="w-8 h-8 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-4 bg-red-500/5 border-red-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-700">Critical</p>
              <p className="text-2xl text-red-700">{criticalLogs.length}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
        </Card>

        <Card className="p-4 bg-yellow-500/5 border-yellow-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-700">Warnings</p>
              <p className="text-2xl text-yellow-700">{warningLogs.length}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-yellow-500" />
          </div>
        </Card>

        <Card className="p-4 bg-blue-500/5 border-blue-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700">Security Alerts</p>
              <p className="text-2xl text-blue-700">
                {logs.filter(l => l.category === 'security').length}
              </p>
            </div>
            <Shield className="w-8 h-8 text-blue-500" />
          </div>
        </Card>
      </div>

      {/* Log Entries */}
      <Card className="p-6">
        <h2 className="mb-4">Log Analysis Results</h2>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-3">
            {logs.map((log, index) => (
              <Card 
                key={index} 
                className={`p-4 ${getSeverityColor(log.severity)}`}
              >
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    {getSeverityIcon(log.severity)}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-mono text-muted-foreground">
                          {log.timestamp}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {log.source.toUpperCase()}
                        </Badge>
                        {log.category && (
                          <Badge variant="secondary" className="text-xs flex items-center gap-1">
                            {getCategoryIcon(log.category)}
                            {log.category}
                          </Badge>
                        )}
                        <Badge 
                          className={`text-xs ${
                            log.severity === 'critical' ? 'bg-red-500' :
                            log.severity === 'warning' ? 'bg-yellow-500' :
                            log.severity === 'info' ? 'bg-blue-500' : 'bg-gray-500'
                          }`}
                        >
                          {log.severity.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="font-mono text-sm break-all">{log.message}</p>
                      {log.aiAnalysis && (
                        <div className="mt-2 p-3 bg-background/50 rounded-md border">
                          <p className="text-sm">
                            <span className="font-semibold">AI Analysis: </span>
                            {log.aiAnalysis}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
}

function FileText({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" x2="8" y1="13" y2="13" />
      <line x1="16" x2="8" y1="17" y2="17" />
      <line x1="10" x2="8" y1="9" y2="9" />
    </svg>
  );
}