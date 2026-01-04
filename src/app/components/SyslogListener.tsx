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

// Receive syslog messages from local websocket:
useEffect(() => {
  if (isListening) {
    const ws = new WebSocket('ws://127.0.0.1:8080');
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onLogReceived(data.message);
    };
    
    return () => ws.close();
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
