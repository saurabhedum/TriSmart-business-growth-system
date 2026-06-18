import React, { useMemo, useState } from "react";
import { motion } from "motion/react";
import { useData } from "../contexts/DataContext";
import {
  Repeat,
  Clock,
  ShieldCheck,
  Tag,
  Heart,
  ChevronRight,
  Activity,
  TrendingUp,
  Users,
  Share2,
  Gem,
  Award,
  Plus
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { saveCampaign, updateLead } from "../lib/db";
import { toast } from "react-hot-toast";

export function RetentionView() {
  const { leads, conversions, inventoryOrders } = useData();
  const [activeTab, setActiveTab] = useState<"Radar">("Radar");

  const handleDeployIndividualCampaign = async (
    type: "Service" | "Warranty" | "Replacement",
    lead: any,
  ) => {
    try {
      let messageTemplate = "";
      if (type === "Service")
        messageTemplate = `Hi {name}, it's time for your scheduled maintenance service. Reply to book an appointment!`;
      if (type === "Warranty")
        messageTemplate = `Hi {name}, your warranty is expiring on ${new Date(lead.warrantyExpiryDate).toLocaleDateString()}. Extend now and save 20%!`;
      if (type === "Replacement")
        messageTemplate = `Hi {name}, we noticed your product might be due for an upgrade. Check out our latest models!`;

      await saveCampaign({
        title: `${type} Alert - ${lead.name}`,
        channel: "WhatsApp",
        status: "Active",
        messageTemplate,
        triggerType: type as any,
        triggerCondition: lead.id,
      });
      toast.success(`${type} campaign deployed for ${lead.name}`);
    } catch (e: any) {
      toast.error("Failed: " + e.message);
    }
  };

  // Retention Intelligence Logic
  const retentionStats = useMemo(() => {
    // Calculate real stats
    const eligibleForUpgrade = leads.filter(
      (l) =>
        l.predictedReplacementDate &&
        new Date(l.predictedReplacementDate) <=
          new Date(new Date().setMonth(new Date().getMonth() + 2)),
    );
    const eligibleForService = leads.filter(
      (l) =>
        l.nextServiceDate &&
        new Date(l.nextServiceDate) <=
          new Date(new Date().setMonth(new Date().getMonth() + 1)),
    );

    // repeatRate: percentage of conversions that belong to returning customers
    const uniqueLeadIdsWithPurchases = new Set();
    const returningLeadIdsWithPurchases = new Set();

    conversions.forEach((c) => {
      if (c.leadId) {
        if (uniqueLeadIdsWithPurchases.has(c.leadId)) {
          returningLeadIdsWithPurchases.add(c.leadId);
        } else {
          uniqueLeadIdsWithPurchases.add(c.leadId);
        }
      }
    });

    const repeatRate =
      uniqueLeadIdsWithPurchases.size > 0
        ? (returningLeadIdsWithPurchases.size /
            uniqueLeadIdsWithPurchases.size) *
          100
        : 0;

    return {
      repeatRate: repeatRate.toFixed(1),
      totalLTV: leads.reduce((sum, l) => sum + (l.customerValueScore || 0), 0),
      avgLTV:
        leads.length > 0
          ? leads.reduce((sum, l) => sum + (l.customerValueScore || 0), 0) /
            leads.length
          : 0,
      eligibleForUpgrade: eligibleForUpgrade.length,
      eligibleForService: eligibleForService.length,
    };
  }, [leads]);

  const ltvData = useMemo(() => {
    // Generate data based on real conversions over the last 6 months
    const dataByMonth: Record<string, number> = {};
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = d.toLocaleString("default", { month: "short" });
      dataByMonth[monthStr] = 0;
    }

    ([...conversions, ...inventoryOrders] as any[]).forEach((t) => {
      const date = new Date(t.date || t.createdAt);
      if (date >= new Date(now.getFullYear(), now.getMonth() - 5, 1)) {
        const m = date.toLocaleString("default", { month: "short" });
        if (dataByMonth[m] !== undefined) {
          dataByMonth[m] += (t as any).amount || (t as any).totalPrice || 0;
        }
      }
    });

    return Object.entries(dataByMonth).map(([month, ltv]) => ({ month, ltv }));
  }, [conversions, inventoryOrders]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8 pb-12"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-2">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 neu-flat rounded-xl text-accent">
              <Heart className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent/60">
              Loyalty Engine
            </span>
          </div>
          <h1 className="text-3xl font-black tracking-tight uppercase mb-2">
            Customer Lifecycle Engine
          </h1>
          <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">
            Stage 4: Upsells, Warranty Monetization & Predict Replacements
          </p>
        </div>
      </div>

      {activeTab === "Radar" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 bg-black/5 dark:bg-white/5 border border-emerald-500/10 rounded-3xl group">
          <div className="flex items-center gap-3 mb-4 text-emerald-500">
            <Activity className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase tracking-widest">
              Repeat Rate
            </span>
          </div>
          <div className="text-3xl font-black">
            {retentionStats.repeatRate}%
          </div>
          <p className="text-[10px] font-bold text-neutral-500 uppercase mt-2">
            Of customers return
          </p>
        </div>

        <div className="p-6 bg-black/5 dark:bg-white/5 border border-indigo-500/10 rounded-3xl group">
          <div className="flex items-center gap-3 mb-4 text-indigo-500">
            <TrendingUp className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase tracking-widest">
              Average LTV
            </span>
          </div>
          <div className="text-3xl font-black">
            ${Math.floor(retentionStats.avgLTV)}
          </div>
          <p className="text-[10px] font-bold text-neutral-500 uppercase mt-2">
            Per acquired customer
          </p>
        </div>

        <div className="p-6 bg-black/5 dark:bg-white/5 border border-amber-500/10 rounded-3xl group">
          <div className="flex items-center gap-3 mb-4 text-amber-500">
            <Clock className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase tracking-widest">
              Service Dues
            </span>
          </div>
          <div className="text-3xl font-black">
            {retentionStats.eligibleForService}
          </div>
          <p className="text-[10px] font-bold text-neutral-500 uppercase mt-2">
            Require maintenance
          </p>
        </div>

        <div className="p-6 bg-black/5 dark:bg-white/5 border border-rose-500/10 rounded-3xl group">
          <div className="flex items-center gap-3 mb-4 text-rose-500">
            <Repeat className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase tracking-widest">
              Upgrade Ready
            </span>
          </div>
          <div className="text-3xl font-black">
            {retentionStats.eligibleForUpgrade}
          </div>
          <p className="text-[10px] font-bold text-neutral-500 uppercase mt-2">
            Due for replacement
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-3xl space-y-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-accent flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Lifetime Value Growth
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ltvData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#00000010"
                  />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 700, fill: "#64748b" }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 700, fill: "#64748b" }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "16px",
                      border: "none",
                      boxShadow: "0 10px 40px -10px rgba(0,0,0,0.1)",
                    }}
                    labelStyle={{
                      fontWeight: 900,
                      textTransform: "uppercase",
                      fontSize: "10px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="ltv"
                    stroke="#6366f1"
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-6 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-3xl space-y-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-emerald-500 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> Warranty Expiring Soon
            </h3>
            {leads.filter(
              (l) =>
                l.warrantyExpiryDate &&
                new Date(l.warrantyExpiryDate) <=
                  new Date(new Date().setMonth(new Date().getMonth() + 1)),
            ).length === 0 ? (
              <div className="text-sm font-bold text-emerald-600/50 p-4 text-center">
                No warranties expiring in the next month.
              </div>
            ) : (
              leads
                .filter(
                  (l) =>
                    l.warrantyExpiryDate &&
                    new Date(l.warrantyExpiryDate) <=
                      new Date(new Date().setMonth(new Date().getMonth() + 1)),
                )
                .map((lead) => (
                  <div
                    key={lead.id}
                    className="flex justify-between items-center p-4 bg-white dark:bg-black/50 rounded-2xl border border-black/5 dark:border-white/5 hover:border-emerald-500/30 transition-colors"
                  >
                    <div>
                      <div className="font-bold text-sm">
                        {typeof lead.name === "object"
                          ? String((lead.name as any)?.name || "Customer")
                          : String(lead.name)}
                      </div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mt-1">
                        Expires:{" "}
                        {new Date(
                          lead.warrantyExpiryDate!,
                        ).toLocaleDateString()}
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        handleDeployIndividualCampaign("Warranty", lead)
                      }
                      className="px-4 py-2 bg-emerald-500/10 text-emerald-600 font-bold text-[10px] uppercase tracking-widest rounded-xl hover:bg-emerald-500/20 transition-colors"
                    >
                      Send Offer
                    </button>
                  </div>
                ))
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-3xl space-y-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-rose-500 flex items-center gap-2">
              <Tag className="w-4 h-4" /> Replacement Radar
            </h3>
            <p className="text-xs font-medium opacity-80 leading-relaxed -mt-2">
              Products nearing their intended lifespan. Launch upgrade campaigns
              before competitors reach them.
            </p>

            <div className="space-y-3">
              {leads.filter(
                (l) =>
                  l.predictedReplacementDate &&
                  new Date(l.predictedReplacementDate) <=
                    new Date(new Date().setMonth(new Date().getMonth() + 2)),
              ).length === 0 ? (
                <div className="text-sm font-bold text-rose-600/50 p-4 text-center">
                  No upcoming replacements detected.
                </div>
              ) : (
                leads
                  .filter(
                    (l) =>
                      l.predictedReplacementDate &&
                      new Date(l.predictedReplacementDate) <=
                        new Date(
                          new Date().setMonth(new Date().getMonth() + 2),
                        ),
                  )
                  .map((lead) => (
                    <div
                      key={lead.id}
                      className="p-4 bg-white/50 dark:bg-black/20 rounded-2xl border border-rose-500/10"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-sm">
                          {typeof lead.name === "object"
                            ? String((lead.name as any)?.name || "Customer")
                            : String(lead.name)}
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-rose-500">
                          Action Due
                        </span>
                      </div>
                      <div className="text-xs text-neutral-500 font-medium tracking-tight mb-3">
                        Replacement Date:{" "}
                        {new Date(
                          lead.predictedReplacementDate!,
                        ).toLocaleDateString()}
                      </div>
                      <button
                        onClick={() =>
                          handleDeployIndividualCampaign("Replacement", lead)
                        }
                        className="w-full py-2 bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md shadow-rose-500/20 hover:bg-rose-600 transition-colors"
                      >
                        Create Campaign
                      </button>
                    </div>
                  ))
              )}
            </div>
          </div>

          <div className="p-6 bg-amber-500/10 border border-amber-500/20 rounded-3xl space-y-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-amber-600 flex items-center gap-2">
              <Clock className="w-4 h-4" /> Service Reminders
            </h3>
            <p className="text-xs font-medium opacity-80 leading-relaxed -mt-2">
              Automate WhatsApp service reminders for regular maintenance items.
            </p>

            <div className="space-y-3">
              {leads.filter(
                (l) =>
                  l.nextServiceDate &&
                  new Date(l.nextServiceDate) <=
                    new Date(new Date().setMonth(new Date().getMonth() + 1)),
              ).length === 0 ? (
                <div className="text-sm font-bold text-amber-600/50 p-4 text-center">
                  No pending service reminders.
                </div>
              ) : (
                leads
                  .filter(
                    (l) =>
                      l.nextServiceDate &&
                      new Date(l.nextServiceDate) <=
                        new Date(
                          new Date().setMonth(new Date().getMonth() + 1),
                        ),
                  )
                  .map((lead) => (
                    <div
                      key={lead.id}
                      onClick={() =>
                        handleDeployIndividualCampaign("Service", lead)
                      }
                      className="flex items-center justify-between p-4 bg-white/50 dark:bg-black/20 rounded-2xl border border-amber-500/10 hover:bg-white dark:hover:bg-black/40 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-amber-500 group-hover:animate-ping" />
                        <span className="font-bold text-sm text-amber-900 dark:text-amber-100">
                          {typeof lead.name === "object"
                            ? String((lead.name as any)?.name || "Customer")
                            : String(lead.name)}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-amber-500 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )}
</motion.div>
  );
}
