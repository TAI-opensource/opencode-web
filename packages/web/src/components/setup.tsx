import { createSignal, For, Show } from 'solid-js';

interface SetupScreenProps {
  onApiKeySet: (key: string) => void;
}

const providers = [
  { id: 'anthropic', name: 'Anthropic', placeholder: 'sk-ant-api03-...', color: '#d97706' },
  { id: 'openai', name: 'OpenAI', placeholder: 'sk-proj-...', color: '#10a37f' },
  { id: 'google', name: 'Google AI', placeholder: 'AIza...', color: '#4285f4' },
];

export default function SetupScreen(props: SetupScreenProps) {
  const [selectedProvider, setSelectedProvider] = createSignal('anthropic');
  const [apiKey, setApiKey] = createSignal('');
  const [showKey, setShowKey] = createSignal(false);
  const [error, setError] = createSignal('');

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    const key = apiKey().trim();
    
    if (!key) {
      setError('Por favor, insira uma API key');
      return;
    }

    // Validar formato básico
    if (selectedProvider() === 'anthropic' && !key.startsWith('sk-ant-')) {
      setError('API key do Anthropic deve começar com sk-ant-');
      return;
    }
    if (selectedProvider() === 'openai' && !key.startsWith('sk-')) {
      setError('API key do OpenAI deve começar com sk-');
      return;
    }

    setError('');
    localStorage.setItem(`api_key_${selectedProvider()}`, key);
    props.onApiKeySet(key);
  };

  return (
    <div class="h-full flex items-center justify-center bg-[var(--bg-primary)]">
      <div class="text-center p-8 max-w-md w-full">
        {/* Header */}
        <div class="mb-8">
          <div class="w-16 h-16 mx-auto bg-[var(--bg-tertiary)] rounded-xl flex items-center justify-center border border-[var(--border)]">
            <span class="text-2xl font-bold text-[var(--accent)]">🔑</span>
          </div>
          <h1 class="text-2xl font-bold mt-4 text-[var(--text-primary)]">Configure seu Provider</h1>
          <p class="text-[var(--text-secondary)] mt-2">
            Insira sua API key para começar a usar o OpenCode
          </p>
        </div>

        {/* Provider selector */}
        <div class="mb-6">
          <label class="block text-sm text-[var(--text-secondary)] mb-2 text-left">
            Provider de IA
          </label>
          <div class="grid grid-cols-3 gap-2">
            <For each={providers}>
              {(provider) => (
                <button
                  onClick={() => setSelectedProvider(provider.id)}
                  class={`p-3 rounded-lg border transition-all ${
                    selectedProvider() === provider.id
                      ? 'border-[var(--accent)] bg-[var(--bg-tertiary)]'
                      : 'border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[var(--text-secondary)]'
                  }`}
                >
                  <div
                    class="w-8 h-8 mx-auto rounded-full flex items-center justify-center text-white font-bold text-sm"
                    style={{ 'background-color': provider.color }}
                  >
                    {provider.name.charAt(0)}
                  </div>
                  <div class="text-xs mt-2 text-[var(--text-primary)]">{provider.name}</div>
                </button>
              )}
            </For>
          </div>
        </div>

        {/* API Key input */}
        <form onSubmit={handleSubmit}>
          <div class="mb-6">
            <label class="block text-sm text-[var(--text-secondary)] mb-2 text-left">
              API Key
            </label>
            <div class="relative">
              <input
                type={showKey() ? 'text' : 'password'}
                value={apiKey()}
                onInput={(e) => setApiKey(e.currentTarget.value)}
                placeholder={providers.find(p => p.id === selectedProvider())?.placeholder}
                class="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] transition-colors font-mono"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey())}
                class="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                {showKey() ? '🙈' : '👁️'}
              </button>
            </div>
            <Show when={error()}>
              <p class="text-[var(--error)] text-sm mt-2">{error()}</p>
            </Show>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            class="w-full py-3 bg-[var(--accent)] text-[var(--bg-primary)] rounded-lg font-bold hover:bg-[var(--accent-hover)] transition-colors"
          >
            Conectar
          </button>
        </form>

        {/* Info */}
        <div class="mt-6 p-4 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border)]">
          <p class="text-xs text-[var(--text-secondary)] text-left">
            <strong>Nota:</strong> Sua API key é armazenada apenas localmente no seu navegador 
            e nunca é enviada para nossos servidores. Ela é usada diretamente para conectar 
            ao provider de IA escolhido.
          </p>
        </div>

        {/* Skip option */}
        <button
          onClick={() => props.onApiKeySet('demo')}
          class="mt-4 text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
        >
          Continuar sem API key (modo demonstração)
        </button>
      </div>
    </div>
  );
}
