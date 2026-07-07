# OpenCode Web

Agente de programação com IA que roda inteiramente no navegador usando WebContainer.

## 🚀 Funcionalidades

- **Chat com IA**: Converse com assistentes de IA (Anthropic, OpenAI, Google)
- **Terminal integrado**: Execute comandos diretamente no navegador
- **Gerenciamento de sessões**: Crie e gerencie múltiplas sessões de chat
- **100% no browser**: Nenhuma instalação necessária

## 📋 Pré-requisitos

- **Navegador**: Chrome ou Edge (requer SharedArrayBuffer)
- **API Key**: Uma chave de API de um provider de IA (Anthropic, OpenAI ou Google)

## 🛠️ Stack Tecnológica

- **Frontend**: SolidJS + Tailwind CSS
- **Runtime**: WebContainer API (StackBlitz)
- **Backend**: Node.js via WebAssembly
- **Deploy**: Vercel

## 🏃 Como Rodar

### Desenvolvimento

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Abrir http://localhost:3000
```

### Build

```bash
# Build para produção
npm run build:web

# Preview do build
npm run preview:web
```

## 🚀 Deploy na Vercel

1. Faça push para o GitHub
2. Conecte o repositório na Vercel
3. Configure os headers CORS (incluídos no `vercel.json`)
4. Deploy automático!

## 🔐 Segurança

- **API keys**: Armazenadas apenas localmente no navegador
- **Sem backend**: Não há servidor intermediário armazenando suas chaves
- **CORS**: Requests são feitos diretamente do browser para as APIs

## 📁 Estrutura

```
opencode-web/
├── api/llm/              # Vercel Functions (proxy LLM)
│   ├── anthropic.ts
│   ├── openai.ts
│   └── google.ts
├── packages/web/         # Frontend SolidJS
│   ├── src/
│   │   ├── components/   # Componentes da UI
│   │   ├── context/      # Context do WebContainer
│   │   └── utils/        # Utilities
│   └── ...
└── vercel.json           # Configuração Vercel
```

## 🌐 CORS

O projeto usa Vercel Functions como proxy para APIs de IA, resolvendo problemas de CORS no plano gratuito do WebContainer.

## 📝 Licença

MIT
