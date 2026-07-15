/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { Sidebar } from "./components/Sidebar";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";

const DashboardView = lazy(() => import("./views/DashboardView").then(m => ({ default: m.DashboardView })));
const LeadsView = lazy(() => import("./views/LeadsView").then(m => ({ default: m.LeadsView })));
const InteractionHubView = lazy(() => import("./views/InteractionHubView").then(m => ({ default: m.InteractionHubView })));
const AutomationsView = lazy(() => import("./views/AutomationsView").then(m => ({ default: m.AutomationsView })));
const SettingsView = lazy(() => import("./views/SettingsView").then(m => ({ default: m.SettingsView })));
const DataUploadView = lazy(() => import("./views/DataUploadView").then(m => ({ default: m.DataUploadView })));
const RetentionView = lazy(() => import("./views/RetentionView").then(m => ({ default: m.RetentionView })));
const ThemeSettingsView = lazy(() => import("./views/ThemeSettingsView").then(m => ({ default: m.ThemeSettingsView })));
const CampaignsView = lazy(() => import("./views/CampaignsView").then(m => ({ default: m.CampaignsView })));
const SocialAccountsView = lazy(() => import("./views/SocialAccountsView").then(m => ({ default: m.SocialAccountsView })));
const EngineView = lazy(() => import("./views/EngineView").then(m => ({ default: m.EngineView })));
const InventoryView = lazy(() => import("./views/InventoryView").then(m => ({ default: m.InventoryView })));
const HomeView = lazy(() => import("./views/HomeView").then(m => ({ default: m.HomeView })));
const InvoicesView = lazy(() => import("./views/InvoicesView").then(m => ({ default: m.InvoicesView })));
const QuotationsView = lazy(() => import("./views/QuotationsView").then(m => ({ default: m.QuotationsView })));
const PaymentsView = lazy(() => import("./views/PaymentsView").then(m => ({ default: m.PaymentsView })));
const TicketsView = lazy(() => import("./views/TicketsView").then(m => ({ default: m.TicketsView })));
const PosView = lazy(() => import("./views/PosView").then(m => ({ default: m.PosView })));
const ExpensesView = lazy(() => import("./views/ExpensesView").then(m => ({ default: m.ExpensesView })));
const TemplatesView = lazy(() => import("./views/TemplatesView").then(m => ({ default: m.TemplatesView })));
const ErpView = lazy(() => import("./views/ErpView").then(m => ({ default: m.ErpView })));
const WorkflowsView = lazy(() => import("./views/WorkflowsView").then(m => ({ default: m.WorkflowsView })));
const EmployeesView = lazy(() => import("./views/EmployeesView").then(m => ({ default: m.EmployeesView })));
const RewardsView = lazy(() => import("./views/RewardsView").then(m => ({ default: m.RewardsView })));
const EmployeePortalView = lazy(() => import("./views/EmployeePortalView").then(m => ({ default: m.EmployeePortalView })));
const StaffMessagesView = lazy(() => import("./views/StaffMessagesView").then(m => ({ default: m.StaffMessagesView })));
const WarehousesView = lazy(() => import("./views/WarehousesView").then(m => ({ default: m.WarehousesView })));
const SystemTelemetryView = lazy(() => import("./views/SystemTelemetryView").then(m => ({ default: m.SystemTelemetryView })));
const GmailView = lazy(() => import("./views/GmailView").then(m => ({ default: m.GmailView })));
const GoogleSheetsView = lazy(() => import("./views/GoogleSheetsView").then(m => ({ default: m.GoogleSheetsView })));
const ContactsView = lazy(() => import("./views/ContactsView").then(m => ({ default: m.ContactsView })));

import { AnimatePresence, motion } from "motion/react";
import { Menu, X, AlertTriangle } from "lucide-react";
import { auth, loginWithGoogle, logout } from './firebase';
import { onAuthStateChanged, User, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { useTranslation } from 'react-i18next';
import { cleanupOldData, saveSettings } from "./lib/db";
import { runAutomationHeartbeat } from "./lib/automation";
import { useData } from "./contexts/DataContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ConnectivityStatus } from "./components/ConnectivityStatus";
import { DraggableOrb } from "./components/DraggableOrb";
import { Toaster } from "react-hot-toast";
import { PublicProductView } from "./views/PublicProductView";
import { PublicFormView } from "./views/PublicFormView";

import { QuickStartTour } from "./components/QuickStartTour";

// Core App Layout
export default function App() {
  const isPublicProductRoute = window.location.pathname.startsWith('/product/');
  const isPublicFormRoute = window.location.pathname.startsWith('/form/');

  const location = useLocation();
  const navigate = useNavigate();
  const activeLayer = location.pathname === '/' ? 'home' : location.pathname.substring(1);
  const setActiveLayer = (layer: string) => {
    navigate(layer === 'home' ? '/' : `/${layer}`);
  };
  const { leads, settings, isLoading } = useData();
  const [theme, _setTheme] = useState(() => localStorage.getItem("app_theme") || "midnight");
  const [uiStyle, _setUiStyle] = useState(() => localStorage.getItem("app_uiStyle") || "glassmorphism");
  const [simulatedEmployee, setSimulatedEmployee] = useState<any>(null);
  
  const setTheme = (newTheme: string) => {
    _setTheme(newTheme);
    if (settings) {
       saveSettings({ ...settings, appTheme: newTheme }).catch(console.error);
    }
  };

  const setUiStyle = (newStyle: string) => {
    _setUiStyle(newStyle);
    if (settings) {
       saveSettings({ ...settings, appUiStyle: newStyle }).catch(console.error);
    }
  };

  useEffect(() => {
    if (settings) {
      if (settings.appTheme && settings.appTheme !== theme) {
        _setTheme(settings.appTheme);
      }
      if (settings.appUiStyle && settings.appUiStyle !== uiStyle) {
        _setUiStyle(settings.appUiStyle);
      }
      
      const ACCENT_COLORS = [
        { id: 'blue', hex: '#3b82f6' },
        { id: 'green', hex: '#10b981' },
        { id: 'yellow', hex: '#eab308' },
        { id: 'orange', hex: '#f97316' },
        { id: 'red', hex: '#ef4444' },
        { id: 'purple', hex: '#a855f7' },
        { id: 'indigo', hex: '#6366f1' },
        { id: 'cyan', hex: '#06b6d4' },
        { id: 'coral', hex: '#ff7f50' },
      ];
      
      if (settings.themeAccentColor) {
         const color = ACCENT_COLORS.find(c => c.id === settings.themeAccentColor)?.hex || '#3b82f6';
         document.documentElement.style.setProperty('--accent', color);
      }
      if (settings.themeCornerRadius) {
         document.documentElement.style.setProperty('--radius', `${settings.themeCornerRadius}px`);
      }
      if (settings.themeFont) {
         document.documentElement.style.setProperty('--font-custom', `"${settings.themeFont}", ui-sans-serif, system-ui, sans-serif`);
      }
      if (settings.themeMode) {
         const mode = settings.themeMode;
         const themeClass = mode === 'Auto' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : mode.toLowerCase();
         document.documentElement.setAttribute('data-theme', themeClass);
         
         const isDark = ['dark', 'midnight', 'obsidian', 'sapphire', 'ruby', 'emerald'].includes(themeClass);
         if (isDark) {
            document.documentElement.classList.add('dark');
         } else {
            document.documentElement.classList.remove('dark');
         }
      }
    }
  }, [settings]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  
  useEffect(() => {
    localStorage.setItem("app_theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
    const isDark = ['dark', 'midnight', 'obsidian', 'sapphire', 'ruby', 'emerald'].includes(theme);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("app_uiStyle", uiStyle);
    document.documentElement.setAttribute("data-ui", uiStyle);
  }, [uiStyle]);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isRegistering && password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      let message = err.message;
      if (err.code === 'auth/email-already-in-use') message = "This email is already registered.";
      if (err.code === 'auth/weak-password') message = "Password should be at least 6 characters.";
      if (err.code === 'auth/invalid-credential') message = "Invalid email or password.";
      setError(message);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      cleanupOldData();

      const hashParam = window.location.hash.split('?')[1];
      if (hashParam) {
        const staffStaffId = new URLSearchParams(hashParam).get('staff');
        if (staffStaffId) {
           setActiveLayer('portal');
        }
      }
    }
  }, [user]);

  useEffect(() => {
    if (user && settings) {
      const interval = setInterval(() => {
        runAutomationHeartbeat(leads, settings);
      }, 60000); // Check every minute
      
      runAutomationHeartbeat(leads, settings); // Initial run
      return () => clearInterval(interval);
    }
  }, [user, settings, leads]);

  const [quotaExceededFlag, setQuotaExceededFlag] = useState(false);
  useEffect(() => {
    const checkQuota = async () => {
      const { isQuotaExceeded } = await import('./lib/db');
      setQuotaExceededFlag(isQuotaExceeded());
    };
    checkQuota();
    const interval = setInterval(checkQuota, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsExpanded(true);
      } else if (window.innerWidth < 1024) {
        setIsExpanded(false);
      } else {
        setIsExpanded(true);
      }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const renderView = () => {
    return (
      <Suspense fallback={
        <div className="flex h-full items-center justify-center p-8">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 rounded-full border-4 border-indigo-500 border-b-transparent animate-spin"
          />
        </div>
      }>
        <Routes>
          <Route path="/" element={<HomeView key="home" setActiveLayer={setActiveLayer} />} />
          <Route path="/dashboard" element={<DashboardView key="dashboard" />} />
          <Route path="/leads" element={<LeadsView key="leads" />} />
          <Route path="/campaigns" element={<CampaignsView key="campaigns" />} />
          <Route path="/templates" element={<TemplatesView key="templates" />} />
          <Route path="/data_import" element={<DataUploadView key="data_import" />} />
          <Route path="/inventory" element={<InventoryView key="inventory" />} />
          <Route path="/social" element={<SocialAccountsView key="social" />} />
          <Route path="/interactions" element={<InteractionHubView key="interactions" />} />
          <Route path="/automation" element={<AutomationsView key="automation" />} />
          <Route path="/engine" element={<EngineView key="engine" />} />
          <Route path="/retention" element={<RetentionView key="retention" />} />
          <Route path="/invoices" element={<InvoicesView key="invoices" />} />
          <Route path="/quotations" element={<QuotationsView key="quotations" />} />
          <Route path="/payments" element={<PaymentsView key="payments" />} />
          <Route path="/tickets" element={<TicketsView key="tickets" />} />
          <Route path="/settings" element={<SettingsView key="settings" />} />
          <Route path="/themes" element={<ThemeSettingsView key="themes" />} />
          <Route path="/pos" element={<PosView key="pos" />} />
          <Route path="/erp" element={<ErpView key="erp" />} />
          <Route path="/workflows" element={<WorkflowsView key="workflows" />} />
          <Route path="/team" element={<EmployeesView key="team" onSimulate={(emp: any) => { setSimulatedEmployee(emp); setActiveLayer("portal"); }} />} />
          <Route path="/portal" element={<EmployeePortalView key="portal" simulatedEmployee={simulatedEmployee} />} />
          <Route path="/staff_messages" element={<StaffMessagesView key="staff_messages" />} />
          <Route path="/incentives" element={<RewardsView key="incentives" />} />
          <Route path="/warehouses" element={<WarehousesView key="warehouses" />} />
          <Route path="/telemetry" element={<SystemTelemetryView key="telemetry" />} />
          <Route path="/expenses" element={<ExpensesView key="expenses" />} />
          <Route path="/gmail" element={<GmailView key="gmail" />} />
          <Route path="/sheets" element={<GoogleSheetsView key="sheets" />} />
          <Route path="/contacts" element={<ContactsView key="contacts" />} />
          <Route path="*" element={
            <motion.div 
              key="construction"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center h-[70vh] w-full"
            >
              <div className="p-8 neu-pressed rounded-3xl max-w-md w-full text-center space-y-6 flex flex-col items-center">
                <div className="w-20 h-20 rounded-2xl neu-flat flex items-center justify-center text-accent">
                  <Menu className="w-10 h-10" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold tracking-tight mb-2">View Under Construction</h2>
                  <p className="text-sm neu-text-muted">This module is currently being integrated into the automation engine.</p>
                </div>
              </div>
            </motion.div>
          } />
        </Routes>
      </Suspense>
    );
  };

  if (isPublicProductRoute) {
    return <PublicProductView />;
  }

  if (isPublicFormRoute) {
    return <PublicFormView />;
  }

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center neu-bg neu-text space-y-6">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-[inset_4px_4px_8px_rgba(0,0,0,0.1),inset_-4px_-4px_8px_rgba(255,255,255,0.7)]"
        >
          <div className="w-8 h-8 rounded-full border-4 border-accent border-t-transparent animate-spin"></div>
        </motion.div>
        <p className="text-sm font-bold tracking-widest text-accent/80 uppercase">Loading System...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div id="auth-container" className="min-h-screen flex flex-col items-center justify-center neu-bg neu-text p-4 relative overflow-hidden z-10 hover-sparkle-bg">
        <div className="absolute inset-0 pointer-events-none z-[-1] overflow-hidden">
           <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className={`absolute -top-24 -left-24 w-96 h-96 rounded-full blur-3xl ${uiStyle === 'glassmorphism' ? 'bg-[var(--accent)]/40' : 'bg-accent/80/20'}`}
          />
          <motion.div 
            animate={{ 
              scale: [1, 1.3, 1],
              rotate: [0, -90, 0]
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className={`absolute bottom-0 right-0 w-96 h-96 rounded-full blur-3xl ${uiStyle === 'glassmorphism' ? 'bg-indigo-500/40' : 'bg-indigo-500/20'}`}
          />
        </div>

        <motion.div 
          id="auth-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-8 neu-pressed rounded-3xl max-w-md w-full text-center space-y-6 relative z-20 elite-sparkle-card"
        >
          <div className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center text-white font-bold text-4xl static-glow transition-all duration-300" style={{ background: 'var(--accent)' }}>
            TO
          </div>
          <div>
            <h1 className="text-3xl font-black bg-gradient-to-br from-blue-600 to-indigo-600 bg-clip-text text-transparent">Retail OS</h1>
            <p className="neu-text-muted mt-2 font-bold uppercase tracking-widest text-xs">Customer & Sales Manager</p>
          </div>
          
          <form onSubmit={handleAuth} className="space-y-4">
            {error && (
              <div className="space-y-2">
                <p className="text-rose-500 text-sm">{error}</p>
              </div>
            )}
            <input 
              type="email" 
              placeholder="Business Email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-4 neu-pressed rounded-xl border-none outline-none"
              required
            />
            <input 
              type="password" 
              placeholder="Password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 neu-pressed rounded-xl border-none outline-none"
              required
            />
            {isRegistering && (
              <input 
                type="password" 
                placeholder="Confirm Password" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-4 neu-pressed rounded-xl border-none outline-none"
                required
              />
            )}
            <button 
              type="submit"
              className="w-full py-4 bg-accent text-white rounded-xl font-bold shadow-lg shadow-accent/30 hover:bg-blue-700 transition-colors"
            >
              {isRegistering ? 'Start Free Trial' : 'Sign In'}
            </button>
            <button 
              type="button"
              onClick={() => setIsRegistering(!isRegistering)}
              className="w-full text-sm neu-text-muted hover:text-accent"
            >
              {isRegistering ? 'Already have an account? Sign In' : 'New here? Get Started'}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--shadow-dark)]"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[var(--bg-color)] px-2 neu-text-muted">Cloud Integrated</span>
            </div>
          </div>

          <button 
            onClick={async () => {
              setError(null);
              try {
                await loginWithGoogle();
              } catch (err: any) {
                setError(err.message);
              }
            }}
            className="w-full py-4 neu-flat rounded-xl font-bold hover:bg-black/5 transition-colors"
          >
            Connect with Google
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen neu-bg font-sans neu-text overflow-hidden transition-colors duration-300 relative ${uiStyle === 'glassmorphism' ? 'bg-gradient-to-br from-[var(--bg-color)] to-slate-900/10' : ''}`}>
      <QuickStartTour />
      <Toaster position="bottom-right" toastOptions={{
         className: 'neu-pressed !bg-[var(--bg-color)] !text-[var(--text-color)] !border-none !rounded-xl text-sm font-bold',
         success: { duration: 3000 },
         error: { duration: 5000 }
      }} />
      <ConnectivityStatus />
      {user && <DraggableOrb 
         onSettingsClick={() => setActiveLayer('settings')} 
         onAdminClick={() => {
            setActiveLayer('settings');
         }}
      />}
      
      <div className={`absolute inset-0 overflow-hidden pointer-events-none z-0 ${uiStyle === 'glassmorphism' ? 'opacity-70' : 'opacity-30'}`}>
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            x: [0, 100, 0],
            y: [0, 50, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className={`absolute -top-24 -left-24 w-96 h-96 rounded-full blur-3xl ${uiStyle === 'glassmorphism' ? 'bg-[var(--accent)]/40' : 'bg-accent/80/20'}`}
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
            rotate: [0, -90, 0],
            x: [0, -100, 0],
            y: [0, -50, 0]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className={`absolute -bottom-24 -right-24 w-96 h-96 rounded-full blur-3xl ${uiStyle === 'glassmorphism' ? 'bg-indigo-500/40' : 'bg-indigo-500/20'}`}
        />
      </div>

      <div className={`${isSidebarOpen ? 'fixed inset-0 z-50' : 'hidden'} md:flex md:relative md:z-10`}>
        {isSidebarOpen && (
          <div className="absolute inset-0 bg-black/50 md:hidden" onClick={() => setIsSidebarOpen(false)} />
        )}
        <div className="relative z-10 h-full">
          <Sidebar 
            activeLayer={activeLayer} 
            setActiveLayer={(id) => { setActiveLayer(id); setIsSidebarOpen(false); }} 
            theme={theme} 
            setTheme={setTheme} 
            uiStyle={uiStyle}
            setUiStyle={setUiStyle}
            isExpanded={isExpanded}
            setIsExpanded={setIsExpanded}
            appLogoImage={settings?.businessLogo}
            appName={settings?.businessName}
          />
        </div>
      </div>
      <main className="flex-1 overflow-y-auto p-4 md:p-8 relative w-full min-w-0">
        {quotaExceededFlag && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-rose-50 border-2 border-rose-200 rounded-2xl flex flex-col sm:flex-row items-center gap-4 text-rose-800 shadow-lg shadow-rose-500/10"
          >
            <div className="p-2 bg-rose-100 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-rose-600" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <p className="font-bold">System Load Threshold Reached</p>
              <p className="text-sm opacity-90 leading-tight mt-1">Automated marketing cycles are temporarily paused to optimize performance. Check system analytics for details.</p>
            </div>
            <button onClick={() => setQuotaExceededFlag(false)} className="p-2 hover:bg-rose-200 rounded-xl transition-colors shrink-0">
               <X className="w-5 h-5 text-rose-600" />
            </button>
          </motion.div>
        )}
        <div className="flex justify-between items-center mb-4">
          <button 
            className="md:hidden p-2 neu-flat rounded-xl"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <div className="hidden md:flex items-center gap-4 ml-auto">
            <span className="text-sm font-medium">{user?.email || "Admin"}</span>
            <button 
              onClick={logout}
              className="px-4 py-2 neu-flat rounded-xl text-sm font-bold text-rose-500 hover:bg-rose-500/10 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
        <div className="max-w-7xl mx-auto h-full">
          <ErrorBoundary>
            {isLoading || !settings ? (
              <div className="w-full h-full flex flex-col items-center justify-center min-h-[50vh]">
                <div className="flex flex-col items-center justify-center space-y-6">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    className="w-12 h-12 rounded-full border-4 border-[var(--accent)] border-t-transparent animate-spin flex items-center justify-center"
                  />
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-4 w-32 bg-black/5 dark:bg-white/10 rounded overflow-hidden relative">
                      <motion.div 
                        animate={{ x: ["-100%", "200%"] }} 
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }} 
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--accent)]/30 to-transparent w-1/2" 
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeLayer}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="h-full"
                >
                  {renderView()}
                </motion.div>
              </AnimatePresence>
            )}
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
}




