import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Settings,
  Bell,
  Shield,
  User,
  Globe,
  Palette,
  Save,
  CreditCard,
  Plus,
  Zap,
  Send,
  Webhook,
  Cpu,
  Clock,
  MessageCircle,
  Loader2,
  X,
  Info,
  Instagram,
  Target,
  Megaphone,
  Bot,
  AlertCircle,
  Fingerprint,
  Lock,
  ShieldCheck,
  Activity,
  BarChart,
  Database,
  Languages,
  Key,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  saveSettings,
  AppSettings,
  resetDatabase,
  getChatbotSettings,
  ChatbotSettings,
} from "../lib/db";
import { useData } from "../contexts/DataContext";
import { auth, logout } from "../firebase";
import { ConfirmModal } from "../components/ConfirmModal";
import { cn } from "../lib/utils";
import { toast } from "react-hot-toast";
import { whatsappService } from "../services/whatsappService";

export function SettingsView() {
  const { settings: contextSettings } = useData();
  const [testPhoneNumber, setTestPhoneNumber] = useState("");
  const [isTestSending, setIsTestSending] = useState(false);
  const [activeTab, setActiveTab] = useState<
    | "profile"
    | "messaging"
    | "security"
    | "conversions"
    | "broadcast"
    | "automation"
  >("profile");
  const [settings, setSettings] = useState<AppSettings>(
    contextSettings || {
      businessName: "",
      businessLogo: null,
      automationEnabled: true,
      chatbotActive: true,
      automation: {
        leadCapturing: true,
        autoReplies: true,
        bulkMessaging: true,
        campaignScheduling: true,
        smartNotifications: true,
      },
    },
  );

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    if (contextSettings) {
      setSettings(contextSettings);
    }
  }, [contextSettings]);

  useEffect(() => {
    if (settings.autoSaveEnabled && settings !== contextSettings) {
      const timer = setTimeout(() => {
        saveSettings(settings).catch((err: any) => {
          toast.error("Auto-save failed: " + (err.message || ""));
        });
        setSaveMessage("Auto-saved");
        setTimeout(() => setSaveMessage(""), 2000);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [settings, settings.autoSaveEnabled, contextSettings]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveSettings(settings);
      setSaveMessage("Settings synchronized successfully");
      setTimeout(() => setSaveMessage(""), 3000);
      toast.success("Settings deployed");
    } catch (e: any) {
      toast.error("Save failed: " + (e.message || ""));
    } finally {
      setIsSaving(false);
    }
  };

  const performReset = async () => {
    setIsResetting(true);
    try {
      await resetDatabase();
      await logout();
      window.location.reload();
    } catch (err: any) {
      toast.error("Reset failed: " + (err.message || ""));
    } finally {
      setIsResetting(false);
    }
  };

  const renderToggle = (
    key: keyof AppSettings,
    label: string,
    desc: string,
    icon: any,
    customSettingsObj?: any,
  ) => {
    const Icon = icon;
    const targetObj = customSettingsObj
      ? (settings[customSettingsObj as keyof AppSettings] as any) || {}
      : settings;
    const isChecked = !!targetObj[key];

    return (
      <label className="flex items-start justify-between p-6 neu-pressed rounded-3xl cursor-pointer group hover:bg-accent/5 transition-all relative">
        <div className="flex gap-4">
          <div className="p-3 neu-flat rounded-xl text-accent h-fit">
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-black uppercase tracking-widest">
              {label}
            </span>
            <span className="text-[10px] neu-text-muted font-bold tracking-wide leading-relaxed max-w-xs">
              {desc}
            </span>
          </div>
        </div>
        <input
          type="checkbox"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer peer z-10"
          checked={isChecked}
          onChange={(e) => {
            if (customSettingsObj) {
              setSettings({
                ...settings,
                [customSettingsObj]: { ...targetObj, [key]: e.target.checked },
              });
            } else {
              setSettings({ ...settings, [key]: e.target.checked });
            }
          }}
        />
        <div className="w-12 h-6 bg-slate-200 dark:bg-black/40 rounded-full peer peer-checked:bg-accent transition-all relative shrink-0 shadow-inner mt-2 border border-black/10">
          <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all peer-checked:translate-x-6 shadow-md"></div>
        </div>
      </label>
    );
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 neu-flat rounded-xl text-accent">
              <User className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent/60">
              User Workspace
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase mb-2">
            Settings <span className="text-accent">& Profile</span>
          </h1>
          <p className="text-xs neu-text-muted font-bold max-w-lg leading-relaxed uppercase tracking-tight opacity-70">
            Manage your business details, automated messages, and app connections.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <AnimatePresence>
            {saveMessage && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="text-[10px] font-black text-emerald-600 uppercase tracking-widest px-4 py-2 bg-emerald-500/10 rounded-lg"
              >
                {saveMessage}
              </motion.span>
            )}
          </AnimatePresence>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            disabled={isSaving || settings.autoSaveEnabled}
            className="w-full sm:w-auto px-8 py-4 neu-flat bg-accent text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-accent/20 flex items-center justify-center gap-3 disabled:opacity-40"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {settings.autoSaveEnabled
              ? "Auto-Saving Active"
              : isSaving
                ? "Saving..."
                : "Deploy Config"}
          </motion.button>
        </div>
      </div>

      <div className="flex p-1.5 neu-pressed rounded-2xl flex-nowrap overflow-x-auto no-scrollbar gap-1 relative">
        {[
          { id: "profile", icon: User, label: "Profile" },
          { id: "messaging", icon: MessageCircle, label: "Messaging" },
          { id: "api_keys", icon: Key, label: "API Integrations" },
          { id: "automation", icon: Cpu, label: "Automation" },
          { id: "conversions", icon: CreditCard, label: "Conversions" },
          { id: "broadcast", icon: Megaphone, label: "Broadcast" },
          { id: "security", icon: Shield, label: "Security" },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`relative flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex-1 overflow-hidden group ${
                isActive
                  ? "text-accent shadow-lg shadow-accent/10"
                  : "neu-text-muted opacity-60 hover:opacity-100 hover:bg-black/5"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="settings-active-tab"
                  className="absolute inset-0 neu-flat bg-white dark:bg-black/20 rounded-xl"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <div className="relative z-10 flex items-center justify-center">
                <motion.div
                  animate={
                    isActive
                      ? {
                          rotate: [0, -15, 15, -15, 15, 0],
                          scale: [1, 1.2, 1],
                        }
                      : {}
                  }
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                  className={isActive ? "text-accent" : ""}
                >
                  <tab.icon className="w-5 h-5 mx-auto flex-shrink-0" />
                </motion.div>
                <motion.div
                  initial={false}
                  animate={{
                    width: isActive ? 0 : "auto",
                    opacity: isActive ? 0 : 1,
                    marginLeft: isActive ? 0 : 8,
                  }}
                  className="overflow-hidden whitespace-nowrap flex-shrink-0 origin-left"
                >
                  {tab.label}
                </motion.div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-8">
        {activeTab === "profile" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <Card className="border-none rounded-3xl neu-flat hover:shadow-2xl hover:shadow-accent/[0.05] transition-all overflow-hidden">
              <CardHeader className="border-b border-black/[0.03] bg-black/[0.02]">
                <CardTitle className="text-[11px] font-black uppercase tracking-widest flex items-center gap-2">
                  <User className="w-4 h-4 text-accent" /> Business Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="w-32 h-32 rounded-3xl neu-pressed flex items-center justify-center overflow-hidden shrink-0 relative group">
                    {settings.businessLogo ? (
                      <img
                        src={settings.businessLogo}
                        alt="Logo"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-4">
                        <User className="w-8 h-8 mx-auto text-neutral-300 mb-2" />
                        <span className="text-[8px] font-black uppercase text-neutral-400">
                          No Logo
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <label className="cursor-pointer px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-xl text-[10px] font-black uppercase text-white tracking-widest transition-colors">
                        Upload
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 10 * 1024 * 1024) {
                                alert("File is too large.");
                                return;
                              }
                              const reader = new FileReader();
                              reader.onload = (e) => {
                                const img = new Image();
                                img.onload = () => {
                                  const canvas = document.createElement('canvas');
                                  let width = img.width;
                                  let height = img.height;
                                  
                                  const MAX_SIZE = 500;
                                  if (width > height) {
                                    if (width > MAX_SIZE) {
                                      height *= MAX_SIZE / width;
                                      width = MAX_SIZE;
                                    }
                                  } else {
                                    if (height > MAX_SIZE) {
                                      width *= MAX_SIZE / height;
                                      height = MAX_SIZE;
                                    }
                                  }
                                  
                                  canvas.width = width;
                                  canvas.height = height;
                                  const ctx = canvas.getContext('2d');
                                  if (ctx) {
                                    ctx.drawImage(img, 0, 0, width, height);
                                    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                                    setSettings({
                                      ...settings,
                                      businessLogo: dataUrl,
                                    });
                                  }
                                };
                                img.src = e.target?.result as string;
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-widest text-neutral-800 dark:text-neutral-200">
                      Brand Logo
                    </h4>
                    <p className="text-[10px] font-bold text-neutral-500 max-w-sm mt-1 uppercase tracking-wide leading-relaxed">
                      This logo will be displayed across your app, printed
                      reports, and acts as the PWA icon wrapper.
                    </p>
                    {settings.businessLogo && (
                      <button
                        onClick={() =>
                          setSettings({ ...settings, businessLogo: null })
                        }
                        className="mt-4 text-[10px] uppercase font-black tracking-widest text-red-500 hover:text-red-600 transition-colors"
                      >
                        Remove Logo
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex justify-end border-t border-black/[0.05] dark:border-white/[0.05] pt-6">
                  <button
                    onClick={() => {
                        localStorage.removeItem('tourCompleted');
                        window.location.reload();
                    }}
                    className="px-4 py-2 bg-accent/10 text-accent text-[10px] uppercase font-black tracking-widest rounded-xl hover:bg-accent/20 transition-colors"
                  >
                    Reset Quick Start Tour
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest neu-text-muted ml-1">
                      Trade Name
                    </label>
                    <input
                      type="text"
                      value={settings.businessName || ""}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          businessName: e.target.value,
                        })
                      }
                      className="w-full px-6 py-4 neu-pressed rounded-2xl bg-transparent outline-none text-sm font-bold"
                      placeholder="e.g. Trismart Digital"
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest neu-text-muted ml-1">
                      Domain & Registry
                    </label>
                    <input
                      type="text"
                      value={settings.businessDomain || ""}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          businessDomain: e.target.value,
                        })
                      }
                      className="w-full px-6 py-4 neu-pressed rounded-2xl bg-transparent outline-none text-sm font-bold"
                      placeholder="yourcompany.com"
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest neu-text-muted ml-1">
                      Preferred Language
                    </label>
                    <select
                      value={settings.preferredLanguage || "en"}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          preferredLanguage: e.target.value as any,
                        })
                      }
                      className="w-full px-6 py-4 neu-pressed rounded-2xl bg-transparent outline-none text-sm font-bold cursor-pointer"
                    >
                      <option value="en">English (US)</option>
                      <option value="hi">हिन्दी (Hindi)</option>
                      <option value="pa">ਪੰਜਾਬੀ (Punjabi)</option>
                    </select>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest neu-text-muted ml-1">
                      Operational Timezone
                    </label>
                    <select
                      value={settings.businessTimezone || "UTC"}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          businessTimezone: e.target.value,
                        })
                      }
                      className="w-full px-6 py-4 neu-pressed rounded-2xl bg-transparent outline-none text-sm font-bold cursor-pointer"
                    >
                      <option value="UTC">
                        Coordinated Universal Time (UTC)
                      </option>
                      <option value="EST">Eastern Standard Time (EST)</option>
                      <option value="PST">Pacific Standard Time (PST)</option>
                      <option value="IST">Indian Standard Time (IST)</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none rounded-3xl neu-flat hover:shadow-2xl transition-all overflow-hidden">
              <CardHeader className="border-b border-black/[0.03] bg-black/[0.02]">
                <CardTitle className="text-[11px] font-black uppercase tracking-widest flex items-center gap-2">
                  <Bot className="w-4 h-4 text-accent" /> Custom AI Instructions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-4">
                <p className="text-xs neu-text-muted font-bold leading-relaxed mb-4">
                  Tell the AI how it should talk to your customers (e.g. friendly, professional, always say thanks).
                </p>
                <textarea
                  rows={6}
                  value={settings.aiPersonaInstructions || ""}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      aiPersonaInstructions: e.target.value,
                    })
                  }
                  onBlur={() => {
                    if (!settings.autoSaveEnabled) handleSave();
                  }}
                  className="w-full p-6 neu-pressed rounded-2xl bg-transparent outline-none text-sm font-medium leading-loose resize-none focus:ring-2 ring-accent/50"
                  placeholder="e.g. Always respond in a highly professional, concise manner. Never promise exact delivery dates..."
                />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {activeTab === "messaging" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <Card className="border-none rounded-3xl neu-flat overflow-hidden">
              <CardHeader className="border-b border-black/[0.03] bg-black/[0.02]">
                <CardTitle className="text-[11px] font-black uppercase tracking-widest flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-accent" /> Smart Messaging Features
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                  {renderToggle(
                    "autoVoiceToText",
                    "Voice Notes to Text",
                    "Automatically convert audio messages into readable text.",
                    Webhook,
                  )}
                  {renderToggle(
                    "sentimentAnalysis",
                    "Detect Upset Customers",
                    "Flag messages from angry customers so you can reply faster.",
                    Target,
                  )}
                  {renderToggle(
                    "toxicityFilter",
                    "Block Bad Words",
                    "Automatically hide messages with abusive language.",
                    ShieldCheck,
                  )}
                  <label className="flex items-start justify-between p-6 neu-pressed rounded-3xl opacity-50 cursor-not-allowed group">
                    <div className="flex gap-4">
                      <div className="p-3 neu-flat rounded-xl text-slate-500 h-fit">
                        <Languages className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-black uppercase tracking-widest">
                          Real-time Translation
                        </span>
                        <span className="text-[10px] neu-text-muted font-bold tracking-wide leading-relaxed max-w-xs">
                          Coming soon to Omniverse
                        </span>
                      </div>
                    </div>
                    <div className="w-12 h-6 bg-slate-200 rounded-full relative shrink-0 shadow-inner mt-2">
                      <div className="absolute left-1 top-1 w-4 h-4 bg-white/50 rounded-full"></div>
                    </div>
                  </label>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {activeTab === ("api_keys" as any) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <Card className="border-none rounded-3xl neu-flat hover:shadow-2xl transition-all overflow-hidden">
              <CardHeader className="border-b border-black/[0.03] bg-black/[0.02]">
                <CardTitle className="text-[11px] font-black uppercase tracking-widest flex items-center gap-2">
                  <Key className="w-4 h-4 text-accent" /> Connect Apps
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-widest neu-text-muted ml-1 flex justify-between items-center">
                        <span>Instagram Setup</span>
                        <select
                          value={settings.instaApiMode || "manual"}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              instaApiMode: e.target.value as any,
                            })
                          }
                          className="bg-transparent font-bold !text-[10px] outline-none"
                        >
                          <option value="manual">Manual</option>
                          <option value="api">API Live</option>
                        </select>
                      </label>
                      <input
                        type={
                          settings.instaApiMode === "manual"
                            ? "text"
                            : "password"
                        }
                        value={settings.instaApiToken || ""}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            instaApiToken: e.target.value,
                          })
                        }
                        disabled={settings.instaApiMode === "manual"}
                        className="w-full px-6 py-4 neu-pressed rounded-2xl bg-transparent outline-none text-sm font-bold disabled:opacity-50"
                        placeholder={
                          settings.instaApiMode === "manual"
                            ? "Manual mode active"
                            : "Graph API Token"
                        }
                      />
                      <input
                        type="text"
                        value={settings.instaAccountId || ""}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            instaAccountId: e.target.value,
                          })
                        }
                        disabled={settings.instaApiMode === "manual"}
                        className="w-full px-6 py-4 neu-pressed rounded-2xl bg-transparent outline-none text-sm font-bold disabled:opacity-50"
                        placeholder={
                          settings.instaApiMode === "manual"
                            ? "Manual mode active"
                            : "Instagram Account ID"
                        }
                      />
                    </div>
                    {settings.instaApiMode === "api" && (
                      <button
                        onClick={async () => {
                          const id = toast.loading(
                            "Testing Instagram Graph API connection...",
                          );
                          if (
                            !settings.instaAccountId ||
                            !settings.instaApiToken
                          ) {
                            toast.error(
                              "Please enter both Account ID and API Token",
                              { id },
                            );
                            return;
                          }
                          try {
                            const res = await fetch(
                              `https://graph.facebook.com/v18.0/${encodeURIComponent(settings.instaAccountId || "")}?fields=id,username,name&access_token=${encodeURIComponent(settings.instaApiToken || "")}`,
                            );
                            const data = await res.json();
                            if (res.ok && data.id) {
                              toast.success(
                                `Success! Connected as @${data.username || data.name || data.id}`,
                                { id },
                              );
                            } else {
                              toast.error(
                                `API Error: ${data.error?.message || "Invalid credentials"}`,
                                { id },
                              );
                            }
                          } catch (e: any) {
                            toast.error(`Network Error: ${e.message}`, { id });
                          }
                        }}
                        className="px-6 py-3 neu-flat rounded-xl text-[10px] font-black uppercase tracking-widest text-accent flex items-center gap-2 hover:bg-black/5"
                      >
                        <Activity className="w-3 h-3" /> Test Connection
                      </button>
                    )}
                  </div>
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-widest neu-text-muted ml-1 flex justify-between items-center">
                        <span>WhatsApp Setup</span>
                        <select
                          value={settings.whatsappApiMode || "manual"}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              whatsappApiMode: e.target.value as any,
                            })
                          }
                          className="bg-transparent font-bold !text-[10px] outline-none"
                        >
                          <option value="manual">Manual</option>
                          <option value="api">API Live</option>
                        </select>
                      </label>
                      <input
                        type={
                          settings.whatsappApiMode === "manual"
                            ? "text"
                            : "password"
                        }
                        value={settings.whatsappApiToken || ""}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            whatsappApiToken: e.target.value,
                          })
                        }
                        disabled={settings.whatsappApiMode === "manual"}
                        className="w-full px-6 py-4 neu-pressed rounded-2xl bg-transparent outline-none text-sm font-bold disabled:opacity-50"
                        placeholder={
                          settings.whatsappApiMode === "manual"
                            ? "Manual mode active"
                            : "WhatsApp Business Token"
                        }
                      />
                      <input
                        type="text"
                        value={settings.whatsappPhoneId || ""}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            whatsappPhoneId: e.target.value,
                          })
                        }
                        disabled={settings.whatsappApiMode === "manual"}
                        className="w-full px-6 py-4 neu-pressed rounded-2xl bg-transparent outline-none text-sm font-bold disabled:opacity-50"
                        placeholder={
                          settings.whatsappApiMode === "manual"
                            ? "Manual mode active"
                            : "Phone Number ID"
                        }
                      />
                    </div>
                    {settings.whatsappApiMode === "api" && (
                      <>
                        <button
                          onClick={async () => {
                            const id = toast.loading(
                              "Testing WhatsApp Graph API connection...",
                            );
                            if (
                              !settings.whatsappPhoneId ||
                              !settings.whatsappApiToken
                            ) {
                              toast.error(
                                "Please enter both Phone Number ID and Token",
                                { id },
                              );
                              return;
                            }
                            try {
                              const res = await fetch(
                                `https://graph.facebook.com/v18.0/${settings.whatsappPhoneId}`,
                                {
                                  headers: {
                                    Authorization: `Bearer ${settings.whatsappApiToken}`,
                                  },
                                },
                              );
                              const data = await res.json();
                              if (res.ok && data.id) {
                                toast.success(
                                  `Connected! Phone ID: ${data.id}`,
                                  { id },
                                );
                              } else {
                                toast.error(
                                  `API Error: ${data.error?.message || "Invalid"}`,
                                  { id },
                                );
                              }
                            } catch (e: any) {
                              toast.error(`Network Error`, { id });
                            }
                          }}
                          className="px-6 py-3 neu-flat rounded-xl text-[10px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-2 hover:bg-black/5 mb-4"
                        >
                          <Activity className="w-3 h-3" /> Test Connection
                        </button>
                        <div className="space-y-4 border-t border-black/5 pt-6">
                          <div className="flex justify-between items-center">
                            <label className="text-[10px] font-black uppercase tracking-widest neu-text-muted ml-1">
                              Meta Approved Templates
                            </label>
                            <button
                              onClick={() => {
                                const newTemplate = {
                                  id: `tpl_${Date.now()}`,
                                  name: "new_template",
                                  category: "MARKETING",
                                  language: "en",
                                  components: [],
                                };
                                setSettings({
                                  ...settings,
                                  whatsappTemplates: [
                                    ...(settings.whatsappTemplates || []),
                                    newTemplate,
                                  ],
                                });
                              }}
                              className="text-[10px] uppercase font-black tracking-widest text-accent hover:underline flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" /> Add Template
                            </button>
                          </div>
                          <div className="space-y-3">
                            {(settings.whatsappTemplates || []).map(
                              (tpl, idx) => (
                                <div
                                  key={tpl.id}
                                  className="p-4 neu-pressed rounded-2xl space-y-3"
                                >
                                  <div className="flex justify-between items-center">
                                    <input
                                      type="text"
                                      value={tpl.name || ""}
                                      onChange={(e) => {
                                        const updated = [
                                          ...(settings.whatsappTemplates || []),
                                        ];
                                        updated[idx].name = e.target.value;
                                        setSettings({
                                          ...settings,
                                          whatsappTemplates: updated,
                                        });
                                      }}
                                      className="bg-transparent outline-none text-xs font-bold w-[60%]"
                                      placeholder="template_name"
                                    />
                                    <button
                                      onClick={() => {
                                        const updated = [
                                          ...(settings.whatsappTemplates || []),
                                        ];
                                        updated.splice(idx, 1);
                                        setSettings({
                                          ...settings,
                                          whatsappTemplates: updated,
                                        });
                                      }}
                                      className="text-rose-500 hover:text-rose-600"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                  <div className="flex gap-2">
                                    <select
                                      value={tpl.category || ""}
                                      onChange={(e) => {
                                        const updated = [
                                          ...(settings.whatsappTemplates || []),
                                        ];
                                        updated[idx].category = e.target.value;
                                        setSettings({
                                          ...settings,
                                          whatsappTemplates: updated,
                                        });
                                      }}
                                      className="bg-transparent font-bold !text-[10px] outline-none text-neutral-500"
                                    >
                                      <option value="MARKETING">
                                        MARKETING
                                      </option>
                                      <option value="UTILITY">UTILITY</option>
                                      <option value="AUTHENTICATION">
                                        AUTHENTICATION
                                      </option>
                                    </select>
                                    <select
                                      value={tpl.language || ""}
                                      onChange={(e) => {
                                        const updated = [
                                          ...(settings.whatsappTemplates || []),
                                        ];
                                        updated[idx].language = e.target.value;
                                        setSettings({
                                          ...settings,
                                          whatsappTemplates: updated,
                                        });
                                      }}
                                      className="bg-transparent font-bold !text-[10px] outline-none text-neutral-500"
                                    >
                                      <option value="en">English (en)</option>
                                      <option value="en_US">
                                        English (US)
                                      </option>
                                      <option value="hi">Hindi (hi)</option>
                                    </select>
                                  </div>
                                  <input
                                    type="text"
                                    value={tpl.purpose || ""}
                                    onChange={(e) => {
                                      const updated = [
                                        ...(settings.whatsappTemplates || []),
                                      ];
                                      updated[idx].purpose = e.target.value;
                                      setSettings({
                                        ...settings,
                                        whatsappTemplates: updated,
                                      });
                                    }}
                                    className="w-full bg-transparent outline-none text-[10px] font-bold border-b border-black/10 dark:border-white/10 pb-1 text-neutral-600 focus:border-accent"
                                    placeholder="Purpose (e.g., General Testing, Service Reminder, Birthday...)"
                                  />
                                  <input
                                    type="text"
                                    value={(tpl.variables || []).join(", ")}
                                    onChange={(e) => {
                                      const updated = [
                                        ...(settings.whatsappTemplates || []),
                                      ];
                                      updated[idx].variables = e.target.value
                                        .split(",")
                                        .map((v) => v.trim())
                                        .filter(Boolean);
                                      setSettings({
                                        ...settings,
                                        whatsappTemplates: updated,
                                      });
                                    }}
                                    className="w-full bg-transparent outline-none text-[10px] font-bold border-b border-black/10 dark:border-white/10 pb-1 text-neutral-600 focus:border-accent"
                                    placeholder="Variables (comma separated, e.g., Name, Date)"
                                  />
                                  <div className="flex items-center justify-between">
                                    <label className="text-[10px] uppercase font-bold text-neutral-500">
                                      Default for Testing
                                    </label>
                                    <input
                                      type="radio"
                                      name="defaultTestTemplate"
                                      checked={
                                        settings?.defaultTestTemplateId ===
                                        tpl.id
                                      }
                                      onChange={() =>
                                        setSettings({
                                          ...settings,
                                          defaultTestTemplateId: tpl.id,
                                        })
                                      }
                                      className="w-3 h-3"
                                    />
                                  </div>
                                </div>
                              ),
                            )}
                            {(!settings.whatsappTemplates ||
                              settings.whatsappTemplates.length === 0) && (
                              <div className="text-center p-4 text-[10px] font-bold uppercase text-neutral-400">
                                No templates added
                              </div>
                            )}
                            {settings.whatsappTemplates &&
                              settings.whatsappTemplates.length > 0 && (
                                <button
                                  onClick={() =>
                                    setSettings({
                                      ...settings,
                                      whatsappTemplates: [],
                                    })
                                  }
                                  className="text-[10px] text-rose-500 font-bold uppercase tracking-widest mt-2 block hover:underline"
                                >
                                  Bulk Remove All Templates
                                </button>
                              )}
                          </div>
                        </div>
                        <div className="pt-6 border-t border-black/5 dark:border-white/5 space-y-4">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Send Test Message & Unlock 24h Window</h4>
                          <input
                             type="text"
                             value={testPhoneNumber || ""}
                             onChange={(e) => setTestPhoneNumber(e.target.value)}
                             placeholder="Phone Number (e.g., 919876543210)"
                             className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl p-3 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/50"
                          />
                          <button
                            disabled={isTestSending || !testPhoneNumber.trim()}
                            onClick={async () => {
                              try {
                                if (
                                  !settings.whatsappApiToken ||
                                  !settings.whatsappPhoneId
                                ) {
                                  toast.error(
                                    "Please provide both Token and Phone ID to test.",
                                  );
                                  return;
                                }
                                if (!settings.defaultTestTemplateId) {
                                  toast.error("Please select a Default for Testing template above.");
                                  return;
                                }
                                const template = settings.whatsappTemplates?.find(t => t.id === settings.defaultTestTemplateId);
                                if (!template) {
                                  toast.error("Template not found");
                                  return;
                                }

                                setIsTestSending(true);
                                const res = await whatsappService.sendMessage({
                                  to: testPhoneNumber,
                                  message: "Test fallback message",
                                  customTemplateName: template.name,
                                  templateCategory: 'custom',
                                  templateParams: (template.variables?.length || 0) > 0 ? Array(template.variables?.length).fill("Test") : []
                                });

                                if (res.success) {
                                   toast.success("Test message sent! 24-hour window open.");
                                   setTestPhoneNumber("");
                                } else {
                                   toast.error(`Error: ${res.error}`);
                                }
                              } catch (err: any) {
                                toast.error(
                                  err.message || "Failed to send WhatsApp message.",
                                );
                              } finally {
                                setIsTestSending(false);
                              }
                            }}
                            className="w-full px-6 py-4 disabled:opacity-50 neu-flat rounded-2xl text-xs font-black uppercase tracking-widest text-emerald-500 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10"
                          >
                            <Activity className="w-4 h-4" /> {isTestSending ? 'Sending...' : 'Send Target Template'}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {activeTab === "automation" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <Card className="border-none rounded-3xl neu-flat">
              <CardHeader className="border-b border-black/[0.03] bg-black/[0.02]">
                <CardTitle className="text-[11px] font-black uppercase tracking-widest flex items-center gap-3 text-accent">
                  <Cpu className="w-5 h-5" /> Neural Automation Engine Monitor
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-6 neu-pressed rounded-2xl">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest neutral-text-muted">
                          Engine Heartbeat
                        </span>
                        <div className="text-xl font-black mt-1 text-emerald-600 tracking-tight flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>{" "}
                          Active
                        </div>
                      </div>
                      <Zap className="w-8 h-8 text-emerald-500/20" />
                    </div>

                    {renderToggle(
                      "leadCapturing" as any,
                      "Quantum Lead Routing",
                      "Intercept metrics, clean data, and route to the respective engine.",
                      Target,
                      "automation",
                    )}
                    {renderToggle(
                      "autoReplies" as any,
                      "Predictive Auto-Replies",
                      "Generate context-aware responses instantly.",
                      Zap,
                      "automation",
                    )}
                  </div>

                  <div className="space-y-6">
                    {renderToggle(
                      "smartNotifications" as any,
                      "Smart Pings",
                      "Only notify on high-value human interventions.",
                      Bell,
                      "automation",
                    )}
                    {renderToggle(
                      "bulkMessaging" as any,
                      "Hyper-Scale Triggers",
                      "Unbound scale for massive campaigns.",
                      Send,
                      "automation",
                    )}

                    <div className="p-6 neu-flat rounded-2xl">
                      <span className="text-[10px] font-black uppercase tracking-widest neu-text-muted mb-4 block">
                        Recent Process Cycles
                      </span>
                      <div className="space-y-4">
                        <div className="flex justify-between text-[10px] uppercase font-bold neu-text-muted">
                          <span>Campaign Processing</span>
                          <span className="text-emerald-600 font-black">
                            12s ago
                          </span>
                        </div>
                        <div className="flex justify-between text-[10px] uppercase font-bold neu-text-muted">
                          <span>Nurture Rule Engine</span>
                          <span className="text-neutral-400 font-black">
                            45m ago
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {activeTab === "conversions" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <Card className="border-none rounded-3xl neu-flat">
              <CardHeader className="border-b border-black/[0.03] bg-black/[0.02]">
                <CardTitle className="text-[11px] font-black uppercase tracking-widest flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-accent" /> Revenue &
                  Conversion Engine
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest neu-text-muted ml-1">
                      Base Currency
                    </label>
                    <select
                      value={settings.defaultCurrency || "INR"}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          defaultCurrency: e.target.value,
                        })
                      }
                      className="w-full px-6 py-4 neu-pressed rounded-2xl bg-transparent outline-none text-sm font-bold cursor-pointer"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="INR">INR (₹)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-black/5">
                  {renderToggle(
                    "churnPrediction",
                    "Churn Predictor AI",
                    "Analyze conversation delays and missing follow-ups to predict if a high-value lead is dropping off.",
                    Activity,
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {activeTab === "broadcast" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <Card className="border-none rounded-3xl neu-flat">
              <CardHeader className="border-b border-black/[0.03] bg-black/[0.02]">
                <CardTitle className="text-[11px] font-black uppercase tracking-widest flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-accent" /> Omniverse
                  Broadcaster
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {renderToggle(
                    "smartThrottling",
                    "Adaptive Rate Throttling",
                    "Automatically slow down message bursts to prevent WhatsApp/Instagram shadow-bans.",
                    Clock,
                  )}
                  {renderToggle(
                    "omniChannelMode",
                    "Omni-Channel Synchronization",
                    "If a lead drops off WhatsApp, automatically continue the broadcast on their linked Instagram.",
                    Network,
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {activeTab === "security" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <Card className="border-none rounded-3xl neu-flat relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none"></div>
              <CardHeader className="border-b border-black/[0.03] bg-black/[0.02]">
                <CardTitle className="text-[11px] font-black uppercase tracking-widest flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />{" "}
                  Compliance & Guardrails
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {renderToggle(
                    "autoSaveEnabled",
                    "Auto-Save Omniverse State",
                    "Continuously persist all framework settings to database instantly without requiring manual saves.",
                    Database,
                  )}
                  {renderToggle(
                    "allowUnlimitedResources",
                    "Unlimited Resource Engine",
                    "Bypass free-tier limitations. Disables hard quotas and allows operations despite rate limits.",
                    Zap,
                  )}
                  {renderToggle(
                    "biometricExport",
                    "Export Authorization Protocol",
                    "Require highly secure clearance before exporting mass lead data (Simulated).",
                    Fingerprint,
                  )}
                  {renderToggle(
                    "e2eEncryption",
                    "Vault E2E Encryption",
                    "Force militarized symmetric encryption on all local interaction data payload (Simulated).",
                    Lock,
                  )}
                  {renderToggle(
                    "enableBillingAndSupport",
                    "Enable Billing & Support Module",
                    "Activate invoices, quotations, payments, and ticket modules. Keep disabled to maintain core focus.",
                    Lock,
                  )}
                  {renderToggle(
                    "enableAiFeatures",
                    "Enable Global AI Capabilities",
                    "Allow AI capabilities like copilot, sentiment analysis, and suggestions across the entire platform. Bills may apply.",
                    Sparkles,
                  )}
                  {renderToggle(
                    "aiChatbotEnabled",
                    "Gemini AI Assistant",
                    "Enable automatic AI-generated responses for customer messages when no specific command matches.",
                    Bot,
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-none rounded-3xl neu-flat overflow-hidden">
              <CardHeader className="border-b border-black/[0.03] bg-red-500/5">
                <CardTitle className="text-[11px] font-black uppercase tracking-widest flex items-center gap-2 text-rose-600">
                  <AlertCircle className="w-4 h-4" /> Data Sovereignty & Purge
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-8 text-center max-w-lg mx-auto">
                <div className="p-8 neu-pressed bg-rose-500/5 rounded-3xl space-y-4">
                  <AlertCircle className="w-12 h-12 text-rose-600 mx-auto" />
                  <h3 className="text-sm font-black uppercase tracking-widest text-rose-600">
                    Danger Zone
                  </h3>
                  <p className="text-[10px] font-bold neu-text-muted leading-relaxed uppercase">
                    Resetting the database will permanently delete all leads,
                    interactions, conversions, and campaigns. This action cannot
                    be undone.
                  </p>
                  <button
                    onClick={() => setShowResetConfirm(true)}
                    className="w-full py-4 bg-rose-600 text-white hover:bg-rose-700 transition-colors rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-rose-500/20"
                  >
                    Purge Local Persistence
                  </button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      <ConfirmModal
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={performReset}
        title="Immediate Data Purge?"
        message="All business data will be lost forever. Do you wish to proceed with the master reset?"
        isLoading={isResetting}
      />
    </div>
  );
}

// Ensure Network is imported properly above by redefining imports or creating a tiny component
function Network(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
    >
      <rect x="16" y="16" width="6" height="6" rx="1"></rect>
      <rect x="2" y="16" width="6" height="6" rx="1"></rect>
      <rect x="9" y="2" width="6" height="6" rx="1"></rect>
      <path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"></path>
      <path d="M12 12V8"></path>
    </svg>
  );
}
