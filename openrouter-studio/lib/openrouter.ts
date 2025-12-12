import { useChatStore } from './store';

export async function fetchOpenRouterModels() {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/models');
    if (!response.ok) throw new Error(`Failed to fetch models: ${response.status}`);
    const json = await response.json();
    return json.data; 
  } catch (error) {
    console.error("API Error:", error);
    return []; 
  }
}

export async function sendMessageToOpenRouter(
  messages: any[], // CHANGED: Now accepts the FULL array, doesn't force a new prompt
  modelId: string, 
  signal: AbortSignal,
  onChunk: (text: string) => void
) {
  const { apiKey, params } = useChatStore.getState();

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": `${window.location.origin}`, 
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: modelId,
        messages: messages, // Send exactly what we passed
        stream: true,
        ...params 
      }),
      signal
    });

    if (!response.ok) {
        const errorText = await response.text();
        onChunk(`[Error: ${response.status} - ${errorText}]`);
        return;
    }

    if (!response.body) throw new Error("No response body");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(line => line.trim() !== '');
      
      for (const line of lines) {
        if (line === 'data: [DONE]') return;
        if (line.startsWith('data: ')) {
          try {
            const json = JSON.parse(line.replace('data: ', ''));
            const content = json.choices[0]?.delta?.content || "";
            if (content) onChunk(content);
          } catch (e) { }
        }
      }
    }
  } catch (error: any) {
    if (error.name !== 'AbortError') {
        onChunk(`[System Error: ${error.message}]`);
    }
  }
}