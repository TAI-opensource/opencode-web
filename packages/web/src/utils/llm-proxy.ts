// Utility para chamar as Vercel Functions de proxy LLM

type Provider = 'anthropic' | 'openai' | 'google';

interface LLMRequest {
  provider: Provider;
  apiKey: string;
  messages: Array<{ role: string; content: string }>;
  model?: string;
  stream?: boolean;
  maxTokens?: number;
}

interface LLMResponse {
  choices?: Array<{
    message: {
      role: string;
      content: string;
    };
  }>;
  error?: string;
}

export async function callLLM(request: LLMRequest): Promise<LLMResponse> {
  const { provider, apiKey, messages, model, stream = false, maxTokens } = request;

  try {
    const response = await fetch(`/api/llm/${provider}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apiKey,
        messages,
        model,
        stream,
        maxTokens,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error ${response.status}`);
    }

    if (stream) {
      // Para streaming, retornar o reader
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      let fullContent = '';
      
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          // Processar SSE chunks
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') break;
              
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  fullContent += content;
                }
              } catch {
                // Ignorar erros de parsing
              }
            }
          }
        }
      }
      
      return {
        choices: [{
          message: {
            role: 'assistant',
            content: fullContent,
          },
        }],
      };
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error('LLM proxy error:', error);
    throw error;
  }
}

// Função helper para chat simples
export async function chat(
  provider: Provider,
  apiKey: string,
  message: string,
  options?: {
    model?: string;
    maxTokens?: number;
  }
): Promise<string> {
  const response = await callLLM({
    provider,
    apiKey,
    messages: [{ role: 'user', content: message }],
    model: options?.model,
    maxTokens: options?.maxTokens,
  });

  return response.choices?.[0]?.message?.content || '';
}

// Função helper para chat com histórico
export async function chatWithHistory(
  provider: Provider,
  apiKey: string,
  messages: Array<{ role: string; content: string }>,
  options?: {
    model?: string;
    maxTokens?: number;
  }
): Promise<string> {
  const response = await callLLM({
    provider,
    apiKey,
    messages,
    model: options?.model,
    maxTokens: options?.maxTokens,
  });

  return response.choices?.[0]?.message?.content || '';
}
