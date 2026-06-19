import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useData } from "../contexts/DataContext";
import { 
  BarChart3, TrendingUp, Users, IndianRupee, Package, 
  Target, AlertTriangle, Repeat, UserCheck, ArrowUpRight, 
  ArrowDownRight, RefreshCw, Smartphone
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

const StatCard = ({ title, value, subtitle, icon: Icon, trend }: any) => (
  <div className="bg-[var(--bg-color)] border border-black/5 dark:border-white/5 rounded-3xl p-6 transition-transform hover:scale-[1.02]">
    <div className="flex justify-between items-start mb-4">
      <div className="p-3 bg-black/5 dark:bg-white/5 rounded-2xl text-[var(--accent)]">
        <Icon className="w-5 h-5" />
      </div>
      {trend && (
        <span className={`text-[10px] font-black p-1.5 rounded-lg flex items-center gap-1 ${
          trend.up ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
        }`}>
          {trend.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {trend.value}
        </span>
      )}
    </div>
    <div className="text-3xl font-black tracking-tighter text-[var(--text-main)]">
      {value}
    </div>
    <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mt-1">
      {title}
    </div>
    {subtitle && (
      <div className="text-[10px] font-bold text-emerald-500 mt-2 tracking-tight">
        {subtitle}
      </div>
    )}
  </div>
);

export function DashboardView() {
  const { leads, conversions, inventoryItems, inventoryOrders, expenses } = useData();
  const [timeframe, setTimeframe] = useState<'daily'|'weekly'|'monthly'>('daily');

  // Dates
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfDay.getTime() - 7 * 24 * 60 * 60 * 1000);
  const startOfPrevWeek = new Date(startOfWeek.getTime() - 7 * 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(startOfDay.getTime() - 30 * 24 * 60 * 60 * 1000);

  const metrics = useMemo(() => {
    // 1. Daily Metrics
    const dailyLeads = leads.filter(l => l.createdAt && new Date(l.createdAt) >= startOfDay);
    const dailyConvs = conversions.filter(c => c.date && new Date(c.date) >= startOfDay);
    const dailyOrders = inventoryOrders.filter(o => o.createdAt && new Date(o.createdAt) >= startOfDay && o.status === 'completed');
    const dailyExpenses = expenses.filter(e => e.date && new Date(e.date) >= startOfDay).reduce((sum, e) => sum + e.amount, 0);
    
    // Revenue
    const convRev = dailyConvs.reduce((sum, c) => sum + c.amount, 0);
    const orderRev = dailyOrders.reduce((sum, o) => sum + o.totalPrice, 0);
    const dailyRevenue = convRev + orderRev;

    // Actual COGS calculation
    const dailyOrderCost = dailyOrders.reduce((sum, o) => sum + (o.totalCost || 0), 0);
    // Assuming conversions (services/quotes) have ~0 variable COGS if not explicitly products, or we just trust explicit product cost
    const dailyProfit = dailyRevenue - dailyOrderCost - dailyExpenses;

    const dailySales = dailyConvs.length + dailyOrders.length;
    const dailyConversionRate = dailyLeads.length > 0 ? ((dailySales / dailyLeads.length) * 100).toFixed(1) : 0;

    // 2. Weekly Metrics
    const weeklyLeads = leads.filter(l => l.createdAt && new Date(l.createdAt) >= startOfWeek);
    const prevWeeklyLeads = leads.filter(l => l.createdAt && new Date(l.createdAt) >= startOfPrevWeek && new Date(l.createdAt) < startOfWeek);
    const weeklyConvs = conversions.filter(c => c.date && new Date(c.date) >= startOfWeek);
    const prevWeeklyConvs = conversions.filter(c => c.date && new Date(c.date) >= startOfPrevWeek && new Date(c.date) < startOfWeek);
    
    const weeklyOrders = inventoryOrders.filter(o => o.createdAt && new Date(o.createdAt) >= startOfWeek && o.status === 'completed');
    const prevWeeklyOrders = inventoryOrders.filter(o => o.createdAt && new Date(o.createdAt) >= startOfPrevWeek && new Date(o.createdAt) < startOfWeek && o.status === 'completed');
    
    const weeklyRevenue = weeklyConvs.reduce((sum, c) => sum + c.amount, 0) + weeklyOrders.reduce((sum, o) => sum + o.totalPrice, 0);
    const prevWeeklyRevenue = prevWeeklyConvs.reduce((sum, c) => sum + c.amount, 0) + prevWeeklyOrders.reduce((sum, o) => sum + o.totalPrice, 0);
    
    const growthRevenue = prevWeeklyRevenue > 0 ? (((weeklyRevenue - prevWeeklyRevenue) / prevWeeklyRevenue) * 100).toFixed(1) : (weeklyRevenue > 0 ? 100 : 0);
    
    const lostOppWeek = leads.filter(l => l.status === 'Lost' && l.createdAt && new Date(l.createdAt) >= startOfWeek).length;

    // 3. Monthly Metrics
    const monthlyLeads = leads.filter(l => l.createdAt && new Date(l.createdAt) >= startOfMonth);
    const convertedLeads = leads.filter(l => l.status === 'Converted');
    
    const repeatPurchasers = convertedLeads.filter(l => {
      const convCount = conversions.filter(c => c.leadId === l.id).length;
      return convCount > 1;
    }).length;
    
    const totalPurchasingCustomers = convertedLeads.length;
    const retentionRate = totalPurchasingCustomers > 0 ? ((repeatPurchasers / totalPurchasingCustomers) * 100).toFixed(1) : 0;
    
    const referralLeadsMonth = monthlyLeads.filter(l => l.source === 'Referral');
    const referralRevenueMonth = referralLeadsMonth.reduce((acc, l) => {
       const leadConvs = conversions.filter(c => c.leadId === l.id).reduce((sum, c) => sum + c.amount, 0);
       return acc + leadConvs;
    }, 0);
    
    const totalAllTimeRevenue = conversions.reduce((sum, c) => sum + c.amount, 0) + inventoryOrders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.totalPrice, 0);
    const ltv = totalPurchasingCustomers > 0 ? (totalAllTimeRevenue / totalPurchasingCustomers).toFixed(0) : 0;

    return {
      dailyLeads: dailyLeads.length,
      dailySales,
      dailyRevenue,
      dailyProfit,
      dailyConversionRate,

      weeklyGrowth: growthRevenue,
      lostOppWeek,
      
      retentionRate,
      repeatPurchasers,
      referralRevenueMonth,
      ltv
    };
  }, [leads, conversions, inventoryOrders]);

  const topProducts = useMemo(() => {
    return [...inventoryItems]
      .sort((a, b) => (b.revenueGenerated || 0) - (a.revenueGenerated || 0))
      .slice(0, 4);
  }, [inventoryItems]);

  const topSalespeople = useMemo(() => {
     // Extrapolate salespeople based on ownerId of converted leads
     const salesMap: Record<string, {name: string, rev: number, sales: number}> = {};
     conversions.forEach(c => {
       const lead = leads.find(l => l.id === c.leadId);
       const owner = lead?.ownerId || 'Unassigned';
       if(!salesMap[owner]) salesMap[owner] = { name: owner, rev: 0, sales: 0 };
       salesMap[owner].rev += c.amount;
       salesMap[owner].sales += 1;
     });
     return Object.values(salesMap).sort((a,b) => b.rev - a.rev).slice(0, 3);
  }, [conversions, leads]);

  const chartData = useMemo(() => {
    const days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    });

    return days.map((day) => {
      const dayLeads = leads.filter(
        (l) => l.createdAt && new Date(l.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) === day
      ).length;
      const dayConvs = conversions.filter(
        (c) => c.date && new Date(c.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) === day
      ).length;
      return { name: day, leads: dayLeads, conversions: dayConvs };
    });
  }, [leads, conversions]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8 pb-12 font-sans max-w-7xl mx-auto"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-2">
        <div>
          <h1 className="text-3xl font-black tracking-tight uppercase flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500">
               <TrendingUp className="w-8 h-8" />
            </div>
            Analytics & Control
          </h1>
          <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest pl-14">
            Stage 5: Retail OS Executive Dashboard
          </p>
        </div>

        <div className="flex gap-2 p-1.5 bg-[var(--bg-color)] border border-black/5 dark:border-white/5 rounded-2xl">
           {['daily', 'weekly', 'monthly'].map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t as any)}
                className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  timeframe === t ? 'bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/20' : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                {t}
              </button>
           ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
         <motion.div 
           key={timeframe}
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           exit={{ opacity: 0, y: -10 }}
           className="space-y-8"
         >
           
           {/* DAILY SUMMARY */}
           {timeframe === 'daily' && (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard 
                  title="Today's Leads" 
                  value={metrics.dailyLeads} 
                  icon={Users}
                />
                <StatCard 
                  title="Completed Sales" 
                  value={metrics.dailySales} 
                  icon={Target}
                />
                <StatCard 
                  title="Daily Revenue" 
                  value={`₹${metrics.dailyRevenue.toLocaleString()}`} 
                  icon={IndianRupee}
                />
                <StatCard 
                  title="Est. Net Profit" 
                  value={`₹${metrics.dailyProfit.toLocaleString()}`} 
                  icon={TrendingUp}
                  subtitle="After COGS & Expenses"
                />
                <StatCard 
                  title="Conversion Rate" 
                  value={`${metrics.dailyConversionRate}%`} 
                  icon={RefreshCw}
                />
             </div>
           )}

           {/* WEEKLY SUMMARY */}
           {timeframe === 'weekly' && (
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="flex flex-col gap-6">
                   <StatCard 
                    title="Revenue Growth (7D)" 
                    value={`${metrics.weeklyGrowth}%`} 
                    icon={TrendingUp}
                    trend={{ up: Number(metrics.weeklyGrowth) >= 0, value: 'vs Last Week' }}
                  />
                  <div className="bg-[var(--bg-color)] border border-black/5 dark:border-white/5 rounded-3xl p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3 bg-rose-500/10 rounded-2xl text-rose-500">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="text-3xl font-black tracking-tighter text-[var(--text-main)]">
                      {metrics.lostOppWeek}
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mt-1">
                      Lost Opportunities
                    </div>
                  </div>
                </div>

                <div className="bg-[var(--bg-color)] border border-black/5 dark:border-white/5 rounded-3xl p-6 lg:col-span-1">
                  <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-main)] mb-6 flex items-center gap-2">
                    <Package className="w-4 h-4 text-amber-500" /> Fast-Moving Products
                  </h3>
                  <div className="space-y-4">
                     {topProducts.length === 0 ? (
                       <p className="text-xs font-bold text-[var(--text-muted)] italic py-4">No product data analyzed.</p>
                     ) : topProducts.map((p, i) => (
                       <div key={p.id} className="flex items-center justify-between p-4 bg-black/5 dark:bg-white/5 rounded-2xl">
                          <div className="flex items-center gap-3 w-[60%]">
                            <span className="text-xs font-black text-amber-500">#{i + 1}</span>
                            <span className="text-xs font-black uppercase tracking-tight truncate">
                              {typeof p.name === 'object' ? String((p.name as any)?.name || 'Product') : String(p.name)}
                            </span>
                          </div>
                          <span className="text-xs font-black text-emerald-500 flex items-center gap-1 shrink-0">
                            ₹{p.revenueGenerated || 0}
                          </span>
                       </div>
                     ))}
                  </div>
                </div>

                <div className="bg-[var(--bg-color)] border border-black/5 dark:border-white/5 rounded-3xl p-6 lg:col-span-1">
                  <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-main)] mb-6 flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-500" /> Top Salespeople
                  </h3>
                  <div className="space-y-4">
                     {topSalespeople.length === 0 ? (
                       <p className="text-xs font-bold text-[var(--text-muted)] italic py-4">No sales recorded.</p>
                     ) : topSalespeople.map((sp, i) => (
                       <div key={sp.name} className="flex items-center justify-between p-4 bg-black/5 dark:bg-white/5 rounded-2xl">
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-black text-indigo-500">#{i + 1}</span>
                            <span className="text-xs font-black uppercase tracking-tight truncate">
                              {sp.name}
                            </span>
                          </div>
                          <div className="text-right flex flex-col">
                            <span className="text-xs font-black text-emerald-500 flex justify-end">
                              ₹{sp.rev.toLocaleString()}
                            </span>
                             <span className="text-[10px] font-bold text-[var(--text-muted)]">
                              {sp.sales} Sales
                            </span>
                          </div>
                       </div>
                     ))}
                  </div>
                </div>
             </div>
           )}

           {/* MONTHLY SUMMARY */}
           {timeframe === 'monthly' && (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard 
                  title="Retention Rate" 
                  value={`${metrics.retentionRate}%`} 
                  icon={UserCheck}
                  subtitle="Customers returning"
                />
                <StatCard 
                  title="Repeat Purchases" 
                  value={metrics.repeatPurchasers} 
                  icon={Repeat}
                />
                <StatCard 
                  title="Referral Revenue" 
                  value={`₹${metrics.referralRevenueMonth.toLocaleString()}`} 
                  icon={TrendingUp}
                />
                <StatCard 
                  title="Customer LTV" 
                  value={`₹${metrics.ltv.toLocaleString()}`} 
                  icon={IndianRupee}
                  subtitle="Lifetime Value Avg"
                />
             </div>
           )}

         </motion.div>
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {/* Inventory Health */}
         <div className="bg-[var(--bg-color)] border border-black/5 dark:border-white/5 rounded-3xl p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5">
               <Package className="w-24 h-24" />
            </div>
            <h3 className="text-sm font-black uppercase tracking-widest text-[var(--accent)] mb-6 flex items-center gap-2">
               Inventory Intelligence
            </h3>
            <div className="space-y-4">
               <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-[var(--text-muted)]">Total Stock Value</span>
                  <span className="text-sm font-black text-[var(--text-main)]">₹{inventoryItems.reduce((acc, i) => acc + ((i.costPrice || 0) * (i.stock || 0)), 0).toLocaleString()}</span>
               </div>
               <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-[var(--text-muted)]">Dead Capital</span>
                  <span className="text-sm font-black text-rose-500">₹{inventoryItems.filter(i => i.turnoverVelocity === 'Dead').reduce((acc, i) => acc + ((i.costPrice || 0) * (i.stock || 0)), 0).toLocaleString()}</span>
               </div>
               <div className="w-full h-1.5 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden mt-2">
                  <div 
                    className="h-full bg-rose-500" 
                    style={{ 
                      width: `${Math.min(100, (inventoryItems.filter(i => i.turnoverVelocity === 'Dead').length / inventoryItems.length) * 100)}%` 
                    }} 
                  />
               </div>
            </div>
         </div>

         {/* Profit Maximization */}
         <div className="bg-[var(--bg-color)] border border-black/5 dark:border-white/5 rounded-3xl p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5">
               <IndianRupee className="w-24 h-24" />
            </div>
            <h3 className="text-sm font-black uppercase tracking-widest text-emerald-500 mb-6 flex items-center gap-2">
               Profit Maximization
            </h3>
            <div className="space-y-4">
               <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-[var(--text-muted)]">Current Potential Profit</span>
                  <span className="text-sm font-black text-emerald-500">₹{inventoryItems.reduce((acc, i) => acc + (((i.price || 0) - (i.costPrice || 0)) * (i.stock || 0)), 0).toLocaleString()}</span>
               </div>
               <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-[var(--text-muted)]">Target Margin Avg</span>
                  <span className="text-sm font-black text-[var(--text-main)]">
                    {(inventoryItems.reduce((acc, i) => acc + (i.costPrice ? (((i.price || 0) - i.costPrice) / i.price!) * 100 : 0), 0) / (inventoryItems.length || 1)).toFixed(1)}%
                  </span>
               </div>
            </div>
         </div>

         {/* Demand Prediction */}
         <div className="bg-[var(--bg-color)] border border-black/5 dark:border-white/5 rounded-3xl p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5">
               <Smartphone className="w-24 h-24" />
            </div>
            <h3 className="text-sm font-black uppercase tracking-widest text-amber-500 mb-6 flex items-center gap-2">
               Demand Prediction (Risk)
            </h3>
            <div className="flex items-center gap-4">
               <div className="text-4xl font-black text-amber-500">
                  {inventoryItems.filter(i => (i.stock || 0) < (i.reorderLevel || 5) * 1.5 && i.turnoverVelocity === 'Fast').length}
               </div>
               <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-amber-500">Stock-out Risk</div>
                  <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Next 7 Days Likely</div>
               </div>
            </div>
         </div>
      </div>

      <div className="mt-8 bg-[var(--bg-color)] border border-black/5 dark:border-white/5 rounded-3xl p-8">
         <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-main)] mb-8 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-500" /> Lead vs Conversion Trajectory
         </h3>
         <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#00000010" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: "#64748b" }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: "#64748b" }} dx={-10} />
                <Tooltip
                  contentStyle={{ borderRadius: "16px", border: "1px solid rgba(0,0,0,0.05)", boxShadow: "0 10px 40px -10px rgba(0,0,0,0.1)", background: 'var(--bg-color)' }}
                  itemStyle={{ fontSize: "12px", fontWeight: "bold" }}
                  labelStyle={{ fontWeight: 900, textTransform: "uppercase", fontSize: "10px", color: 'var(--text-muted)' }}
                />
                <Area type="monotone" dataKey="leads" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorLeads)" name="New Leads" />
                <Area type="monotone" dataKey="conversions" stroke="#10b981" strokeWidth={3} fill="transparent" name="Closed Deals" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
      </div>
    </motion.div>
  );
}
