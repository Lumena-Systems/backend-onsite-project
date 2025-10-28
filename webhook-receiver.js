#!/usr/bin/env node

/**
 * Simple Webhook Receiver Server for Testing
 * 
 * Listens on port 4000 and logs all incoming webhook requests
 */

const http = require('http');

const PORT = 4000;
const webhooksReceived = [];

const server = http.createServer((req, res) => {
  if (req.method === 'POST') {
    let body = '';
    
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      const webhook = {
        timestamp: new Date().toISOString(),
        headers: req.headers,
        body: body,
        url: req.url,
      };
      
      webhooksReceived.push(webhook);
      
      console.log('\n' + '═'.repeat(60));
      console.log('🪝 Webhook Received!');
      console.log('═'.repeat(60));
      console.log('Time:', webhook.timestamp);
      console.log('URL:', req.url);
      console.log('Event:', req.headers['x-webhook-event']);
      console.log('CRM:', req.headers['x-webhook-crm']);
      console.log('Signature:', req.headers['x-webhook-signature']);
      console.log('\nPayload:');
      try {
        const parsed = JSON.parse(body);
        console.log(JSON.stringify(parsed, null, 2));
      } catch (e) {
        console.log(body);
      }
      console.log('═'.repeat(60));
      console.log(`Total webhooks received: ${webhooksReceived.length}\n`);
      
      // Send success response
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        status: 'received', 
        timestamp: new Date().toISOString(),
        webhook_count: webhooksReceived.length
      }));
    });
  } else if (req.method === 'GET') {
    // Return webhook history
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      total_received: webhooksReceived.length,
      webhooks: webhooksReceived.slice(-10) // Last 10
    }, null, 2));
  } else {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
  }
});

server.listen(PORT, () => {
  console.log('\n🎣 Webhook Receiver Server');
  console.log('═'.repeat(60));
  console.log(`📡 Listening on http://localhost:${PORT}`);
  console.log(`🔗 Webhook URL: http://localhost:${PORT}/webhooks`);
  console.log('\nWaiting for webhooks...\n');
  console.log('Press Ctrl+C to stop');
  console.log('═'.repeat(60) + '\n');
});

