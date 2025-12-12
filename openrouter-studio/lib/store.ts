import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Message = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  modelName?: string; 
};

export type AppMode = 'chat' | 'versus' | 'roundtable';

export type ModelParams = {
  temperature: number;
  max_tokens: number;
  top_p: number;
  top_k: number;
  frequency_penalty: number;
  presence_penalty: number;
  repetition_penalty: number;
};

interface ChatState {
  apiKey: string;
  setApiKey: (key: string) => void;
  
  selectedModels: string[]; 
  toggleModel: (modelId: string) => void;
  favorites: string[];
  toggleFavorite: (modelId: string) => void;

  params: ModelParams;
  updateParams: (newParams: Partial<ModelParams>) => void;
  
  messages: Message[];
  addMessage: (msg: Message) => void;
  clearChat: () => void;
  
  mode: AppMode;
  setMode: (mode: AppMode) => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      apiKey: '',
      setApiKey: (key) => set({ apiKey: key }),
      
      // --- SMART SELECTION LOGIC ---
      selectedModels: [], 
      toggleModel: (id) => set((state) => {
        const exists = state.selectedModels.includes(id);
        
        // 1. If we are removing a model, always allow it
        if (exists) {
            return { selectedModels: state.selectedModels.filter(m => m !== id) };
        }

        // 2. Logic for Adding a model
        if (state.mode === 'chat') {
            // Chat Mode: Only 1 allowed. Selecting new one replaces the old one.
            return { selectedModels: [id] };
        } else {
            // Versus/Roundtable: Max 3.
            // If we already have 3, remove the first one (oldest) and add the new one.
            const current = state.selectedModels;
            if (current.length >= 3) {
                const [_, ...rest] = current; // Remove first item
                return { selectedModels: [...rest, id] };
            }
            return { selectedModels: [...state.selectedModels, id] };
        }
      }),

      favorites: [],
      toggleFavorite: (id) => set((state) => {
        const exists = state.favorites.includes(id);
        return {
            favorites: exists
                ? state.favorites.filter(m => m !== id)
                : [...state.favorites, id]
        };
      }),

      params: {
        temperature: 0.7,
        max_tokens: 4096,
        top_p: 1,
        top_k: 0,
        frequency_penalty: 0,
        presence_penalty: 0,
        repetition_penalty: 1,
      },
      updateParams: (p) => set((state) => ({ params: { ...state.params, ...p } })),

      mode: 'chat',
      // --- SMART MODE SWITCHING ---
      setMode: (mode) => set((state) => {
        // If switching TO 'chat', enforce the 1-model limit immediately
        if (mode === 'chat' && state.selectedModels.length > 1) {
            return { mode, selectedModels: [state.selectedModels[0]] };
        }
        return { mode };
      }),

      messages: [],
      addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
      clearChat: () => set({ messages: [] }),
    }),
    {
      name: 'openrouter-storage', 
      partialize: (state) => ({ 
          apiKey: state.apiKey, 
          params: state.params, 
          mode: state.mode,
          favorites: state.favorites,
          selectedModels: state.selectedModels 
      }), 
    }
  )
);