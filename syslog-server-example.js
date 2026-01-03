/**
 * Example Node.js Syslog Server
 * 
 * This server listens for syslog messages on UDP port 514 and forwards them
 * to the web UI via WebSocket.
 * 
 * Installation:
 *   npm install ws dgram
 * 
 * Usage:
 *   sudo node syslog-server-example.js
 * 
 * Note: Port 514 requires root/admin privileges on Linux/Mac.
 * You can use a higher port (e.g., 5140) without privileges.
 */

const dgram = require('dgram');
const WebSocket = require('ws');

// Configuration
const SYSLOG_PORT = 514; // Change to 5140 to avoid requiring root
const WEBSOCKET_PORT = 8080;

// Create UDP server for syslog
const syslogServer = dgram.createSocket('udp4');

// Create WebSocket server for forwarding to UI
const wss = new WebSocket.Server({ port: WEBSOCKET_PORT });

let connectedClients = [];

wss.on('connection', (ws) => {
  console.log('Web UI client connected');
  connectedClients.push(ws);

  ws.on('close', () => {
    console.log('Web UI client disconnected');
    connectedClients = connectedClients.filter(client => client !== ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Handle syslog messages
syslogServer.on('message', (msg, rinfo) => {
  const logMessage = msg.toString();
  const timestamp = new Date().toISOString();
  
  console.log(`[${timestamp}] Received from ${rinfo.address}:${rinfo.port}`);
  console.log(logMessage);

  // Forward to all connected web UI clients
  connectedClients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        timestamp,
        source: rinfo.address,
        message: logMessage,
      }));
    }
  });
});

syslogServer.on('error', (err) => {
  console.error('Syslog server error:', err);
  syslogServer.close();
});

syslogServer.on('listening', () => {
  const address = syslogServer.address();
  console.log(`Syslog server listening on UDP ${address.address}:${address.port}`);
  console.log(`WebSocket server listening on port ${WEBSOCKET_PORT}`);
  console.log('\nConfigure your devices to send syslog to this server\'s IP address.');
  console.log('\nExample rsyslog configuration:');
  console.log(`  *.* @YOUR_SERVER_IP:${SYSLOG_PORT}`);
  console.log('\nExample OPNsense configuration:');
  console.log('  System > Settings > Logging > Remote Logging');
  console.log(`  Add server: YOUR_SERVER_IP:${SYSLOG_PORT}`);
});

// Bind to syslog port
syslogServer.bind(SYSLOG_PORT);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down servers...');
  syslogServer.close();
  wss.close();
  process.exit(0);
});
