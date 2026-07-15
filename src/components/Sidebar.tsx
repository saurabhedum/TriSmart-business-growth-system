import {
  LayoutDashboard,
  Users,
  BellRing,
  FileText,
  CreditCard,
  Settings,
  Repeat,
  Palette,
  ChevronLeft,
  ChevronRight,
  UploadCloud,
  Languages,
  AlertTriangle,
  BookOpen,
  GitBranch,
  MessageSquare,
  ClipboardList,
  HelpCircle,
  Megaphone,
  Instagram,
  BarChart3,
  Zap,
  Bot,
  Share2,
  Home,
  Cpu,
  Package,
  Search,
  ChevronsUpDown,
  ChevronDown,
  ChevronUp,
  HeadphonesIcon,
  UserCircle,
  ShoppingCart,
  Wallet,
  TrendingUp,
  Award,
  Building,
  Activity,
  Mail,
  Table,
  User,
  StickyNote
} from "lucide-react";
import { cn } from "../lib/utils";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useTranslation } from "react-i18next";
import { usePWAInstall } from "../hooks/usePWAInstall";
import { Download } from "lucide-react";
import { useData } from "../contexts/DataContext";

export const layers = [
  { id: "home", label: "Home", icon: Home, description: "Welcome Dashboard" },
  { id: "dashboard", label: "Analytics", icon: BarChart3, description: "Business Performance" },
  { id: "erp", label: "ERP Dashboard", icon: BookOpen, description: "Janta Gallery ERP" },
  { id: "workflows", label: "Workflows", icon: GitBranch, description: "Workflow Analysis" },
  { id: "team", label: "Team & Staff", icon: Users, description: "Manage Employees" },
  { id: "staff_messages", label: "Staff Messages", icon: MessageSquare, description: "Chats & Uploads" },
  { id: "incentives", label: "Performance & Rewards", icon: Award, description: "Incentive Engine" },
  { id: "warehouses", label: "Warehouses & Showrooms", icon: Building, description: "Manage Locations" },
  { id: "retention", label: "Repeat Customers", icon: Repeat, description: "Bring back customers" },
  { id: "expenses", label: "Expenses", icon: Wallet, description: "Track Cashflow" },
  { id: "leads", label: "Customers", icon: Users, description: "Your customer list" },
  { id: "data_import", label: "Upload Data", icon: UploadCloud, description: "Add customer files" },
  { id: "inventory", label: "Products", icon: Package, description: "Your product catalog" },
  { id: "pos", label: "Quick POS", icon: ShoppingCart, description: "Fast Point of Sale" },
  { id: "campaigns", label: "Marketing", icon: Megaphone, description: "Send marketing messages" },
  { id: "templates", label: "Templates", icon: FileText, description: "Message layouts" },
  { id: "social", label: "Connect Apps", icon: Instagram, description: "Connect Instagram or WhatsApp" },
  { id: "interactions", label: "Inbox Messages", icon: MessageSquare, description: "Live customer chats" },
  { id: "automation", label: "Automations", icon: Bot, description: "Automatic messages & replies" },
  { id: "engine", label: "AI Developer Tool", icon: Cpu, description: "Build custom features" },
  { id: "invoices", label: "Invoices", icon: FileText, description: "Manage billing" },
  { id: "quotations", label: "Quotations", icon: ClipboardList, description: "Send estimates" },
  { id: "payments", label: "Payments", icon: CreditCard, description: "Track transactions" },
  { id: "tickets", label: "Support Tickets", icon: HeadphonesIcon, description: "Customer issues" },
  { id: "telemetry", label: "System Status", icon: Activity, description: "Audit logs and health" },
  { id: "themes", label: "Appearance", icon: Palette, description: "Change colors & look" },
  { id: "gmail", label: "Gmail", icon: Mail, description: "Manage your emails" },
  { id: "sheets", label: "Google Sheets", icon: Table, description: "Manage spreadsheets" },
  { id: "contacts", label: "Contacts", icon: User, description: "Manage your contacts" }
];

const mainGroupIds = ["dashboard", "erp", "workflows", "leads", "interactions", "automation", "campaigns"];
const humanResourceGroupIds = ["team", "staff_messages", "incentives", "warehouses"];
const salesGrowthGroupIds = ["expenses", "pos", "retention", "templates"];
const workspaceGroupIds = ["home", "data_import", "inventory", "engine"];
const billingSupportGroupIds = ["invoices", "quotations", "payments", "tickets"];
const settingsGroupIds = ["telemetry", "social", "themes"];
const miscellaneousGroupIds = ["gmail", "sheets", "contacts"];

interface SidebarProps {
  activeLayer: string;
  setActiveLayer: (id: string) => void;
  theme: string;
  setTheme: (theme: string) => void;
  uiStyle: string;
  setUiStyle: (uiStyle: string) => void;
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
  appLogoImage?: string | null;
  appName?: string | null;
}

export function Sidebar({ activeLayer, setActiveLayer, theme, setTheme, uiStyle, setUiStyle, isExpanded, setIsExpanded, appLogoImage, appName }: SidebarProps) {
  const { t, i18n } = useTranslation();
  const { isInstallable, promptInstall } = usePWAInstall();
  const { interactions, settings } = useData();
  
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(true);
  const [isSalesGrowthOpen, setIsSalesGrowthOpen] = useState(true);
  const [isHrOpen, setIsHrOpen] = useState(true);
  const [isBillingOpen, setIsBillingOpen] = useState(false);
  const [isSettingsSectionOpen, setIsSettingsSectionOpen] = useState(false);
  const [isMiscellaneousOpen, setIsMiscellaneousOpen] = useState(false);

  const [hoveredItem, setHoveredItem] = useState<{
    label: string;
    description: string;
    y: number;
  } | null>(null);

  const startTooltipHover = (e: React.MouseEvent<HTMLElement>, label: string, description?: string) => {
    if (!isExpanded) {
      const rect = e.currentTarget.getBoundingClientRect();
      const sidebarRect = e.currentTarget.closest(".sidebar-container")?.getBoundingClientRect();
      const y = rect.top - (sidebarRect?.top || 0) + rect.height / 2;
      setHoveredItem({
        label,
        description: description || "",
        y
      });
    }
  };

  const mainLayers = layers.filter(l => mainGroupIds.includes(l.id));
  const humanResourceLayers = layers.filter(l => humanResourceGroupIds.includes(l.id));
  const salesGrowthLayers = layers.filter(l => salesGrowthGroupIds.includes(l.id));
  const workspaceLayers = layers.filter(l => workspaceGroupIds.includes(l.id));
  const billingLayers = layers.filter(l => billingSupportGroupIds.includes(l.id));
  const settingsLayers = layers.filter(l => settingsGroupIds.includes(l.id));
  const miscellaneousLayers = layers.filter(l => miscellaneousGroupIds.includes(l.id));

  const interactionsBadgeCount = interactions.filter(i => i.status === "Pending" || i.isPotentialBuyer).length;

  const renderNavItem = (layer: any, indent = false) => {
    const Icon = layer.icon;
    const isActive = activeLayer === layer.id;
    return (
      <motion.button
        key={layer.id}
        onClick={() => setActiveLayer(layer.id)}
        data-tour={`nav-${layer.id}`}
        className={cn(
          "w-full flex items-center gap-3 py-2 px-3 text-sm rounded-xl transition-all text-left font-medium group relative select-none",
          isActive 
            ? "bg-black/5 dark:bg-white/10 text-[var(--accent)] font-semibold" 
            : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/5",
          !isExpanded && "justify-center px-0",
          indent && isExpanded && "pl-8"
        )}
        title={isExpanded ? t(layer.description) : `${t(layer.label)} - ${t(layer.description)}`}
        aria-label={t(layer.label)}
        onMouseEnter={(e) => startTooltipHover(e, layer.label, layer.description)}
        onMouseLeave={() => setHoveredItem(null)}
      >
        <Icon className={cn("shrink-0", isActive ? "text-[var(--accent)]" : "text-[var(--text-muted)] group-hover:text-[var(--text-main)]", !isExpanded ? "w-5 h-5 mx-auto" : "w-4 h-4")} />
        {isExpanded && <span className="truncate">{t(layer.label)}</span>}
        {isExpanded && layer.id === "interactions" && interactionsBadgeCount > 0 && (
           <span className="ml-auto bg-[var(--accent)] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{interactionsBadgeCount}</span>
        )}
      </motion.button>
    );
  };

  return (
    <motion.div 
      initial={false}
      animate={{ width: isExpanded ? 260 : 70 }}
      className="neu-bg flex flex-col h-screen shrink-0 overflow-visible relative transition-all duration-300 z-10 border-r border-black/5 dark:border-white/5 shadow-sm sidebar-container"
    >
      {/* Header Logo */}
      <div className="p-4 flex items-center justify-between sticky top-0 bg-[var(--bg-color)] z-10">
        <motion.div 
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn("flex justify-between items-center bg-black/5 dark:bg-white/10 rounded-xl p-2 cursor-pointer hover:bg-black/10 dark:hover:bg-white/20 transition-colors", isExpanded ? "w-full" : "mx-auto")}
          onMouseEnter={(e) => startTooltipHover(e, isExpanded ? "Collapse Sidebar" : "Expand Sidebar", appName || "Retail OS")}
          onMouseLeave={() => setHoveredItem(null)}
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[var(--accent)] flex items-center justify-center text-white shrink-0">
               <ChevronsUpDown className="w-4 h-4" />
            </div>
            {isExpanded && (
               <span className="font-semibold text-sm tracking-tight text-[var(--text-main)] truncate">{appName || "Retail OS"}</span>
            )}
          </div>
          {isExpanded && <ChevronsUpDown className="w-4 h-4 text-[var(--text-muted)] shrink-0" />}
        </motion.div>
      </div>
      
      <div className="flex-1 py-2 px-3 flex flex-col gap-1 overflow-y-auto overflow-x-hidden scrollbar-thin select-none">
        {/* Search Bar */}
        <div className={cn("mb-4", isExpanded ? "px-1" : "px-0 flex justify-center")}>
          {isExpanded ? (
            <div className="relative flex items-center w-full bg-black/5 dark:bg-white/10 rounded-xl px-3 py-2 text-sm text-[var(--text-muted)] border border-transparent focus-within:border-[var(--accent)] transition-colors">
              <Search className="w-4 h-4 mr-2 opacity-70" />
              <input 
                type="text" 
                placeholder="Search" 
                className="bg-transparent outline-none w-full placeholder-[var(--text-muted)]"
              />
              <div className="flex items-center justify-center bg-black/5 dark:bg-white/10 rounded-md px-1.5 py-0.5 ml-2 text-[10px] font-medium shrink-0">
                ⌘K
              </div>
            </div>
          ) : (
            <div 
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 cursor-text transition-colors"
              onMouseEnter={(e) => startTooltipHover(e, "Search", "Search all sections (⌘K)")}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <Search className="w-5 h-5 text-[var(--text-muted)]" />
            </div>
          )}
        </div>

        {/* Main Menu */}
        <nav className="space-y-0.5 flex flex-col mb-4">
          {mainLayers.map(l => renderNavItem(l))}
        </nav>

        {/* Human Resource Section */}
        <div className="flex flex-col mb-4">
          <button 
            onClick={() => setIsHrOpen(!isHrOpen)}
            className={cn("flex items-center justify-between text-xs font-semibold text-[var(--text-muted)] py-2 px-2 hover:text-[var(--text-main)] transition-colors rounded-lg", !isExpanded && "justify-center")}
            onMouseEnter={(e) => startTooltipHover(e, "Human Resources", "Manage team, chats and rewards")}
            onMouseLeave={() => setHoveredItem(null)}
          >
            {isExpanded ? (
               <div className="flex items-center gap-2">
                 <Users className="w-4 h-4" />
                 Human Resource
               </div>
            ) : (
               <Users className="w-5 h-5" />
            )}
            {isExpanded && (
               isHrOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
          
          <AnimatePresence>
            {isHrOpen && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className={cn("flex flex-col space-y-0.5 overflow-hidden", isExpanded ? "mt-1" : "mt-2")}
              >
                {humanResourceLayers.map(l => renderNavItem(l, true))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sales & Growth Section */}
        <div className="flex flex-col mb-4">
          <button 
            onClick={() => setIsSalesGrowthOpen(!isSalesGrowthOpen)}
            className={cn("flex items-center justify-between text-xs font-semibold text-[var(--text-muted)] py-2 px-2 hover:text-[var(--text-main)] transition-colors rounded-lg", !isExpanded && "justify-center")}
            onMouseEnter={(e) => startTooltipHover(e, "Sales & Growth", "Insights, expenses, POS, templates")}
            onMouseLeave={() => setHoveredItem(null)}
          >
            {isExpanded ? (
               <div className="flex items-center gap-2">
                 <TrendingUp className="w-4 h-4" />
                 Sales & Growth
               </div>
            ) : (
               <TrendingUp className="w-5 h-5" />
            )}
            {isExpanded && (
               isSalesGrowthOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
          
          <AnimatePresence>
            {isSalesGrowthOpen && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className={cn("flex flex-col space-y-0.5 overflow-hidden", isExpanded ? "mt-1" : "mt-2")}
              >
                {salesGrowthLayers.map(l => renderNavItem(l, true))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Workspace Section */}
        <div className="flex flex-col mb-4">
          <button 
            onClick={() => setIsWorkspaceOpen(!isWorkspaceOpen)}
            className={cn("flex items-center justify-between text-xs font-semibold text-[var(--text-muted)] py-2 px-2 hover:text-[var(--text-main)] transition-colors rounded-lg", !isExpanded && "justify-center")}
            onMouseEnter={(e) => startTooltipHover(e, "Workspace", "Control center, data upload, catalog")}
            onMouseLeave={() => setHoveredItem(null)}
          >
            {isExpanded ? (
               <div className="flex items-center gap-2">
                 <LayoutDashboard className="w-4 h-4" />
                 Workspace
               </div>
            ) : (
               <LayoutDashboard className="w-5 h-5" />
            )}
            {isExpanded && (
               isWorkspaceOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
          
          <AnimatePresence>
            {isWorkspaceOpen && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className={cn("flex flex-col space-y-0.5 overflow-hidden", isExpanded ? "mt-1" : "mt-2")}
              >
                {workspaceLayers.map(l => renderNavItem(l, true))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Billing Section */}
        {settings?.enableBillingAndSupport && (
          <div className="flex flex-col mb-4">
            <button 
              onClick={() => setIsBillingOpen(!isBillingOpen)}
              className={cn("flex items-center justify-between text-xs font-semibold text-[var(--text-muted)] py-2 px-2 hover:text-[var(--text-main)] transition-colors rounded-lg", !isExpanded && "justify-center")}
              onMouseEnter={(e) => startTooltipHover(e, "Billing & Support", "Invoices, estimates, payments, tickets")}
              onMouseLeave={() => setHoveredItem(null)}
            >
              {isExpanded ? (
                 <div className="flex items-center gap-2">
                   <CreditCard className="w-4 h-4" />
                   Billing {"&"} Support
                 </div>
              ) : (
                 <CreditCard className="w-5 h-5" />
              )}
              {isExpanded && (
                 isBillingOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
            
            <AnimatePresence>
              {isBillingOpen && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className={cn("flex flex-col space-y-0.5 overflow-hidden", isExpanded ? "mt-1" : "mt-2")}
                >
                  {billingLayers.map(l => renderNavItem(l, true))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Settings Section */}
        <div className="flex flex-col mb-4">
          <button 
            onClick={() => setIsSettingsSectionOpen(!isSettingsSectionOpen)}
            className={cn("flex items-center justify-between text-xs font-semibold text-[var(--text-muted)] py-2 px-2 hover:text-[var(--text-main)] transition-colors rounded-lg", !isExpanded && "justify-center")}
            onMouseEnter={(e) => startTooltipHover(e, "Settings", "Configure integrations, themes, audits")}
            onMouseLeave={() => setHoveredItem(null)}
          >
            {isExpanded ? (
               <div className="flex items-center gap-2">
                 <Settings className="w-4 h-4" />
                 Settings
               </div>
            ) : (
               <Settings className="w-5 h-5" />
            )}
            {isExpanded && (
               isSettingsSectionOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
          
          <AnimatePresence>
            {isSettingsSectionOpen && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className={cn("flex flex-col space-y-0.5 overflow-hidden", isExpanded ? "mt-1" : "mt-2")}
              >
                {settingsLayers.map(l => renderNavItem(l, true))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Miscellaneous Section */}
        <div className="flex flex-col mb-4">
          <button 
            onClick={() => setIsMiscellaneousOpen(!isMiscellaneousOpen)}
            className={cn("flex items-center justify-between text-xs font-semibold text-[var(--text-muted)] py-2 px-2 hover:text-[var(--text-main)] transition-colors rounded-lg", !isExpanded && "justify-center")}
            onMouseEnter={(e) => startTooltipHover(e, "Miscellaneous", "Synced Google integrations")}
            onMouseLeave={() => setHoveredItem(null)}
          >
            {isExpanded ? (
               <div className="flex items-center gap-2">
                 <LayoutDashboard className="w-4 h-4" />
                 Miscellaneous
               </div>
            ) : (
               <LayoutDashboard className="w-5 h-5" />
            )}
            {isExpanded && (
               isMiscellaneousOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
          
          <AnimatePresence>
            {isMiscellaneousOpen && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className={cn("flex flex-col space-y-0.5 overflow-hidden", isExpanded ? "mt-1" : "mt-2")}
              >
                {miscellaneousLayers.map(l => renderNavItem(l, true))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Account Button */}
        <button 
          onClick={() => setActiveLayer("settings")}
          className={cn(
            "w-full flex items-center gap-3 py-2 px-3 text-sm rounded-xl transition-all text-left font-medium mb-4", 
            activeLayer === "settings"
              ? "bg-black/5 dark:bg-white/10 text-[var(--accent)] font-semibold" 
              : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/5",
            !isExpanded && "justify-center px-0"
          )}
          onMouseEnter={(e) => startTooltipHover(e, "Account", "Manager Profile & Subscriptions")}
          onMouseLeave={() => setHoveredItem(null)}
        >
           <UserCircle className={cn("shrink-0", activeLayer === "settings" ? "text-[var(--accent)]" : "", !isExpanded ? "mx-auto w-5 h-5" : "w-4 h-4")} />
           {isExpanded && <span className="truncate">Account</span>}
        </button>

      </div>

      {/* Floating Perfect Tooltip Outside of Overflow Containers */}
      <AnimatePresence>
        {!isExpanded && hoveredItem && (
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            className="absolute left-[78px] z-[9999] pointer-events-none whitespace-nowrap shadow-2xl"
            style={{
              top: hoveredItem.y,
              transform: "translateY(-50%)"
            }}
          >
            <div className="relative bg-zinc-950 dark:bg-zinc-900 text-white border border-zinc-800 dark:border-zinc-800/80 p-2 px-3.5 rounded-xl shadow-2xl flex flex-col gap-0.5 max-w-xs min-w-[120px] backdrop-blur-md">
              {/* Pointing arrow */}
              <div className="absolute top-1/2 -left-1 w-2 h-2 bg-zinc-950 dark:bg-zinc-900 border-b border-l border-zinc-800 dark:border-zinc-800/80 transform -translate-y-1/2 rotate-45" />
              <div className="relative text-xs font-semibold text-zinc-100 leading-snug">
                {t(hoveredItem.label)}
              </div>
              {hoveredItem.description && (
                <div className="relative text-[10px] text-zinc-400 dark:text-zinc-500 font-normal leading-normal whitespace-normal">
                  {t(hoveredItem.description)}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}


