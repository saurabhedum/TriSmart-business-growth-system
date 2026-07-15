import React, { useState, useEffect } from 'react';
import { getAccessToken, loginWithGoogle } from '../firebase';
import { UserCircle, UserPlus, RefreshCw, Mail, Phone, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

export const ContactsView = () => {
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isConnecting, setIsConnecting] = useState(false);
  const token = getAccessToken();

  const fetchContacts = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,phoneNumbers&pageSize=50', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch contacts. Please sign in again.');
      const data = await res.json();
      setContacts(data.connections || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchContacts();
    else setLoading(false);
  }, [token]);

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <UserCircle className="w-16 h-16 text-gray-400 mb-4" />
        <h2 className="text-xl font-bold mb-2 text-[var(--text-main)]">Google Contacts</h2>
        <p className="text-[var(--text-muted)] mb-6 max-w-md text-center">Sync your Google Contacts to easily reference them directly from this CRM.</p>
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
          {isConnecting ? "Connecting..." : "Connect Contacts"}
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3 text-[var(--text-main)]">
            <UserCircle className="w-6 h-6" /> Contacts Directory
          </h1>
          <p className="text-[var(--text-muted)]">Manage your business connections</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
            <UserPlus className="w-4 h-4" /> Add
          </button>
          <button onClick={fetchContacts} className="p-2 bg-[var(--surface-color)] hover:bg-[var(--glass-border)] border border-[var(--glass-border)] rounded-full transition-colors">
            <RefreshCw className={`w-5 h-5 text-[var(--text-main)] ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contacts.length === 0 ? (
            <div className="col-span-full text-center p-12 bg-[var(--surface-color)] rounded-xl border border-[var(--glass-border)]">
              <UserCircle className="w-12 h-12 text-gray-500 mx-auto mb-3" />
              <p className="text-[var(--text-muted)]">No contacts found in your Google account.</p>
            </div>
          ) : (
            contacts.map((contact, i) => {
              const name = contact.names?.[0]?.displayName || 'Unnamed Contact';
              const email = contact.emailAddresses?.[0]?.value || '';
              const phone = contact.phoneNumbers?.[0]?.value || '';

              return (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.02 }}
                  key={contact.resourceName} 
                  className="p-5 bg-[var(--surface-color)] border border-[var(--glass-border)] rounded-xl hover:border-gray-500 transition-colors"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center font-bold text-lg">
                      {name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-[var(--text-main)]">{name}</h3>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-[var(--text-muted)]">
                    {email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" /> {email}
                      </div>
                    )}
                    {phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" /> {phone}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
