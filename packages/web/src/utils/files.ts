import { FileSystemTree } from '@webcontainer/api';

// Server entry point que roda no WebContainer
const serverJs = `
import { createServer } from 'http';
import { readFile, writeFile, readdir, stat, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.PORT || '4096');
const HOST = process.env.HOST || '0.0.0.0';

// Simulação do servidor OpenCode
// Em produção, isso seria o servidor real do OpenCode

const sessions = new Map();
const messages = new Map();

// Configuração padrão
const defaultConfig = {
  "\$schema": "https://opencode.ai/config.json",
  "username": "web-user",
  "model": "anthropic/claude-sonnet-4-20250514",
  "default_agent": "build"
};

// Inicializar diretórios
async function initDirs() {
  const dirs = ['/home/user/.opencode', '/home/user/projects'];
  for (const dir of dirs) {
    try {
      await mkdir(dir, { recursive: true });
    } catch (e) {
      // Ignorar se já existe
    }
  }
  
  // Salvar config padrão
  const configPath = '/home/user/.opencode/config.json';
  try {
    await readFile(configPath, 'utf-8');
  } catch {
    await writeFile(configPath, JSON.stringify(defaultConfig, null, 2));
  }
}

// Handler de rotas
async function handleRequest(req, res) {
  const url = new URL(req.url, \`http://\${req.headers.host}\`);
  const path = url.pathname;
  const method = req.method;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Health check
  if (path === '/global/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ healthy: true, version: '1.17.14-web' }));
    return;
  }

  // Global config
  if (path === '/global/config' && method === 'GET') {
    try {
      const config = await readFile('/home/user/.opencode/config.json', 'utf-8');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(config);
    } catch {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(defaultConfig));
    }
    return;
  }

  // List sessions
  if (path === '/session' && method === 'GET') {
    const sessionList = Array.from(sessions.values());
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(sessionList));
    return;
  }

  // Create session
  if (path === '/session' && method === 'POST') {
    const body = await readBody(req);
    const session = {
      id: \`sess_\${Date.now()}\`,
      title: body.title || 'Nova Sessão',
      agent: body.agent || 'build',
      model: body.model || 'anthropic/claude-sonnet-4-20250514',
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      directory: '/home/user/projects',
    };
    sessions.set(session.id, session);
    messages.set(session.id, []);
    res.writeHead(201, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(session));
    return;
  }

  // Get session messages
  const messageMatch = path.match(/^\\/session\\/([^/]+)\\/messages$/);
  if (messageMatch && method === 'GET') {
    const sessionId = messageMatch[1];
    const sessionMessages = messages.get(sessionId) || [];
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(sessionMessages));
    return;
  }

  // Send message (prompt)
  const promptMatch = path.match(/^\\/session\\/([^/]+)\\/message$/);
  if (promptMatch && method === 'POST') {
    const sessionId = promptMatch[1];
    const body = await readBody(req);
    const sessionMessages = messages.get(sessionId) || [];
    
    // Adicionar mensagem do usuário
    const userMessage = {
      id: \`msg_\${Date.now()}\`,
      role: 'user',
      content: body.content || body.prompt,
      timestamp: new Date().toISOString(),
    };
    sessionMessages.push(userMessage);

    // Simular resposta do assistente (em produção, chamaria o LLM)
    const assistantMessage = {
      id: \`msg_\${Date.now() + 1}\`,
      role: 'assistant',
      content: 'Esta é uma resposta simulada. Em produção, o servidor OpenCode real processaria sua mensagem e chamaria o provider de IA configurado.',
      timestamp: new Date().toISOString(),
    };
    sessionMessages.push(assistantMessage);
    messages.set(sessionId, sessionMessages);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(assistantMessage));
    return;
  }

  // Auth - set API key
  const authMatch = path.match(/^\\/auth\\/([^/]+)$/);
  if (authMatch && method === 'PUT') {
    const providerId = authMatch[1];
    const body = await readBody(req);
    const authData = {
      type: 'api',
      key: body.apiKey || body.key,
      provider: providerId,
    };
    
    // Salvar no arquivo auth.json
    const authPath = '/home/user/.opencode/auth.json';
    let authFile = {};
    try {
      const content = await readFile(authPath, 'utf-8');
      authFile = JSON.parse(content);
    } catch {
      // Arquivo não existe ainda
    }
    authFile[providerId] = authData;
    await writeFile(authPath, JSON.stringify(authFile, null, 2));

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
    return;
  }

  // List providers
  if (path === '/provider' && method === 'GET') {
    const providers = [
      { id: 'anthropic', name: 'Anthropic', models: ['claude-sonnet-4-20250514', 'claude-3-5-sonnet'] },
      { id: 'openai', name: 'OpenAI', models: ['gpt-4o', 'gpt-4-turbo'] },
      { id: 'google', name: 'Google', models: ['gemini-2.0-flash', 'gemini-1.5-pro'] },
    ];
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(providers));
    return;
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
}

// Ler body do request
async function readBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        resolve({});
      }
    });
  });
}

// Iniciar servidor
await initDirs();

const server = createServer(handleRequest);

server.listen(PORT, HOST, () => {
  console.log(\`OpenCode Web Server running at http://\${HOST}:\${PORT}\`);
  console.log('Server ready');
});
`;

// package.json para o projeto no WebContainer
const packageJson = {
  name: 'opencode-webcontainer',
  version: '1.0.0',
  type: 'module',
  scripts: {
    start: 'node server.js',
    dev: 'node server.js',
  },
  dependencies: {},
};

// opencode.json config
const opencodeConfig = {
  $schema: 'https://opencode.ai/config.json',
  username: 'web-user',
  model: 'anthropic/claude-sonnet-4-20250514',
  default_agent: 'build',
  share: 'disabled',
};

// AGENTS.md example
const agentsMd = `# OpenCode Web Agent

Este é um agente de programação assistida por IA que roda inteiramente no navegador.

## Como usar

1. Configure sua API key no painel de configurações
2. Digite sua mensagem no chat
3. O agente irá processar e responder

## Comandos úteis

- \\\`/init\\\` - Inicializar o projeto
- \\\`/help\\\` - Ver ajuda
`;

// Filesystem tree
export const projectFiles: FileSystemTree = {
  'package.json': {
    file: {
      contents: JSON.stringify(packageJson, null, 2),
    },
  },
  'server.js': {
    file: {
      contents: serverJs,
    },
  },
  'opencode.json': {
    file: {
      contents: JSON.stringify(opencodeConfig, null, 2),
    },
  },
  'AGENTS.md': {
    file: {
      contents: agentsMd,
    },
  },
  'src': {
    directory: {
      'main.js': {
        file: {
          contents: '// OpenCode Web - Entry Point\nconsole.log("OpenCode Web loaded");',
        },
      },
    },
  },
  'projects': {
    directory: {
      'README.md': {
        file: {
          contents: '# Meu Projeto\n\nEste é um projeto de exemplo no OpenCode Web.',
        },
      },
    },
  },
};
