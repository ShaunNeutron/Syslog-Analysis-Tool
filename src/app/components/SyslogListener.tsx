import { Radio, Power, PowerOff, Activity } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from './ui/alert';

interface SyslogListenerProps {
  onLogReceived: (log: string) => void;
  isListening: boolean;
  onToggleListener: (port: number) => void;
}

export function SyslogListener({ onLogReceived, isListening, onToggleListener }: SyslogListenerProps) {
  const [port, setPort] = useState(514);
  const [messageCount, setMessageCount] = useState(0);
  const [lastMessage, setLastMessage] = useState<string>('');

  // Simulate receiving logs in demo mode
  useEffect(() => {
    if (isListening) {
      const interval = setInterval(() => {
        const demoLogs = [
          'Jan  3 10:23:45 firewall filterlog: ALLOW,in,4,0x0,0,5678,UDP,17,64,192.168.1.100,8.8.8.8,53',
          'Jan  3 10:24:12 webserver sshd[12345]: Failed password for root from 203.0.113.45 port 52341 ssh2',
          'Jan  3 10:24:30 firewall filterlog: BLOCK,in,4,wan,0,5678,TCP,6,64,198.51.100.23,192.168.1.5,22',
          'Jan  3 10:25:01 unifi hostapd: U7PG2: STA 00:11:22:33:44:55 IEEE 802.11: authenticated',
          'Jan  3 10:25:15 webserver sshd[12346]: Failed password for admin from 203.0.113.45 port 52342 ssh2',
        ];
        const randomLog = demoLogs[Math.floor(Math.random() * demoLogs.length)];
        setLastMessage(randomLog);
        setMessageCount(prev => prev + 1);
        onLogReceived(randomLog);
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [isListening, onLogReceived]);

  const handleToggle = () => {
    if (!isListening) {
      setMessageCount(0);
    }
    onToggleListener(port);
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5" />
            <h2>Syslog Listener</h2>
          </div>
          <Badge variant={isListening ? "default" : "secondary"} className="flex items-center gap-1">
            <Activity className={`w-3 h-3 ${isListening ? 'animate-pulse' : ''}`} />
            {isListening ? 'LISTENING' : 'STOPPED'}
          </Badge>
        </div>

        <Alert>
          <AlertDescription className="text-xs">
            <strong>Note:</strong> Browser-based apps cannot directly open UDP sockets. This feature requires a backend service.
            In production, deploy a Node.js syslog server that forwards logs to this UI via WebSocket.
            <br/>
            <strong>Demo Mode:</strong> Simulated log messages are being generated for demonstration.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="port">Syslog Port (UDP)</Label>
            <Input
              id="port"
              type="number"
              value={port}
              onChange={(e) => setPort(parseInt(e.target.value) || 514)}
              disabled={isListening}
              placeholder="514"
            />
            <p className="text-xs text-muted-foreground">
              Standard syslog port is 514 (requires root/admin on Linux/Mac)
            </p>
          </div>

          <Button 
            onClick={handleToggle} 
            className="w-full"
            variant={isListening ? "destructive" : "default"}
          >
            {isListening ? (
              <>
                <PowerOff className="w-4 h-4 mr-2" />
                Stop Listening
              </>
            ) : (
              <>
                <Power className="w-4 h-4 mr-2" />
                Start Listening (Demo Mode)
              </>
            )}
          </Button>

          {isListening && (
            <div className="space-y-2 p-4 bg-secondary/50 rounded-md">
              <div className="flex items-center justify-between">
                <span className="text-sm">Messages Received:</span>
                <Badge variant="outline">{messageCount}</Badge>
              </div>
              {lastMessage && (
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground">Last Message:</p>
                  <p className="text-xs font-mono mt-1 break-all">{lastMessage}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="pt-4 border-t">
          <h3 className="text-sm mb-2">Backend Setup Instructions</h3>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>1. Install dependencies: <code className="bg-muted px-1 py-0.5 rounded">npm install dgram ws</code></p>
            <p>2. Create a Node.js server that listens on UDP 514</p>
            <p>3. Forward received syslog messages to this UI via WebSocket</p>
            <p>4. Configure your network devices to send syslog to your server's IP</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
