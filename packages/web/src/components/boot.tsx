import { useWebContainer } from '../context/webcontainer';

export default function BootScreen() {
  const { state, progress, statusMessage, terminalOutput } = useWebContainer();

  return (
    <div class="h-full flex items-center justify-center bg-[var(--bg-primary)]">
      <div class="text-center p-8 max-w-lg w-full">
        {/* Logo */}
        <div class="mb-8">
          <div class="w-24 h-24 mx-auto bg-[var(--bg-tertiary)] rounded-2xl flex items-center justify-center border border-[var(--border)]">
            <span class="text-4xl font-bold text-[var(--accent)]">OC</span>
          </div>
          <h1 class="text-3xl font-bold mt-4 text-[var(--text-primary)]">OpenCode Web</h1>
          <p class="text-[var(--text-secondary)] mt-2">Agente de IA para programação</p>
        </div>

        {/* Progress bar */}
        <div class="mb-6">
          <div class="h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
            <div
              class="h-full bg-gradient-to-r from-[var(--accent)] to-[var(--success)] transition-all duration-300"
              style={{ width: `${progress()}%` }}
            />
          </div>
          <p class="text-sm text-[var(--text-secondary)] mt-2">{statusMessage()}</p>
        </div>

        {/* Terminal output */}
        <div class="bg-[var(--bg-secondary)] rounded-lg p-4 text-left max-h-48 overflow-y-auto border border-[var(--border)]">
          <div class="text-xs text-[var(--text-secondary)] mb-2 font-bold">Terminal</div>
          {terminalOutput().map((line, i) => (
            <div key={i} class="text-xs font-mono text-[var(--text-primary)] py-0.5">
              {line}
            </div>
          ))}
          {terminalOutput().length === 0 && (
            <div class="text-xs text-[var(--text-secondary)] italic">
              Aguardando inicialização...
            </div>
          )}
        </div>

        {/* Loading indicator */}
        {state() !== 'ready' && state() !== 'error' && (
          <div class="mt-6 flex items-center justify-center gap-2">
            <div class="w-2 h-2 bg-[var(--accent)] rounded-full animate-pulse" />
            <div class="w-2 h-2 bg-[var(--accent)] rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
            <div class="w-2 h-2 bg-[var(--accent)] rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
          </div>
        )}
      </div>
    </div>
  );
}
