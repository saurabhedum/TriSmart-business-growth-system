import React, { useState, useEffect } from 'react';
import { getAccessToken, loginWithGoogle } from '../firebase';
import { Table, RefreshCw, FileText, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

export const GoogleSheetsView = () => {
  const [spreadsheets, setSpreadsheets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isConnecting, setIsConnecting] = useState(false);
  const token = getAccessToken();

  const fetchSpreadsheets = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('https://www.googleapis.com/drive/v3/files?q=mimeType="application/vnd.google-apps.spreadsheet"&orderBy=modifiedTime desc&pageSize=20', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch spreadsheets. Please sign in again.');
      const data = await res.json();
      setSpreadsheets(data.files || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchSpreadsheets();
    else setLoading(false);
  }, [token]);

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Table className="w-16 h-16 text-gray-400 mb-4" />
        <h2 className="text-xl font-bold mb-2 text-[var(--text-main)]">Google Sheets Integration</h2>
        <p className="text-[var(--text-muted)] mb-6 max-w-md text-center">Connect your Workspace account to import or export CRM data seamlessly using Google Sheets.</p>
        <button 
          onClick={async () => {
            setIsConnecting(true);
            try {
              const success = await loginWithGoogle();
              if (success) {
                window.location.reload();
              }
            } finally {
              setIsConnecting(false);
            }
          }}
          disabled={isConnecting}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          {isConnecting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
          {isConnecting ? "Connecting..." : "Connect Sheets"}
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3 text-[var(--text-main)]">
            <Table className="w-6 h-6" /> Google Sheets
          </h1>
          <p className="text-[var(--text-muted)]">View and synchronize your spreadsheets</p>
        </div>
        <button onClick={fetchSpreadsheets} className="p-2 bg-[var(--surface-color)] hover:bg-[var(--glass-border)] border border-[var(--glass-border)] rounded-full transition-colors">
          <RefreshCw className={`w-5 h-5 text-[var(--text-main)] ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-12"><div className="w-8 h-8 rounded-full border-t-2 border-b-2 border-blue-500 animate-spin"></div></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {spreadsheets.length === 0 ? (
            <div className="col-span-full text-center p-12 bg-[var(--surface-color)] rounded-xl border border-[var(--glass-border)]">
              <Table className="w-12 h-12 text-gray-500 mx-auto mb-3" />
              <p className="text-[var(--text-muted)]">No spreadsheets found in your Google Drive.</p>
            </div>
          ) : (
            spreadsheets.map((sheet, i) => (
              <a 
                href={`https://docs.google.com/spreadsheets/d/${sheet.id}`}
                target="_blank" rel="noreferrer"
                key={sheet.id}
              >
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-6 bg-[var(--surface-color)] border border-[var(--glass-border)] rounded-xl hover:bg-[var(--glass-border)] transition-all cursor-pointer h-full"
                >
                  <div className="flex items-start gap-4">
                    <FileText className="w-10 h-10 text-emerald-500 shrink-0" />
                    <div>
                      <h3 className="font-semibold text-[var(--text-main)] line-clamp-2">{sheet.name}</h3>
                      <p className="text-xs text-[var(--text-muted)] mt-2">ID: {sheet.id.substring(0, 8)}...</p>
                    </div>
                  </div>
                </motion.div>
              </a>
            ))
          )}
        </div>
      )}
    </div>
  );
};
