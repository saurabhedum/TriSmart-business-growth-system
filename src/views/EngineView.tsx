import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { subscribeToSettings, saveSettings, AppSettings } from "../lib/db";
import { toast } from "react-hot-toast";
import {
  Sparkles, Instagram, MessageCircle, FileText, Mail, Megaphone, Mic, 
  MessageSquare, LayoutTemplate, Smartphone, Key, Check, Loader2, Edit2, AlertCircle, Send, X
} from "lucide-react";

const contentTypes = [
  { id: "instagram", label: "Instagram Caption", icon: Instagram },
  { id: "whatsapp", label: "WhatsApp Broadcast", icon: MessageCircle },
  { id: "blog", label: "Blog Post", icon: FileText },
  { id: "email", label: "Email Newsletter", icon: Mail },
  { id: "press", label: "Press Release", icon: Megaphone },
  { id: "podcast", label: "Podcast Script", icon: Mic },
  { id: "ad", label: "Ad Copy", icon: MessageSquare },
  { id: "landing", label: "Landing Page", icon: LayoutTemplate },
  { id: "sms", label: "SMS Campaign", icon: Smartphone },
];

const toneOptions = [
  "Professional & Authoritative",
  "Casual & Friendly",
  "Persuasive & Sales-Oriented",
  "Humorous & Witty",
  "Inspirational & Motivating",
  "Educational & Informative",
  "Urgent & Time-Sensitive",
  "Storytelling & Narrative",
  "Bold & Controversial",
  "Empathetic & Caring",
  "Minimalist & Direct",
  "Enthusiastic & Energetic",
  "Luxurious & Premium",
  "Conversational & Approachable",
  "Data-Driven & Analytical"
];

export function EngineView() {
  const [settings, setSettings] = useState<Partial<AppSettings>>({});
  const [groqKey, setGroqKey] = useState("");
  const [isEditingKey, setIsEditingKey] = useState(false);

  const [topic, setTopic] = useState("");
  const [selectedType, setSelectedType] = useState("blog");
  const [tone, setTone] = useState(toneOptions[0]);
  const [language, setLanguage] = useState("English");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState("");

  useEffect(() => {
    const unsub = subscribeToSettings((data) => {
      if (data) {
        setSettings(data);
        if (data.groqApiKey) {
          setGroqKey(data.groqApiKey);
          setIsEditingKey(false);
        } else {
          setIsEditingKey(true);
        }
      } else {
        setIsEditingKey(true);
      }
    });
    return () => unsub();
  }, []);

  const handleSaveKey = async () => {
    if (!groqKey.trim()) {
      toast.error("Please enter a valid Groq API Key");
      return;
    }
    try {
      await saveSettings({ ...settings, groqApiKey: groqKey.trim() });
      setIsEditingKey(false);
      toast.success("API Key saved securely!");
    } catch (e: any) {
      toast.error("Failed to save key");
    }
  };

  const handleDeleteKey = async () => {
    try {
      await saveSettings({ ...settings, groqApiKey: "" });
      setGroqKey("");
      setIsEditingKey(true);
      toast.success("API Key removed!");
    } catch (e: any) {
      toast.error("Failed to remove key");
    }
  };

  const handleGenerate = async () => {
    if (!settings.groqApiKey) {
      toast.error("Please save your Groq API Key first.");
      return;
    }
    if (!topic.trim()) {
      toast.error("Please tell us what this is about.");
      return;
    }

    setIsGenerating(true);
    setResult("");

    const targetType = contentTypes.find(t => t.id === selectedType)?.label || selectedType;
    let prompt = `You are an expert marketing and content creation AI.
Task: Write a ${targetType} about "${topic}".
Tone: ${tone}.
Language: ${language}.
`;

    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${settings.groqApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }]
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || "Generation failed. Please check your API key.");
      }
      
      const text = data.choices?.[0]?.message?.content || "";
      setResult(text);
      toast.success("Content generated successfully!");
    } catch (error: any) {
       toast.error(error.message);
    } finally {
       setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 min-h-[calc(100vh-64px)] rounded-[40px] neu-text relative">
      
      {/* Top Bar for API Key */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 md:p-6 neu-flat rounded-3xl z-10 relative">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="w-10 h-10 rounded-full neu-pressed flex items-center justify-center">
            <Key className="w-5 h-5 neu-accent" />
          </div>
          <div>
            <h2 className="neu-text font-bold text-sm">Groq AI Connection</h2>
            <p className="neu-text-muted text-xs">Required for Content Engine</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <AnimatePresence mode="wait">
            {isEditingKey ? (
              <motion.div 
                key="editing"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center gap-2 w-full"
              >
                <input
                  type="password"
                  placeholder="gsk_..."
                  value={groqKey}
                  onChange={(e) => setGroqKey(e.target.value)}
                  className="neu-pressed rounded-xl px-4 py-2 w-full md:w-64 text-sm focus:outline-none transition-colors neu-text"
                />
                <button
                  onClick={handleSaveKey}
                  className="px-4 py-2 rounded-xl text-sm font-semibold transition-colors neu-flat neu-accent whitespace-nowrap"
                >
                  Save Key
                </button>
              </motion.div>
            ) : (
              <motion.div 
                key="saved"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-4 neu-pressed px-2 py-1.5 rounded-full"
              >
                <div className="flex items-center gap-2 pl-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                  <span className="text-xs neu-text-muted font-mono tracking-wider">
                    {groqKey.slice(0, 4)}••••{groqKey.slice(-4)}
                  </span>
                </div>
                
                <div className="flex items-center gap-1">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    className="w-8 h-8 rounded-full border border-green-500/30 flex items-center justify-center mr-2 relative"
                  >
                    <div className="absolute inset-0 rounded-full bg-green-500/10 mix-blend-overlay"></div>
                    <Check className="w-4 h-4 text-green-500 z-10" />
                  </motion.div>
                  <button
                    onClick={() => setIsEditingKey(true)}
                    className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full neu-text-muted hover:neu-text transition-colors"
                    title="Edit Key"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleDeleteKey}
                    className="p-2 hover:bg-red-500/10 text-red-500/70 hover:text-red-500 rounded-full transition-colors mr-1"
                    title="Remove Key"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
        
        {/* Left Panel: Content AI Form */}
        <div className="neu-flat rounded-3xl p-6 md:p-8 flex flex-col gap-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-32 bg-[var(--accent)] opacity-5 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="flex items-center gap-3 relative z-10">
            <div className="p-2 neu-pressed rounded-xl border border-[var(--accent)]/20">
              <Sparkles className="w-5 h-5 neu-accent" />
            </div>
            <h2 className="text-xl font-semibold neu-text font-sans tracking-tight">Generate New Content</h2>
          </div>

          <div className="space-y-3 relative z-10">
            <label className="text-sm font-medium neu-text-muted">What is this about?</label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., The Future of AI in Marketing"
              className="w-full neu-pressed rounded-xl p-4 text-sm focus:outline-none transition-colors neu-text placeholder:opacity-50 resize-none h-24"
            />
          </div>

          <div className="space-y-4 relative z-10">
            <label className="text-sm font-medium neu-text-muted">Where are you posting this?</label>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
              {contentTypes.map((type) => {
                const isSelected = selectedType === type.id;
                const Icon = type.icon;
                return (
                  <button
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl gap-2 transition-all duration-200 border ${
                      isSelected 
                        ? 'bg-[var(--accent)]/10 border-[var(--accent)]/50 shadow-[0_0_20px_-10px_var(--accent)]' 
                        : 'neu-pressed border-transparent hover:border-black/10 dark:hover:border-white/10'
                    }`}
                  >
                    <Icon className={`w-6 h-6 ${isSelected ? 'neu-accent' : 'neu-text-muted opacity-50'}`} strokeWidth={1.5} />
                    <span className={`text-[10px] sm:text-xs font-medium text-center ${isSelected ? 'neu-accent' : 'neu-text-muted opacity-50'}`}>
                      {type.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
            <div className="space-y-3">
              <label className="text-sm font-medium neu-text-muted">How should it sound?</label>
              <div className="relative">
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full neu-pressed border-transparent rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)]/50 transition-colors neu-text appearance-none cursor-pointer"
                >
                  {toneOptions.map(t => (
                    <option key={t} value={t} className="neu-bg">{t}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 neu-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-sm font-medium neu-text-muted">What language?</label>
              <input
                type="text"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                placeholder="e.g., English, Hindi, Marathi"
                className="w-full neu-pressed border-transparent rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)]/50 transition-colors neu-text placeholder:opacity-50"
              />
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !settings.groqApiKey}
            className={`w-full py-4 rounded-xl font-bold text-sm tracking-wide transition-all relative z-10 flex items-center justify-center gap-2 ${
              isGenerating || !settings.groqApiKey
                ? "neu-pressed opacity-50 cursor-not-allowed neu-text-muted" 
                : "neu-accent-bg text-white neu-flat hover:brightness-110 shadow-[0_0_30px_-5px_var(--accent)]"
            }`}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Write It
              </>
            )}
          </button>
        </div>

        {/* Right Panel: Result */}
        <div className="neu-flat rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col h-full min-h-[500px]">
          <h2 className="text-xl font-semibold neu-text font-sans tracking-tight mb-6">Your Result</h2>
          
          <div className={`flex-1 rounded-2xl ${!result ? 'border border-dashed border-black/10 dark:border-white/10 flex items-center justify-center' : 'neu-pressed p-6 overflow-y-auto'}`}>
            {!result ? (
              <div className="flex flex-col items-center gap-4 neu-text-muted opacity-50">
                <FileText className="w-12 h-12" strokeWidth={1} />
                <span className="text-sm">Your text will appear here.</span>
              </div>
            ) : (
              <div className="prose dark:prose-invert max-w-none neu-text text-sm leading-relaxed whitespace-pre-wrap">
                {result}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

