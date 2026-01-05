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

 useEffect(() => {
  if (isListening) {
    const ws = new WebSocket('ws://localhost:8080');
    
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
                Start Listening
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
      </div>
    </Card>
  );
}
