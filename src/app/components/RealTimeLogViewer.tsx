import { Activity, Pause, Play, Trash2, Loader2 } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { LogEntry } from './LogAnalyzer';
import { useEffect, useRef } from 'react';

interface RealTimeLogViewerProps {
  logs: LogEntry[];
  onClearLogs: () => void;
  isPaused: boolean;
  onTogglePause: () => void;
  isListening: boolean;
}

export function RealTimeLogViewer({
  logs,
  onClearLogs,
  isPaused,
  onTogglePause,
  isListening,
}: RealTimeLogViewerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const endOfLogsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isPaused && endOfLogsRef.current) {
      endOfLogsRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isPaused]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'info':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className={`w-5 h-5 ${isListening ? 'animate-pulse text-green-500' : 'text-gray-500'}`} />
            <h2>Real-Time Log Stream</h2>
            <Badge variant={isListening ? "default" : "secondary"}>
              {isListening ? 'ACTIVE' : 'INACTIVE'}
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onTogglePause}
              disabled={!isListening}
            >
              {isPaused ? (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Resume
                </>
              ) : (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onClearLogs}
              disabled={logs.length === 0}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Total Logs: {logs.length}</span>
            <span>
              Critical: {logs.filter(l => l.severity === 'critical').length} | 
              Warnings: {logs.filter(l => l.severity === 'warning').length}
            </span>
          </div>
        </div>

        <Card className="bg-black">
          <ScrollArea className="h-[600px] p-4">
            <div className="space-y-1 font-mono text-xs">
              {logs.length === 0 ? (
                <div className="text-gray-500 text-center py-12">
                  Waiting for logs...
                  <br />
                  {isListening ? 'Listening for incoming syslog messages' : 'Start the listener to receive logs'}
                </div>
              ) : (
                <>
                  {logs.map((log, index) => (
                    <div
                      key={index}
                      className={`p-2 rounded border ${getSeverityColor(log.severity)} flex flex-col gap-2`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-gray-500 min-w-[140px]">
                          {log.timestamp}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-xs min-w-[60px] justify-center"
                        >
                          {log.source.toUpperCase()}
                        </Badge>
                        {log.category && (
                          <Badge
                            className={`text-xs min-w-[80px] justify-center ${
                              log.category === 'security' ? 'bg-red-600' :
                              log.category === 'system-failure' ? 'bg-orange-600' :
                              'bg-blue-600'
                            }`}
                          >
                            {log.category}
                          </Badge>
                        )}
                        <span className="flex-1 break-all">{log.message}</span>
                      </div>
                      {log.aiAnalysis && (
                        <div className="ml-[140px] pl-2 border-l-2 border-purple-400 text-purple-100 italic">
                          🤖 AI: {log.aiAnalysis}
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={endOfLogsRef} />
                </>
              )}
            </div>
          </ScrollArea>
        </Card>

        {isPaused && logs.length > 0 && (
          <div className="text-sm text-yellow-600 bg-yellow-50 p-3 rounded border border-yellow-200">
            ⏸ Stream paused. New logs are being buffered but not displayed. Click Resume to continue.
          </div>
        )}
      </div>
    </Card>
  );
}