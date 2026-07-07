import { createContext, createSignal, useContext, onCleanup, JSX } from 'solid-js';
import { WebContainer } from '@webcontainer/api';
import { projectFiles } from '../utils/files';

type WebContainerState = 'idle' | 'booting' | 'installing' | 'starting' | 'ready' | 'error';

interface WebContainerContextValue {
  state: () => WebContainerState;
  serverUrl: () => string | null;
  progress: () => number;
  statusMessage: () => string;
  webcontainer: () => WebContainer | null;
  terminalOutput: () => string[];
}

const WebContainerContext = createContext<WebContainerContextValue>();

export function WebContainerProvider(props: { children: JSX.Element }) {
  const [state, setState] = createSignal<WebContainerState>('idle');
  const [serverUrl, setServerUrl] = createSignal<string | null>(null);
  const [progress, setProgress] = createSignal(0);
  const [statusMessage, setStatusMessage] = createSignal('Inicializando...');
  const [terminalOutput, setTerminalOutput] = createSignal<string[]>([]);
  const [wc, setWc] = createSignal<WebContainer | null>(null);

  let webcontainerInstance: WebContainer | null = null;

  const addOutput = (line: string) => {
    setTerminalOutput(prev => [...prev.slice(-100), line]);
  };

  const bootWebContainer = async () => {
    try {
      setState('booting');
      setProgress(10);
      setStatusMessage('Verificando suporte do navegador...');

      // Verificar suporte a SharedArrayBuffer
      if (typeof SharedArrayBuffer === 'undefined') {
        throw new Error(
          'SharedArrayBuffer não disponível. Use Chrome ou Edge.'
        );
      }

      setProgress(20);
      setStatusMessage('Inicializando WebContainer...');

      // Boot do WebContainer
      webcontainerInstance = await WebContainer.boot({
        coep: 'credentialless',
        workdirName: 'opencode-project',
      });

      setWc(webcontainerInstance);
      setProgress(30);
      setStatusMessage('Montando arquivos do projeto...');

      // Montar arquivos
      await webcontainerInstance.mount(projectFiles);
      addOutput('✓ Arquivos montados');

      setProgress(50);
      setStatusMessage('Instalando dependências...');

      // Instalar dependências
      const installProcess = await webcontainerInstance.spawn('npm', ['install']);
      
      installProcess.output.pipeTo(
        new WritableStream({
          write(data) {
            addOutput(data);
          },
        })
      );

      const exitCode = await installProcess.exit;
      if (exitCode !== 0) {
        throw new Error(`npm install falhou com código ${exitCode}`);
      }

      addOutput('✓ Dependências instaladas');
      setProgress(80);
      setStatusMessage('Iniciando servidor...');

      // Iniciar servidor
      const serverProcess = await webcontainerInstance.spawn('node', ['server.js'], {
        env: {
          PORT: '4096',
          HOST: '0.0.0.0',
        },
      });

      serverProcess.output.pipeTo(
        new WritableStream({
          write(data) {
            addOutput(data);
          },
        })
      );

      // Aguardar servidor estar pronto
      webcontainerInstance.on('server-ready', (port, url) => {
        addOutput(`✓ Servidor rodando na porta ${port}`);
        setServerUrl(url);
        setProgress(100);
        setStatusMessage('Pronto!');
        setState('ready');
      });

      // Tratar erros
      webcontainerInstance.on('error', (error) => {
        addOutput(`✗ Erro: ${error.message}`);
        setState('error');
      });

    } catch (error) {
      console.error('Erro ao inicializar WebContainer:', error);
      addOutput(`✗ Erro: ${error instanceof Error ? error.message : String(error)}`);
      setState('error');
    }
  };

  onCleanup(() => {
    webcontainerInstance?.teardown();
  });

  // Iniciar na primeira renderização
  if (state() === 'idle') {
    bootWebContainer();
  }

  return (
    <WebContainerContext.Provider
      value={{
        state,
        serverUrl,
        progress,
        statusMessage,
        webcontainer: wc,
        terminalOutput,
      }}
    >
      {props.children}
    </WebContainerContext.Provider>
  );
}

export function useWebContainer() {
  const context = useContext(WebContainerContext);
  if (!context) {
    throw new Error('useWebContainer must be used within WebContainerProvider');
  }
  return context;
}
