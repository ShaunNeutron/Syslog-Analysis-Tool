import { LogEntry } from '../components/LogAnalyzer';
import { LogRule } from '../components/RuleManager';

export function parseLogSource(logLine: string): 'opnsense' | 'linux' | 'unifi' | 'unknown' {
  // OPNSense logs often contain "filterlog" or specific OPNSense keywords
  if (logLine.includes('filterlog') || logLine.includes('opnsense') || logLine.includes('pf:')) {
    return 'opnsense';
  }
  
  // Unifi logs often contain "U7PG2" or "UAP" or "USW" or "unifi" keywords
  if (logLine.match(/U[A-Z0-9]{2,}/i) || logLine.includes('unifi') || logLine.includes('hostapd')) {
    return 'unifi';
  }
  
  // Linux syslog format detection
  if (logLine.match(/^\w{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2}/) || 
      logLine.includes('kernel:') || 
      logLine.includes('systemd') ||
      logLine.match(/\[.*\]/)) {
    return 'linux';
  }
  
  return 'unknown';
}

export function parseTimestamp(logLine: string): string {
  // Try ISO 8601 format
  const isoMatch = logLine.match(/\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}/);
  if (isoMatch) return isoMatch[0];
  
  // Try syslog format (Jan 1 12:00:00)
  const syslogMatch = logLine.match(/\w{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2}/);
  if (syslogMatch) return syslogMatch[0];
  
  // Try timestamp at beginning
  const timestampMatch = logLine.match(/^\d{2}:\d{2}:\d{2}/);
  if (timestampMatch) return timestampMatch[0];
  
  return new Date().toISOString();
}

export function detectSeverity(logLine: string): 'critical' | 'warning' | 'info' | 'normal' {
  const lowerLine = logLine.toLowerCase();
  
  // Critical indicators
  if (lowerLine.match(/\b(critical|fatal|panic|emergency|failed|error|denied|blocked)\b/)) {
    return 'critical';
  }
  
  // Warning indicators
  if (lowerLine.match(/\b(warning|warn|alert|timeout|retry)\b/)) {
    return 'warning';
  }
  
  // Info indicators
  if (lowerLine.match(/\b(info|notice|debug)\b/)) {
    return 'info';
  }
  
  return 'normal';
}

export function parseRawLogs(rawLogs: string): LogEntry[] {
  const lines = rawLogs.split('\n').filter(line => line.trim().length > 0);
  
  return lines.map(line => {
    const source = parseLogSource(line);
    const timestamp = parseTimestamp(line);
    const severity = detectSeverity(line);
    
    return {
      timestamp,
      source,
      severity,
      message: line.trim(),
    };
  });
}

export function matchRules(logEntry: LogEntry, rules: LogRule[]): LogEntry {
  // Check each enabled rule
  for (const rule of rules.filter(r => r.enabled)) {
    let matches = false;
    
    try {
      if (rule.isRegex) {
        const regex = new RegExp(rule.pattern, 'i');
        matches = regex.test(logEntry.message);
      } else {
        matches = logEntry.message.toLowerCase().includes(rule.pattern.toLowerCase());
      }
    } catch (error) {
      console.error(`Error matching rule ${rule.name}:`, error);
      continue;
    }
    
    if (matches) {
      return {
        ...logEntry,
        category: rule.category,
        severity: rule.severity,
        aiAnalysis: `Matched rule: ${rule.name} - ${rule.description}`,
      };
    }
  }
  
  return logEntry;
}

export function parseAndMatchLogs(rawLogs: string, rules: LogRule[]): LogEntry[] {
  const parsedLogs = parseRawLogs(rawLogs);
  return parsedLogs.map(log => matchRules(log, rules));
}