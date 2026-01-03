import { LogEntry } from '../components/LogAnalyzer';

export interface OllamaConfig {
  endpoint: string;
  model: string;
}

export async function analyzeLogWithOllama(
  logEntry: LogEntry,
  config: OllamaConfig
): Promise<LogEntry> {
  try {
    const prompt = `Analyze this system log entry and determine:
1. Is this a security concern? (intrusion attempt, unauthorized access, etc.)
2. Is this a system failure? (crash, service down, hardware issue, etc.)
3. Severity level (critical, warning, info, normal)
4. Brief explanation of the issue

Log: ${logEntry.message}

Respond in this format:
Category: [security/system-failure/network/other]
Severity: [critical/warning/info/normal]
Analysis: [brief explanation]`;

    const response = await fetch(`${config.endpoint}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model,
        prompt: prompt,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = data.response;

    // Parse AI response
    const categoryMatch = aiResponse.match(/Category:\s*(\w+[-\w]*)/i);
    const severityMatch = aiResponse.match(/Severity:\s*(\w+)/i);
    const analysisMatch = aiResponse.match(/Analysis:\s*(.+?)(?:\n|$)/i);

    const category = categoryMatch?.[1]?.toLowerCase() as LogEntry['category'];
    const severity = severityMatch?.[1]?.toLowerCase() as LogEntry['severity'];
    const analysis = analysisMatch?.[1]?.trim();

    return {
      ...logEntry,
      category: category || logEntry.category,
      severity: severity || logEntry.severity,
      aiAnalysis: analysis || aiResponse.substring(0, 200),
    };
  } catch (error) {
    console.error('Error analyzing log with Ollama:', error);
    return {
      ...logEntry,
      aiAnalysis: `Error: ${error instanceof Error ? error.message : 'Failed to analyze'}`,
    };
  }
}

export async function batchAnalyzeLogs(
  logs: LogEntry[],
  config: OllamaConfig,
  onProgress?: (current: number, total: number) => void
): Promise<LogEntry[]> {
  const analyzedLogs: LogEntry[] = [];
  
  // Only analyze logs that don't already have AI analysis from rules
  // and are critical or warning severity, limit to first 20 logs to save time
  const logsToAnalyze = logs.filter(
    log => !log.aiAnalysis && (log.severity === 'critical' || log.severity === 'warning')
  ).slice(0, 20);
  
  const skipLogs = logs.filter(
    log => !logsToAnalyze.includes(log)
  );

  for (let i = 0; i < logsToAnalyze.length; i++) {
    const analyzedLog = await analyzeLogWithOllama(logsToAnalyze[i], config);
    analyzedLogs.push(analyzedLog);
    
    if (onProgress) {
      onProgress(i + 1, logsToAnalyze.length);
    }
  }

  return [...analyzedLogs, ...skipLogs];
}