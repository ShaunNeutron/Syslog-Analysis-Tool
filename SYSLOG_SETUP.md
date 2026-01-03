# Syslog Real-Time Monitoring Setup Guide

## Overview

This syslog analysis tool provides real-time monitoring capabilities by receiving syslog messages via UDP port 514. Since browsers cannot directly open UDP sockets, you need to run a backend server that acts as a bridge between your network devices and the web UI.

## Quick Start (Demo Mode)

The application includes a **demo mode** that simulates incoming syslog messages. This is perfect for testing and demonstration purposes:

1. Go to the "Real-Time" tab
2. Click "Start Listening (Demo Mode)"
3. Observe simulated logs appearing in real-time

## Production Setup

### Prerequisites

- Node.js installed on your server
- Network access from your devices to your server
- Root/admin privileges (for port 514) or use a non-privileged port

### Step 1: Install Dependencies

```bash
npm install ws dgram
```

### Step 2: Run the Syslog Server

Using the provided example server:

```bash
# For port 514 (requires root/admin)
sudo node syslog-server-example.js

# OR use a non-privileged port (e.g., 5140)
# Edit syslog-server-example.js and change SYSLOG_PORT to 5140
node syslog-server-example.js
```

### Step 3: Configure Your Network Devices

#### OPNsense Configuration

1. Navigate to **System → Settings → Logging → Remote Logging**
2. Click **Add** to add a new remote syslog server
3. Enter your server's IP address and port (default: 514)
4. Select the log types you want to forward (Firewall, System, etc.)
5. Save and apply changes

Example syslog format in OPNsense logs:
```
filterlog: 5,16777216,,1000000103,em0,match,block,in,4,0x0,,64,0,0,DF,6,tcp,60,203.0.113.45,192.168.1.100,52341,22,0,S,1234567890,,1024,,
```

#### Linux (rsyslog) Configuration

Edit `/etc/rsyslog.conf` or create a new file in `/etc/rsyslog.d/`:

```bash
# Forward all logs
*.* @YOUR_SERVER_IP:514

# OR forward only specific facilities
auth,authpriv.* @YOUR_SERVER_IP:514
kern.* @YOUR_SERVER_IP:514
```

Restart rsyslog:
```bash
sudo systemctl restart rsyslog
```

#### Unifi Network Application

1. Navigate to **Settings → System → Advanced**
2. Enable **Remote Logging**
3. Enter your server's IP address
4. Set port to 514 (or your custom port)
5. Apply changes

### Step 4: Update the Web UI (Optional)

To connect the web UI to your real WebSocket server instead of demo mode, modify the `SyslogListener` component to connect via WebSocket:

```javascript
// In SyslogListener.tsx, replace the demo interval with:
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
```

## Custom Alert Rules

Define custom rules to automatically flag important logs:

### Example Rules

1. **WAN Inbound Traffic Allowed**
   - Pattern: `ALLOW.*,in,.*,wan,`
   - Category: Security
   - Severity: Critical
   - Detects: OPNsense firewall logs showing allowed inbound traffic from WAN

2. **Multiple Failed Login Attempts**
   - Pattern: `Failed password|authentication failure|Invalid user`
   - Category: Security
   - Severity: Critical
   - Detects: Brute force login attempts

3. **SSH from Public IP**
   - Pattern: `sshd.*from\s+(?!10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.|127\.)`
   - Category: Security
   - Severity: Warning
   - Detects: SSH connections from non-private IP addresses

4. **Kernel Panic**
   - Pattern: `kernel.*panic|Kernel panic`
   - Category: System Failure
   - Severity: Critical
   - Detects: Linux kernel panics

5. **Disk Space Critical**
   - Pattern: `No space left on device|disk.*full|filesystem.*full`
   - Category: System Failure
   - Severity: Critical

## How It Works

1. **Log Collection**: Network devices send syslog messages via UDP to your Node.js server
2. **Processing**: The server receives UDP packets and forwards them via WebSocket to the web UI
3. **Rule Matching**: Each log is checked against your custom rules
4. **AI Analysis**: Critical/warning logs without rule matches are analyzed by Ollama AI
5. **Alerting**: Important logs trigger toast notifications in the UI

## Firewall Configuration

Ensure your firewall allows:
- **Inbound UDP** on port 514 (or your custom port) from your network devices
- **Inbound TCP** on port 8080 for WebSocket connections from the web UI

## Security Considerations

1. **Network Isolation**: Run the syslog server on a trusted network segment
2. **Authentication**: Add authentication to the WebSocket server in production
3. **Encryption**: Consider using TLS for WebSocket connections (wss://)
4. **Rate Limiting**: Implement rate limiting to prevent log flooding
5. **Access Control**: Restrict which devices can send syslog messages

## Troubleshooting

### Logs not appearing in UI

1. Check if the syslog server is running: `ps aux | grep node`
2. Verify the server is listening: `netstat -uln | grep 514`
3. Test with logger: `logger -n YOUR_SERVER_IP -P 514 "Test message"`
4. Check firewall rules allow UDP 514

### WebSocket connection fails

1. Verify WebSocket server is running on port 8080
2. Check browser console for connection errors
3. Ensure no firewall blocking port 8080
4. Try connecting directly: `wscat -c ws://localhost:8080`

### Permission denied on port 514

- Use `sudo` to run the server
- OR change to a non-privileged port (>1024)
- Update device configurations to use the new port

## Advanced Configuration

### Load Balancing

For high-volume environments, consider:
- Multiple syslog servers behind a load balancer
- Message queue (e.g., Redis, RabbitMQ) between syslog and WebSocket servers
- Horizontal scaling of analysis workers

### Log Retention

Add log persistence:
- Store logs in a database (MongoDB, PostgreSQL, Elasticsearch)
- Implement log rotation and archival
- Create historical analysis views

### Integration

Connect to existing tools:
- Forward to SIEM systems (Splunk, ELK, Graylog)
- Send alerts to PagerDuty, Slack, email
- Export reports in various formats
