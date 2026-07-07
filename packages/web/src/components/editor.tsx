import { createSignal, createEffect, For, Show, onMount } from 'solid-js';
import { useWebContainer } from '../context/webcontainer';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface EditorScreenProps {
  serverUrl: string | null;
  apiKey: string;
}

export default function EditorScreen(props: EditorScreenProps) {
  const { terminalOutput } = useWebContainer();
  const [messages, setMessages] = createSignal<Message[]>([]);
  const [input, setInput] = createSignal('');
  const [isLoading, setIsLoading] = createSignal(false);
  const [sessions, setSessions] = createSignal<{ id: string; title: string }[]>([]);
  const [currentSession, setCurrentSession] = createSignal<string | null>(null);
  const messagesEndRef = createSignal<HTMLDivElement | null>(null);

  // Auto-scroll para baixo
  createEffect(() => {
    messages();
    const el = messagesEndRef[0]();
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  });

  // Criar sessão ao carregar
  onMount(async () => {
    if (props.serverUrl) {
      try {
        const res = await fetch(`${props.serverUrl}/session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: 'Nova Sessão' }),
        });
        const session = await res.json();
        setCurrentSession(session.id);
        setSessions([session]);
      } catch (err) {
        console.error('Erro ao criar sessão:', err);
      }
    }
  });

  const sendMessage = async () => {
    const content = input().trim();
    if (!content || isLoading() || !currentSession()) return;

    // Adicionar mensagem do usuário
    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Enviar para o servidor
      const res = await fetch(`${props.serverUrl}/session/${currentSession()}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      
      const assistantMessage: Message = await res.json();
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
      const errorMessage: Message = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: 'Erro ao processar sua mensagem. Verifique se o servidor está rodando.',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div class="h-full flex bg-[var(--bg-primary)]">
      {/* Sidebar */}
      <div class="w-64 bg-[var(--bg-secondary)] border-r border-[var(--border)] flex flex-col">
        {/* Header */}
        <div class="p-4 border-b border-[var(--border)]">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-[var(--bg-tertiary)] rounded-lg flex items-center justify-center">
              <span class="text-lg font-bold text-[var(--accent)]">OC</span>
            </div>
            <div>
              <h2 class="font-bold text-[var(--text-primary)]">OpenCode</h2>
              <p class="text-xs text-[var(--text-secondary)]">Web Edition</p>
            </div>
          </div>
        </div>

        {/* Sessions list */}
        <div class="flex-1 overflow-y-auto p-3">
          <div class="text-xs text-[var(--text-secondary)] mb-2 uppercase font-bold">Sessões</div>
          <For each={sessions()}>
            {(session) => (
              <button
                onClick={() => setCurrentSession(session.id)}
                class={`w-full text-left p-2 rounded-lg mb-1 text-sm transition-colors ${
                  currentSession() === session.id
                    ? 'bg-[var(--accent)] text-[var(--bg-primary)]'
                    : 'text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                }`}
              >
                {session.title}
              </button>
            )}
          </For>
        </div>

        {/* New session button */}
        <div class="p-3 border-t border-[var(--border)]">
          <button
            onClick={async () => {
              if (props.serverUrl) {
                const res = await fetch(`${props.serverUrl}/session`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ title: `Sessão ${sessions().length + 1}` }),
                });
                const session = await res.json();
                setSessions(prev => [...prev, session]);
                setCurrentSession(session.id);
                setMessages([]);
              }
            }}
            class="w-full py-2 bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--border)] transition-colors text-sm"
          >
            + Nova Sessão
          </button>
        </div>
      </div>

      {/* Main content */}
      <div class="flex-1 flex flex-col">
        {/* Chat area */}
        <div class="flex-1 overflow-y-auto p-4">
          <Show when={messages().length === 0}>
            <div class="h-full flex items-center justify-center">
              <div class="text-center">
                <div class="text-6xl mb-4">💬</div>
                <h2 class="text-xl font-bold text-[var(--text-primary)] mb-2">
                  Como posso ajudar?
                </h2>
                <p class="text-[var(--text-secondary)] max-w-md">
                  Digite sua mensagem abaixo para começar a conversar com o assistente de IA.
                </p>
              </div>
            </div>
          </Show>

          <For each={messages()}>
            {(message) => (
              <div class={`mb-4 flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  class={`max-w-3xl p-4 rounded-2xl ${
                    message.role === 'user'
                      ? 'bg-[var(--accent)] text-[var(--bg-primary)]'
                      : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border)]'
                  }`}
                >
                  <div class="whitespace-pre-wrap">{message.content}</div>
                  <div class={`text-xs mt-2 ${message.role === 'user' ? 'text-[var(--bg-primary)]' : 'text-[var(--text-secondary)]'}`}>
                    {new Date(message.timestamp).toLocaleTimeString('pt-BR')}
                  </div>
                </div>
              </div>
            )}
          </For>

          <Show when={isLoading()}>
            <div class="flex justify-start mb-4">
              <div class="bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border)] p-4 rounded-2xl">
                <div class="flex items-center gap-2">
                  <div class="w-2 h-2 bg-[var(--accent)] rounded-full animate-pulse" />
                  <div class="w-2 h-2 bg-[var(--accent)] rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                  <div class="w-2 h-2 bg-[var(--accent)] rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>
            </div>
          </Show>

          <div ref={messagesEndRef[1]} />
        </div>

        {/* Input area */}
        <div class="p-4 border-t border-[var(--border)]">
          <div class="max-w-3xl mx-auto">
            <div class="flex gap-2">
              <textarea
                value={input()}
                onInput={(e) => setInput(e.currentTarget.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite sua mensagem..."
                rows={1}
                class="flex-1 px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] resize-none transition-colors"
              />
              <button
                onClick={sendMessage}
                disabled={isLoading() || !input().trim()}
                class="px-6 py-3 bg-[var(--accent)] text-[var(--bg-primary)] rounded-xl font-bold hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Enviar
              </button>
            </div>
            <p class="text-xs text-[var(--text-secondary)] mt-2 text-center">
              Enter para enviar • Shift+Enter para nova linha
            </p>
          </div>
        </div>
      </div>

      {/* Terminal panel */}
      <div class="w-96 bg-[var(--bg-secondary)] border-l border-[var(--border)] flex flex-col">
        <div class="p-3 border-b border-[var(--border)]">
          <div class="text-xs text-[var(--text-secondary)] uppercase font-bold">Terminal</div>
        </div>
        <div class="flex-1 overflow-y-auto p-3 font-mono text-xs">
          <For each={terminalOutput()}>
            {(line, i) => (
              <div class="text-[var(--text-primary)] py-0.5">{line}</div>
            )}
          </For>
        </div>
      </div>
    </div>
  );
}
