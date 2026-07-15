import React, { useState, useEffect } from 'react';
import { getAccessToken, loginWithGoogle } from '../firebase';
import { Mail, RefreshCw, Send, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

export const GmailView = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isConnecting, setIsConnecting] = useState(false);
  const token = getAccessToken();

  const fetchEmails = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10&q=is:inbox', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch messages. Please sign in again.');
      const data = await res.json();
      
      if (data.messages && data.messages.length > 0) {
        const fullMessages = await Promise.all(data.messages.map(async (msg: any) => {
          const detailRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          return await detailRes.json();
        }));
        setMessages(fullMessages);
      } else {
        setMessages([]);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchEmails();
    else setLoading(false);
  }, [token]);

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Mail className="w-16 h-16 text-gray-400 mb-4" />
        <h2 className="text-xl font-bold mb-2 text-[var(--text-main)]">Gmail Integration</h2>
        <p className="text-[var(--text-muted)] mb-6 max-w-md text-center">To access your inbox and compose emails from the ERP, please connect your Workspace account.</p>
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
          {isConnecting ? "Connecting..." : "Connect Gmail"}
        </button>
      </div>
    );
  }

  const getHeader = (headers: any[], name: string) => headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3 text-[var(--text-main)]">
            <Mail className="w-6 h-6" /> Gmail Central
          </h1>
          <p className="text-[var(--text-muted)]">Manage your business communications</p>
        </div>
        <button onClick={fetchEmails} className="p-2 bg-[var(--surface-color)] hover:bg-[var(--glass-border)] border border-[var(--glass-border)] rounded-full transition-colors">
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
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center p-12 bg-[var(--surface-color)] rounded-xl border border-[var(--glass-border)]">
              <Mail className="w-12 h-12 text-gray-500 mx-auto mb-3" />
              <p className="text-[var(--text-muted)]">Inbox is empty or no messages found.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {messages.map((msg, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  key={msg.id} 
                  className="p-5 bg-[var(--surface-color)] border border-[var(--glass-border)] rounded-xl cursor-pointer hover:bg-[var(--glass-border)] transition-colors flex flex-col sm:flex-row gap-4"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-[var(--text-main)] truncate">{getHeader(msg.payload?.headers || [], 'Subject') || '(No Subject)'}</h3>
                    <p className="text-sm text-[var(--text-muted)] truncate">{getHeader(msg.payload?.headers || [], 'From')}</p>
                    <p className="text-sm text-gray-400 truncate mt-2">{msg.snippet}</p>
                  </div>
                  <div className="text-xs text-[var(--text-muted)] sm:text-right">
                    {new Date(parseInt(msg.internalDate)).toLocaleString()}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
