import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { saveSettings } from "../lib/db";
import { useData } from "../contexts/DataContext";
import { cn } from "../lib/utils";
import { ChevronDown, Palette, Layout, Type, AppWindow, Layers, Bell, Maximize, Search, Activity, Users, Settings2, Moon, Sun, Monitor } from "lucide-react";

const ACCENT_COLORS = [
  { id: 'blue', color: '#3b82f6', hex: '#3b82f6', name: 'Blue' },
  { id: 'green', color: '#10b981', hex: '#10b981', name: 'Green' },
  { id: 'yellow', color: '#eab308', hex: '#eab308', name: 'Yellow' },
  { id: 'orange', color: '#f97316', hex: '#f97316', name: 'Orange' },
  { id: 'red', color: '#ef4444', hex: '#ef4444', name: 'Red' },
  { id: 'purple', color: '#a855f7', hex: '#a855f7', name: 'Purple' },
  { id: 'indigo', color: '#6366f1', hex: '#6366f1', name: 'Indigo' },
  { id: 'cyan', color: '#06b6d4', hex: '#06b6d4', name: 'Cyan' },
  { id: 'coral', color: '#ff7f50', hex: '#ff7f50', name: 'Coral' },
];

const MODES = [
  { id: 'Auto', icon: Monitor },
  { id: 'Light', icon: Sun },
  { id: 'Dark', icon: Moon }
];
const DENSITIES = ['Relaxed', 'Standard', 'Tight'];
const RADII = [4, 8, 12, 16];
const FONTS = ['SF Pro', 'Inter', 'Roboto', 'Space Grotesk', 'Plus Jakarta Sans'];

export function ThemeSettingsView() {
  const { settings } = useData();

  const [mode, setMode] = useState(settings?.themeMode || 'Dark');
  const [accent, setAccent] = useState(settings?.themeAccentColor || 'coral');
  const [density, setDensity] = useState(settings?.themeDensity || 'Standard');
  const [uiStyle, setUiStyle] = useState(settings?.appUiStyle || 'glassmorphism');
  const [font, setFont] = useState(settings?.themeFont || 'Inter');
  const [radius, setRadius] = useState(settings?.themeCornerRadius || 12);
  const [smoothAnimations, setSmoothAnimations] = useState(settings?.themeSmoothAnimations !== false);
  const [boldFocusRings, setBoldFocusRings] = useState(settings?.themeBoldFocusRings || false);
  const [showGridLines, setShowGridLines] = useState(settings?.themeShowGridLines !== false);
  const [compactSidebar, setCompactSidebar] = useState(settings?.themeCompactSidebar || false);

  const activeColor = ACCENT_COLORS.find(c => c.id === accent)?.hex || '#ff7f50';

  useEffect(() => {
    if (!settings) return;
    const timeout = setTimeout(() => {
      saveSettings({
        ...settings,
        themeMode: mode as any,
        themeAccentColor: accent,
        appUiStyle: uiStyle,
        themeDensity: density as any,
        themeFont: font,
        themeCornerRadius: radius,
        themeSmoothAnimations: smoothAnimations,
        themeBoldFocusRings: boldFocusRings,
        themeShowGridLines: showGridLines,
        themeCompactSidebar: compactSidebar,
      }).catch(console.error);

      // Apply to css variables dynamically
      document.documentElement.style.setProperty('--accent', activeColor);
      document.documentElement.style.setProperty('--radius', `${radius}px`);
      
      const themeClass = mode === 'Auto' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : mode.toLowerCase();
      document.documentElement.setAttribute('data-theme', themeClass);
      
      // Update font globally
      if (font === 'Space Grotesk') {
        document.documentElement.style.setProperty('--font-sans', '"Space Grotesk", sans-serif');
      } else if (font === 'Plus Jakarta Sans') {
        document.documentElement.style.setProperty('--font-sans', '"Plus Jakarta Sans", sans-serif');
      } else {
        document.documentElement.style.setProperty('--font-sans', `"${font}", sans-serif`);
      }
      
    }, 300);
    return () => clearTimeout(timeout);
  }, [mode, accent, uiStyle, density, font, radius, smoothAnimations, boldFocusRings, showGridLines, compactSidebar, settings]);

  const CustomSwitch = ({ checked, onChange, label, description, icon: Icon }: any) => (
    <div 
      className={cn(
        "flex flex-col gap-2 p-4 rounded-2xl border transition-all cursor-pointer group",
        checked 
          ? "bg-[var(--accent)]/10 border-[var(--accent)]/30" 
          : "bg-surface border-border hover:border-border-hover hover:bg-black/5 dark:hover:bg-white/5"
      )}
      onClick={() => onChange(!checked)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2 rounded-xl transition-colors",
            checked ? "bg-[var(--accent)]/20 text-[var(--accent)]" : "bg-black/5 dark:bg-white/5 text-neutral-500"
          )}>
            <Icon className="w-4 h-4" />
          </div>
          <div className="text-sm font-bold text-text-primary">{label}</div>
        </div>
        <button 
          type="button" 
          className={cn(
            "w-10 h-5 rounded-full transition-colors relative shadow-inner",
            checked ? "bg-[var(--accent)]" : "bg-black/20 dark:bg-white/20"
          )}
        >
          <motion.div 
             animate={{ x: checked ? 20 : 2 }}
             transition={{ type: "spring", stiffness: 500, damping: 30 }}
             className={cn("w-4 h-4 rounded-full absolute top-0.5 left-0 shadow-md bg-white dark:bg-white", !checked && "dark:bg-neutral-400")}
          />
        </button>
      </div>
      <div className="text-xs text-text-muted mt-1 pl-11">{description}</div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto h-full flex flex-col pt-4 pb-24">
      {/* Header */}
      <div className="flex flex-col gap-2 mb-8 px-4">
        <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-text-primary drop-shadow-sm flex items-center gap-3">
          <Palette className="w-8 h-8 text-[var(--accent)]" />
          Appearance
        </h1>
        <p className="text-text-muted text-sm max-w-xl leading-relaxed">
          Craft your ideal workspace. These settings define the visual language and emotional feel of your entire operating system.
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 flex-1 min-h-[600px] px-4">
        
        {/* Settings Panel */}
        <div className="lg:col-span-5 flex flex-col gap-6 overflow-y-auto custom-scrollbar pb-10 pr-2">
          
          {/* Theme Mode */}
          <section className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-text-muted flex items-center gap-2">
              <Sun className="w-3 h-3" /> Color Mode
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {MODES.map(m => {
                const isSelected = mode === m.id;
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    onClick={() => setMode(m.id as any)}
                    className={cn(
                      "flex flex-col items-center justify-center gap-2 py-4 rounded-2xl border transition-all relative overflow-hidden",
                      isSelected 
                        ? "bg-[var(--accent)]/10 border-[var(--accent)]/30 text-[var(--accent)]" 
                        : "bg-surface border-border text-text-muted hover:bg-black/5 dark:hover:bg-white/5 hover:text-text-primary"
                    )}
                  >
                    <Icon className="w-5 h-5 z-10" />
                    <span className="text-xs font-bold z-10">{m.id}</span>
                    {isSelected && (
                      <motion.div 
                        layoutId="mode-bg"
                        className="absolute inset-0 bg-gradient-to-t from-[var(--accent)]/20 to-transparent opacity-50"
                      />
                    )}
                  </button>
                )
              })}
            </div>
          </section>

          {/* Core Accent */}
          <section className="space-y-4 pt-4 border-t border-border">
            <h3 className="text-xs font-black uppercase tracking-widest text-text-muted flex items-center gap-2">
              <Palette className="w-3 h-3" /> Base Paint
            </h3>
            <div className="grid grid-cols-5 sm:grid-cols-9 lg:grid-cols-5 gap-3">
              {ACCENT_COLORS.map(c => {
                const isSelected = accent === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setAccent(c.id)}
                    className="relative group flex items-center justify-center aspect-square"
                  >
                    <div 
                      className={cn(
                        "w-full h-full rounded-2xl transition-all duration-300 relative shadow-sm",
                        isSelected ? "scale-90" : "hover:scale-105 hover:shadow-md cursor-pointer"
                      )}
                      style={{ 
                        background: `linear-gradient(135deg, ${c.hex}, ${c.hex}dd)`,
                      }}
                    >
                      {isSelected && (
                        <motion.div 
                          layoutId="color-selection-ring"
                          className="absolute -inset-2 rounded-[1.3rem] border-2 border-[var(--accent)]"
                          transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Typography & Shaping */}
          <section className="space-y-4 pt-4 border-t border-border">
            <h3 className="text-xs font-black uppercase tracking-widest text-text-muted flex items-center gap-2">
              <Type className="w-3 h-3" /> Typography & Form
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-text-muted uppercase">Font Family</label>
                <div className="relative group">
                  <select 
                    value={font}
                    onChange={e => setFont(e.target.value)}
                    className="w-full appearance-none bg-surface border border-border rounded-xl py-3 px-4 text-sm font-bold text-text-primary outline-none focus:border-[var(--accent)] transition-colors cursor-pointer"
                  >
                    {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-text-muted uppercase">UI Paradigm</label>
                <div className="relative group">
                  <select 
                    value={uiStyle}
                    onChange={e => setUiStyle(e.target.value as any)}
                    className="w-full appearance-none bg-surface border border-border rounded-xl py-3 px-4 text-sm font-bold text-text-primary outline-none focus:border-[var(--accent)] transition-colors cursor-pointer"
                  >
                    <option value="glassmorphism">Glassmorphism</option>
                    <option value="neumorphism">Neumorphism</option>
                    <option value="flat">Modern Flat</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-text-muted uppercase">Rounding: {radius}px</label>
              </div>
              <div className="flex bg-black/5 dark:bg-white/5 p-1 rounded-xl">
                {RADII.map(r => (
                  <button
                    key={r}
                    onClick={() => setRadius(r)}
                    className={cn(
                      "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all",
                      radius === r ? "bg-white dark:bg-black shadow-sm text-text-primary" : "text-text-muted hover:text-text-primary"
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Behaviors */}
          <section className="space-y-4 pt-4 border-t border-border">
            <h3 className="text-xs font-black uppercase tracking-widest text-text-muted flex items-center gap-2">
              <Settings2 className="w-3 h-3" /> Interface Behavior
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
               <CustomSwitch icon={Activity} checked={smoothAnimations} onChange={setSmoothAnimations} label="Fluid Motion" description="Spring-based layer transitions." />
               <CustomSwitch icon={Maximize} checked={boldFocusRings} onChange={setBoldFocusRings} label="Bold Focus" description="High contrast selection rings." />
               <CustomSwitch icon={Layout} checked={showGridLines} onChange={setShowGridLines} label="Grid Lines" description="Subtle wireframe overlays." />
               <CustomSwitch icon={Layers} checked={compactSidebar} onChange={setCompactSidebar} label="Compact Mode" description="Minimize interface padding." />
            </div>
          </section>

        </div>

        {/* Live Preview Panel */}
        <div className="lg:col-span-7 bg-surface border border-border shadow-2xl rounded-[2rem] overflow-hidden flex flex-col sticky top-4" style={{ height: 'max-content' }}>
          
          {/* Fake Window Header */}
          <div className="h-12 border-b border-border bg-black/5 dark:bg-white/5 flex items-center px-4 gap-4">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <div className="w-3 h-3 rounded-full bg-amber-400"></div>
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
            </div>
            <div className="flex-1 flex justify-center">
              <div className="px-4 py-1.5 bg-background rounded-lg text-[10px] font-bold text-text-muted flex items-center gap-2 border border-border shadow-sm">
                <Search className="w-3 h-3" /> search.preview.app...
              </div>
            </div>
            <div className="w-16"></div> {/* Spacer for symmetry */}
          </div>

          {/* Fake App Content */}
          <div className="p-6 md:p-8 flex-1 bg-background flex flex-col gap-6 relative overflow-hidden" 
               style={{ 
                 fontFamily: font === 'Space Grotesk' ? '"Space Grotesk", sans-serif' : font === 'Plus Jakarta Sans' ? '"Plus Jakarta Sans", sans-serif' : `"${font}", sans-serif`
               }}>
            
            {showGridLines && (
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
            )}

            {/* Fake Nav */}
            <div className="flex justify-between items-center relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: activeColor, borderRadius: `${radius}px` }}>
                  <AppWindow className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-black text-lg text-text-primary leading-tight">Live Preview</h2>
                  <p className="text-xs font-medium text-text-muted">Real-time styling engine</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-text-muted hover:text-text-primary bg-surface transition-colors">
                  <Bell className="w-4 h-4" />
                </button>
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[var(--accent)] to-blue-500 shell-glow" />
              </div>
            </div>

            {/* Fake Stats */}
            <div className="grid grid-cols-3 gap-4 relative z-10">
              {[
                { label: 'Revenue', value: '₹84,230', change: '+12%' },
                { label: 'Active Users', value: '1,429', change: '+5%' },
                { label: 'Conversion', value: '4.2%', change: '-1%' },
              ].map((stat, i) => (
                <motion.div 
                  initial={smoothAnimations ? { opacity: 0, y: 10 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  key={stat.label} 
                  className={cn(
                    "p-4 border border-border flex flex-col gap-2 shadow-sm transition-all hover:shadow-md",
                    uiStyle === 'glassmorphism' ? "bg-surface backdrop-blur-md" : "bg-surface"
                  )}
                  style={{ borderRadius: `${radius}px` }}
                >
                  <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">{stat.label}</span>
                  <div className="flex items-end justify-between">
                    <span className="text-xl font-black text-text-primary">{stat.value}</span>
                    <span className={cn(
                      "text-xs font-bold px-1.5 py-0.5 rounded-md",
                      stat.change.startsWith('+') ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                    )}>{stat.change}</span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Fake Main Content Area */}
            <div className="flex-1 flex gap-4 relative z-10 min-h-[200px]">
              <div 
                className={cn(
                  "flex-1 p-5 border border-border flex flex-col gap-4",
                  uiStyle === 'glassmorphism' ? "bg-surface/50 backdrop-blur-xl" : "bg-surface"
                )}
                style={{ borderRadius: `${radius}px` }}
              >
                <div className="flex justify-between items-center mb-2">
                   <h3 className="font-bold text-sm text-text-primary">Recent Activity</h3>
                   <button className="text-[10px] font-bold text-[var(--accent)] tracking-wide uppercase">View All</button>
                </div>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center">
                      <Activity className="w-3 h-3 text-text-muted" />
                    </div>
                    <div className="flex-1">
                      <div className="h-3 w-3/4 bg-black/10 dark:bg-white/10 rounded-sm mb-1 line-skeleton" />
                      <div className="h-2 w-1/2 bg-black/5 dark:bg-white/5 rounded-sm line-skeleton" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="w-1/3 flex flex-col gap-4">
                 <div 
                   className="w-full flex-1 border border-[var(--accent)] flex items-center justify-center shadow-lg relative overflow-hidden group p-4"
                   style={{ 
                     borderRadius: `${radius}px`,
                     backgroundColor: `var(--accent)`,
                   }}
                 >
                   <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                   <div className="relative z-10 text-center space-y-1">
                     <Users className="w-6 h-6 text-white mx-auto mb-2 opacity-90" />
                     <div className="text-sm font-black text-white">Upgrade Plan</div>
                     <div className="text-[10px] text-white/80 font-medium">Unlock full potential</div>
                   </div>
                 </div>
              </div>
            </div>

            {/* Floating Action Hint */}
            <AnimatePresence>
              {smoothAnimations && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute bottom-6 left-1/2 -translate-x-1/2 py-2 px-4 bg-black dark:bg-white text-white dark:text-black rounded-full shadow-2xl flex items-center gap-2 z-20"
                >
                  <div className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
                  <span className="text-[11px] font-bold tracking-wide">Live Theme Sync</span>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>
        
      </div>
    </div>
  );
}

