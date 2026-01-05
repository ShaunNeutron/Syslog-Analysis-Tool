import { useState, useCallback } from 'react';
import { Shield, AlertCircle } from 'lucide-react';
import { LogUploader } from './components/LogUploader';
import { LogAnalyzer, LogEntry } from './components/LogAnalyzer';
import { OllamaConfig } from './components/OllamaConfig';
import { SyslogListener } from './components/SyslogListener';
import { RuleManager, LogRule } from './components/RuleManager';
import { RealTimeLogViewer } from './components/RealTimeLogViewer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from './components/ui/alert';
import { parseAndMatchLogs } from './utils/logParser';
import { batchAnalyzeLogs, analyzeLogWithOllama } from './utils/ollamaService';
import { matchRules } from './utils/logParser';
import { toast } from 'sonner';
import { Toaster } from './components/ui/sonner';
import { Progress } from './components/ui/progress';

export default function App() {
  const [ollamaConfig, setOllamaConfig] = useState({
    endpoint: 'http://localhost:11434',
    model: 'llama3.2',
  });
  
  // Batch analysis
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisTotal, setAnalysisTotal] = useState(0);

  // Real-time monitoring
  const [isListening, setIsListening] = useState(false);
  const [realtimeLogs, setRealtimeLogs] = useState<LogEntry[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [bufferedLogs, setBufferedLogs] = useState<string[]>([]);

  // Rules
  const [rules, setRules] = useState<LogRule[]>([]);

  const handleLogsSubmit = async (rawLogs: string) => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setAnalysisTotal(0);
    
    try {
      // Parse logs and match with custom rules
      const parsedLogs = parseAndMatchLogs(rawLogs, rules);
      toast.success(`Parsed ${parsedLogs.length} log entries`);
      
      // Analyze with Ollama (only logs without rule matches)
      toast.info('Analyzing logs with Ollama AI...');
      const analyzedLogs = await batchAnalyzeLogs(
        parsedLogs,
        ollamaConfig,
        (current, total) => {
          setAnalysisProgress(current);
          setAnalysisTotal(total);
        }
      );
      
      setLogs(analyzedLogs);
      toast.success('Analysis complete!');
    } catch (error) {
      console.error('Error analyzing logs:', error);
      toast.error('Failed to analyze logs. Check Ollama connection.');
      
      // Still show parsed logs without AI analysis
      const parsedLogs = parseAndMatchLogs(rawLogs, rules);
      setLogs(parsedLogs);
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress(0);
      setAnalysisTotal(0);
    }
  };

  const handleConfigChange = (config: { endpoint: string; model: string }) => {
    setOllamaConfig(config);
    toast.success('Configuration saved!');
  };

  const handleToggleListener = (port: number) => {
    setIsListening(!isListening);
    if (!isListening) {
      toast.success(`Syslog listener started on UDP/${port}`);
    } else {
      toast.info('Syslog listener stopped');
      // Process any buffered logs
      if (bufferedLogs.length > 0) {
        processBufferedLogs();
      }
    }
  };

  const handleLogReceived = useCallback((rawLog: string) => {
    if (isPaused) {
      setBufferedLogs(prev => [...prev, rawLog]);
      return;
    }

    // Parse and match with rules
    const parsedLogs = parseAndMatchLogs(rawLog, rules);
    
    // Add unique IDs to logs for tracking
    const logsWithIds = parsedLogs.map(log => ({
      ...log,
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    }));
    
    // Add logs to real-time view immediately
    setRealtimeLogs(prev => [...prev, ...logsWithIds]);

    // Analyze critical/warning logs without AI analysis in background
    logsWithIds.forEach(async (log) => {
      const shouldAnalyze = 
        (log.severity === 'critical' || log.severity === 'warning') && 
        !log.aiAnalysis;

      if (shouldAnalyze) {
        console.log('🤖 Sending log to Ollama for analysis:', log.message.substring(0, 80));
        try {
          const analyzedLog = await analyzeLogWithOllama(log, ollamaConfig);
          console.log('✅ Received AI analysis:', analyzedLog.aiAnalysis);
          
          // Update the specific log entry with AI analysis by ID
          setRealtimeLogs(prev => 
            prev.map(l => 
              l.id === log.id ? { ...analyzedLog, id: log.id } : l
            )
          );
          
          toast.info('AI analysis complete', { duration: 2000 });
        } catch (error) {
          console.error('❌ Failed to analyze log with Ollama:', error);
          toast.error('Ollama analysis failed. Check connection.', { duration: 3000 });
        }
      }
    });

    // Show toast for critical logs
    parsedLogs.forEach(log => {
      if (log.severity === 'critical') {
        toast.error(`Critical: ${log.message.substring(0, 50)}...`, {
          duration: 5000,
        });
      } else if (log.category === 'security') {
        toast.warning(`Security Alert: ${log.message.substring(0, 50)}...`, {
          duration: 5000,
        });
      }
    });
  }, [isPaused, rules, ollamaConfig]);

  const processBufferedLogs = () => {
    if (bufferedLogs.length > 0) {
      bufferedLogs.forEach(log => {
        const parsedLogs = parseAndMatchLogs(log, rules);
        setRealtimeLogs(prev => [...prev, ...parsedLogs]);
      });
      setBufferedLogs([]);
      toast.info(`Processed ${bufferedLogs.length} buffered logs`);
    }
  };

  const handleTogglePause = () => {
    setIsPaused(!isPaused);
    if (isPaused) {
      // Resume - process buffered logs
      processBufferedLogs();
      toast.info('Log stream resumed');
    } else {
      toast.info('Log stream paused');
    }
  };

  const handleClearRealtimeLogs = () => {
    setRealtimeLogs([]);
    setBufferedLogs([]);
    toast.success('Real-time logs cleared');
  };

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            <div>
              <h1>Syslog Analysis Tool</h1>
              <p className="text-sm text-muted-foreground">
                AI-powered security and system failure detection for OPNSense, Linux & Unifi
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Setup Instructions */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Setup Required</AlertTitle>
            <AlertDescription>
              This tool requires Ollama running locally. Install from{' '}
              <a 
                href="https://ollama.ai" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline text-primary"
              >
                ollama.ai
              </a>
              {' '}and run: <code className="bg-muted px-2 py-1 rounded text-xs">ollama pull llama3.2</code>
            </AlertDescription>
          </Alert>

          {/* Analysis Progress */}
          {isAnalyzing && analysisTotal > 0 && (
            <Alert>
              <AlertTitle>Analyzing Logs...</AlertTitle>
              <AlertDescription>
                <div className="space-y-2 mt-2">
                  <Progress value={(analysisProgress / analysisTotal) * 100} />
                  <p className="text-sm">
                    Processing {analysisProgress} of {analysisTotal} critical/warning logs
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="realtime" className="w-full">
            <TabsList className="grid w-full grid-cols-5 max-w-3xl">
              <TabsTrigger value="realtime">
                Real-Time ({realtimeLogs.length})
              </TabsTrigger>
              <TabsTrigger value="upload">Batch Upload</TabsTrigger>
              <TabsTrigger value="results" disabled={logs.length === 0}>
                Results ({logs.length})
              </TabsTrigger>
              <TabsTrigger value="rules">
                Rules ({rules.length})
              </TabsTrigger>
              <TabsTrigger value="config">Config</TabsTrigger>
            </TabsList>

            <TabsContent value="realtime" className="mt-6 space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <SyslogListener
                  onLogReceived={handleLogReceived}
                  isListening={isListening}
                  onToggleListener={handleToggleListener}
                />
                <div className="space-y-4">
                  <Alert>
                    <AlertTitle>Active Rules</AlertTitle>
                    <AlertDescription>
                      {rules.filter(r => r.enabled).length} of {rules.length} rules active.
                      {rules.length === 0 && (
                        <span className="block mt-2">
                          Configure custom rules in the Rules tab to automatically flag important logs.
                        </span>
                      )}
                    </AlertDescription>
                  </Alert>
                </div>
              </div>
              <RealTimeLogViewer
                logs={realtimeLogs}
                onClearLogs={handleClearRealtimeLogs}
                isPaused={isPaused}
                onTogglePause={handleTogglePause}
                isListening={isListening}
              />
            </TabsContent>

            <TabsContent value="upload" className="mt-6">
              <LogUploader 
                onLogsSubmit={handleLogsSubmit} 
                isAnalyzing={isAnalyzing}
              />
            </TabsContent>

            <TabsContent value="results" className="mt-6">
              {logs.length > 0 ? (
                <LogAnalyzer logs={logs} />
              ) : (
                <Alert>
                  <AlertDescription>
                    No logs analyzed yet. Upload or paste logs to get started.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="rules" className="mt-6">
              <RuleManager rules={rules} onRulesChange={setRules} />
            </TabsContent>

            <TabsContent value="config" className="mt-6">
              <OllamaConfig 
                config={ollamaConfig} 
                onConfigChange={handleConfigChange}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>Syslog Analysis Tool with Ollama AI • Supports OPNSense, Linux & Unifi logs</p>
        </div>
      </footer>
    </div>
  );
}