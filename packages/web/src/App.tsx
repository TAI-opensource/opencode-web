import { createSignal, Show, onMount } from 'solid-js';
import { WebContainerProvider, useWebContainer } from './context/webcontainer';
import BootScreen from './components/boot';
import SetupScreen from './components/setup';
import EditorScreen from './components/editor';

function AppContent() {
  const { state, serverUrl } = useWebContainer();
  const [apiKey, setApiKey] = createSignal<string | null>(null);

  onMount(() => {
    const savedKey = localStorage.getItem('opencode_api_key');
    if (savedKey) {
      setApiKey(savedKey);
    }
  });

  const handleApiKeySet = (key: string) => {
    localStorage.setItem('opencode_api_key', key);
    setApiKey(key);
  };

  return (
    <div class="h-full w-full flex flex-col">
      <Show when={state() === 'idle' || state() === 'booting'}>
        <BootScreen />
      </Show>
      
      <Show when={state() === 'ready' && !apiKey()}>
        <SetupScreen onApiKeySet={handleApiKeySet} />
      </Show>
      
      <Show when={state() === 'ready' && apiKey()}>
        <EditorScreen serverUrl={serverUrl()} apiKey={apiKey()!} />
      </Show>

      <Show when={state() === 'error'}>
        <div class="h-full flex items-center justify-center bg-[var(--bg-primary)]">
          <div class="text-center p-8 max-w-md">
            <div class="text-6xl mb-4">❌</div>
            <h1 class="text-2xl font-bold text-[var(--error)] mb-4">Erro ao Iniciar</h1>
            <p class="text-[var(--text-secondary)] mb-6">
              Ocorreu um erro ao inicializar o WebContainer. Verifique se o navegador suporta SharedArrayBuffer.
            </p>
            <button
              onClick={() => window.location.reload()}
              class="px-6 py-3 bg-[var(--accent)] text-[var(--bg-primary)] rounded-lg font-bold hover:bg-[var(--accent-hover)] transition-colors"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      </Show>
    </div>
  );
}

export default function App() {
  return (
    <WebContainerProvider>
      <AppContent />
    </WebContainerProvider>
  );
}
