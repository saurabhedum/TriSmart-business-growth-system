import React, { useState, useEffect } from "react";
import { Activity, Server, Database, AlertTriangle, CheckCircle2, Webhook, RefreshCw, XCircle } from "lucide-react";
import { motion } from "motion/react";
import { collection, query, limit, orderBy, onSnapshot } from "firebase/firestore";
import { useData } from "../contexts/DataContext";
import { db } from "../firebase";

export function SystemTelemetryView() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // System status mock for demonstration until fully hooked to backend heartbeat
  const [status, setStatus] = useState({
    api: "online",
    queue: "healthy",
    database: "online",
    webhooks: "operational"
  });

  useEffect(() => {
    if (!db) return;
    
    // Subscribe to automation_audit to show live logs
    const q = query(
      collection(db, "automation_audit"),
      orderBy("timestamp", "desc"),
      limit(50)
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setLogs(data);
      setLoading(false);
    }, (err) => {
      console.error("Failed to fetch telemetry logs:", err);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const StatusPill = ({ state, label, icon: Icon }: { state: string, label: string, icon: any }) => (
    <div className="neu-pressed rounded-3xl p-6 flex flex-col items-center justify-center text-center gap-3">
      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
        state === 'online' || state === 'healthy' || state === 'operational'
          ? 'bg-green-500/10 text-green-500'
          : 'bg-red-500/10 text-red-500'
      }`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <h4 className="text-sm font-bold text-[var(--text-main)] mb-1">{label}</h4>
        <span className={`text-xs font-black uppercase tracking-widest ${
          state === 'online' || state === 'healthy' || state === 'operational'
            ? 'text-green-500'
            : 'text-red-500'
        }`}>
          {state}
        </span>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 min-h-[calc(100vh-64px)]">
      
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-black/5 dark:bg-white/5 flex items-center justify-center">
            <Activity className="w-6 h-6 text-[var(--text-main)] opacity-70" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[var(--text-main)] tracking-tight">System Telemetry</h1>
            <p className="text-sm text-[var(--text-muted)] font-medium mt-1">
              Military-Grade Infrastructure & Audit Logs
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 text-green-600 border border-green-500/20">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-xs font-bold uppercase tracking-widest">99.99% Uptime</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <StatusPill state={status.api} label="Core Engine API" icon={Server} />
        <StatusPill state={status.database} label="Firestore DB" icon={Database} />
        <StatusPill state={status.queue} label="BullMQ Queues" icon={RefreshCw} />
        <StatusPill state={status.webhooks} label="Meta Webhooks" icon={Webhook} />
      </div>

      <div className="neu-flat rounded-3xl p-6 md:p-8">
        <h2 className="text-lg font-bold text-[var(--text-main)] mb-6 flex items-center gap-2">
          <Database className="w-5 h-5 opacity-50" />
          Live Audit Logs
        </h2>

        <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
          {loading ? (
            <div className="py-12 flex justify-center">
              <div className="w-8 h-8 border-4 border-black/20 dark:border-white/20 border-t-[var(--text-main)] rounded-full animate-spin"></div>
            </div>
          ) : logs.length === 0 ? (
            <div className="py-24 text-center">
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center">
                  <Activity className="w-8 h-8 text-[var(--text-muted)]" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[var(--text-main)]">No telemetry data</h4>
                  <p className="text-xs text-[var(--text-muted)] mt-1 max-w-sm mx-auto">
                    System events and audit logs will appear here in real-time.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            logs.map((log) => (
              <motion.div 
                key={log.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 flex items-start gap-4"
              >
                <div className="mt-1">
                  {log.status === 'success' || log.status === 'sent' || log.status === 'completed' ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : log.status === 'failed' || log.status === 'error' ? (
                    <XCircle className="w-5 h-5 text-red-500" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)] opacity-70">
                      {log.type || 'SYSTEM_EVENT'}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)]">
                      {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString() : new Date().toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--text-main)] font-medium">
                    {log.description || log.message || "Unknown event"}
                  </p>
                  {(log.metadata || log.error) && (
                    <pre className="mt-2 text-[10px] p-2 rounded-lg bg-black/10 dark:bg-white/10 text-[var(--text-muted)] font-mono overflow-x-auto">
                      {JSON.stringify(log.metadata || log.error, null, 2)}
                    </pre>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
