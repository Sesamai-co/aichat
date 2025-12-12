"use client";
import React, { useEffect, useState } from 'react';
import { useChatStore } from '@/lib/store';
import { fetchOpenRouterModels } from '@/lib/openrouter';
import { Sliders, X, Star, ChevronDown, ChevronRight, Plus, Trash2, HelpCircle, BrainCircuit, Key } from 'lucide-react';

const PARAM_DESCRIPTIONS: Record<string, string> = {
    temperature: "Creativity Slider.\n• Low (0.2): Strict, logical.\n• High (0.8+): Imaginative, random.",
    max_tokens: "Max length of response.\n• Low: Short answers.\n• High: Long essays.",
    top_p: "Nucleus Sampling.\n• Low: Safe words only.\n• High: Diverse vocabulary.",
    top_k: "Vocabulary Limit.\n• Low: Top 10 words.\n• High: Huge pool of words.",
    frequency_penalty: "Anti-Repetition.\n• Increase if AI repeats itself.",
    presence_penalty: "Topic Switcher.\n• Increase to force new topics."
};

export default function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  // Added apiKey and setApiKey to the store selector
  const { selectedModels, toggleModel, params, updateParams, favorites, toggleFavorite, mode, apiKey, setApiKey } = useChatStore();
  const [availableModels, setAvailableModels] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showParams, setShowParams] = useState(true);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showReasoningOnly, setShowReasoningOnly] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const models = await fetchOpenRouterModels();
        setAvailableModels(models);
      } catch (e) {
        console.error("Failed to load models", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const sortedModels = [...availableModels].sort((a, b) => {
    const aFav = favorites.includes(a.id);
    const bFav = favorites.includes(b.id);
    if (aFav && !bFav) return -1;
    if (!aFav && bFav) return 1;
    return a.name.localeCompare(b.name);
  });

  const filteredModels = sortedModels.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase()) || m.id.toLowerCase().includes(search.toLowerCase());
    const matchesReasoning = showReasoningOnly 
        ? (m.id.includes('reasoning') || m.name.toLowerCase().includes('think') || m.id.includes('o1') || m.id.includes('r1')) 
        : true;
    return matchesSearch && matchesReasoning;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 left-0 w-80 bg-gray-900 border-r border-gray-700 shadow-2xl z-50 flex flex-col font-sans">
      <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800">
        <h2 className="font-bold text-lg text-white">Studio Controls</h2>
        <button onClick={onClose} className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white"><X size={20}/></button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-gray-700">
        
        {/* --- API KEY SECTION (New) --- */}
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
            <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-blue-400">
                <Key size={16} />
                <span>API Credentials</span>
            </div>
            <input 
                type="password" 
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-or-..." 
                className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder-gray-600"
            />
            <div className="text-[10px] text-gray-500 mt-1.5 ml-1">Key is stored locally in your browser.</div>
        </div>

        {/* --- ACTIVE MODELS --- */}
        <div>
            <div className="flex justify-between items-end mb-3">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Active Models</h3>
                <span className="text-[10px] bg-blue-900/30 text-blue-400 px-2 py-0.5 rounded border border-blue-800/50">{mode.toUpperCase()}</span>
            </div>
            
            <div className="space-y-2 mb-3">
                {selectedModels.length === 0 && <p className="text-sm text-gray-500 italic p-2">No models selected.</p>}
                {selectedModels.map(id => {
                    const model = availableModels.find(m => m.id === id);
                    return (
                        <div key={id} className="flex items-center justify-between bg-gray-800 border border-gray-700 p-2.5 rounded-lg text-sm group hover:border-blue-500/30 transition-colors">
                            <span className="truncate w-48 font-medium text-gray-200">{model?.name || id}</span>
                            <button onClick={() => toggleModel(id)} className="text-gray-500 hover:text-red-400 transition-colors"><Trash2 size={16}/></button>
                        </div>
                    );
                })}
            </div>

            <div className="relative">
                <button 
                    onClick={() => setShowModelDropdown(!showModelDropdown)}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-all shadow-lg shadow-blue-900/20"
                >
                    <Plus size={16}/> Add Model {mode === 'chat' && selectedModels.length > 0 ? "(Replace)" : ""}
                </button>

                {showModelDropdown && (
                    <div className="absolute top-12 left-0 w-full bg-gray-800 border border-gray-600 rounded-xl shadow-2xl max-h-96 overflow-y-auto z-50 p-2 animate-in fade-in slide-in-from-top-2">
                        <div className="mb-2 space-y-2 sticky top-0 bg-gray-800 z-10 pb-2">
                             <input 
                                type="text" 
                                placeholder="Search models..." 
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none text-white placeholder-gray-500"
                                autoFocus
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            <button 
                                onClick={() => setShowReasoningOnly(!showReasoningOnly)}
                                className={`w-full flex items-center justify-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium border transition-all ${showReasoningOnly ? 'bg-purple-500/10 border-purple-500/50 text-purple-300' : 'bg-gray-700/50 border-gray-600 text-gray-400 hover:bg-gray-700'}`}
                            >
                                <BrainCircuit size={14} />
                                {showReasoningOnly ? "Reasoning Models Only" : "Filter: Reasoning Models"}
                            </button>
                        </div>

                        {loading ? <div className="p-4 text-center text-sm text-gray-500">Loading OpenRouter list...</div> : (
                            <div className="space-y-1">
                                {filteredModels.slice(0, 100).map((model, index) => {
                                    const isFav = favorites.includes(model.id);
                                    const isSelected = selectedModels.includes(model.id);
                                    const showSeparator = isFav && index < filteredModels.length - 1 && !favorites.includes(filteredModels[index + 1].id);

                                    return (
                                        <div key={model.id}>
                                            <div className={`flex items-center gap-2 hover:bg-gray-700 p-2 rounded-lg cursor-pointer group transition-colors ${isSelected ? 'bg-blue-900/20 border border-blue-500/20' : ''}`}>
                                                <button onClick={(e) => { e.stopPropagation(); toggleFavorite(model.id); }} className="p-1 hover:bg-gray-600 rounded">
                                                    <Star size={14} className={isFav ? "fill-yellow-500 text-yellow-500" : "text-gray-600 group-hover:text-gray-400"} />
                                                </button>
                                                <div 
                                                    onClick={() => { toggleModel(model.id); if(mode === 'chat') setShowModelDropdown(false); }}
                                                    className={`flex-1 truncate text-sm ${isSelected ? 'text-blue-200' : 'text-gray-300'}`}
                                                >
                                                    {model.name}
                                                </div>
                                            </div>
                                            {showSeparator && <div className="h-px bg-gray-700 my-2 mx-2"></div>}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>

        {/* --- PARAMETERS --- */}
        <div className="border border-gray-700 rounded-xl bg-gray-800/50 overflow-hidden">
            <button onClick={() => setShowParams(!showParams)} className="flex items-center justify-between w-full p-3 text-sm font-bold bg-gray-800 hover:bg-gray-750 transition-colors">
                <div className="flex items-center gap-2 text-gray-200"><Sliders size={16}/> Parameters</div>
                {showParams ? <ChevronDown size={16} className="text-gray-400"/> : <ChevronRight size={16} className="text-gray-400"/>}
            </button>
            {showParams && (
                <div className="p-4 space-y-6 bg-gray-900/30">
                    {Object.entries(params).map(([key, val]) => (
                        <ParamSlider key={key} label={key.replace('_', ' ')} value={val} 
                            onChange={(v: number) => updateParams({ [key]: v })} 
                            min={key.includes('penalty') ? -2 : 0} 
                            max={key === 'max_tokens' ? 8000 : (key === 'top_k' ? 100 : 2)} 
                            step={key === 'max_tokens' ? 100 : 0.1} 
                            desc={PARAM_DESCRIPTIONS[key]} 
                        />
                    ))}
                </div>
            )}
        </div>
      </div>
    </div>
  );
}

function ParamSlider({ label, value, onChange, min, max, step, desc }: any) {
    return (
        <div className="relative">
            <div className="flex justify-between items-center mb-1.5 group">
                <div className="flex items-center gap-1.5 cursor-help">
                    <span className="text-xs font-medium text-gray-400 capitalize hover:text-gray-200 transition-colors border-b border-dotted border-gray-700">{label}</span>
                    <HelpCircle size={10} className="text-gray-600" />
                </div>
                <span className="text-[10px] bg-gray-800 text-blue-400 font-mono px-1.5 py-0.5 rounded border border-gray-700">{value}</span>
                <div className="absolute bottom-full left-0 mb-2 w-56 bg-gray-950 text-xs p-3 rounded-xl shadow-2xl border border-gray-800 hidden group-hover:block z-50 whitespace-pre-wrap leading-relaxed text-gray-300">
                    {desc}
                </div>
            </div>
            <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400" />
        </div>
    );
}