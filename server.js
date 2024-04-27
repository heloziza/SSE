const http = require('http');
const fs = require('fs');
const path = require('path');

// Lista de mensagens do chat
let messages = [];

// Função para enviar mensagens para os clientes via SSE
function sendEventsToClients(res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
  messages.forEach(message => {
    res.write(`data: ${JSON.stringify(message)}\n\n`);
  });
}

// Criando o servidor HTTP
const server = http.createServer((req, res) => {
  // Roteamento para servir o arquivo HTML
  if (req.url === '/' || req.url === '/index.html') {
    fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Erro interno do servidor');
        return;
      }
      res.writeHead(200, {
        'Content-Type': 'text/html'
      });
      res.end(data);
    });
  } else if (req.url === '/events') {
    sendEventsToClients(res);
  } else {
    res.writeHead(404);
    res.end('Página não encontrada');
  }
});

// Iniciando o servidor na porta 3000
server.listen(3000, () => {
  console.log('Servidor HTTP iniciado em http://localhost:3000');
});

// Configurando o servidor para receber mensagens dos clientes
server.on('request', (req, res) => {
  if (req.method === 'POST' && req.url === '/message') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      const message = JSON.parse(body);
      messages.push(message);
      // Enviando a nova mensagem para todos os clientes conectados
      server.emit('newMessage', message);
      res.end('Mensagem recebida');
    });
  }
});