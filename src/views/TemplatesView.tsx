import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageTemplate, addTemplate, updateTemplate, deleteTemplate } from '../lib/db';
import { useData } from '../contexts/DataContext';
import { Plus, Search, MessageSquare, Save, Trash2, Edit2, Play, LayoutTemplate, Zap, CheckSquare, Wand2, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { ConfirmModal } from '../components/ConfirmModal';
import { whatsappService } from '../services/whatsappService';

export function TemplatesView() {
  const { templates } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<Partial<MessageTemplate> | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  const [testModalTemplate, setTestModalTemplate] = useState<MessageTemplate | null>(null);
  const [testPhoneNumber, setTestPhoneNumber] = useState('');
  const [isTestSending, setIsTestSending] = useState(false);
  const [testParams, setTestParams] = useState('');
  
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    isDestructive: true,
    onConfirm: () => {}
  });

  const handleSave = async () => {
    if (!currentTemplate?.name || !currentTemplate?.content) {
      toast.error('Name and content are required');
      return;
    }
    
    try {
      if (currentTemplate.id) {
        await updateTemplate(currentTemplate.id, currentTemplate);
        toast.success('Template updated');
      } else {
        await addTemplate({
          name: currentTemplate.name,
          category: currentTemplate.category || 'MARKETING',
          platform: currentTemplate.platform || 'WhatsApp',
          language: currentTemplate.language || 'en',
          content: currentTemplate.content,
          status: 'DRAFT',
          metaTemplateId: currentTemplate.metaTemplateId || ''
        } as Omit<MessageTemplate, 'id'|'ownerId'|'createdAt'>);
        toast.success('Template generated');
      }
      setIsEditing(false);
      setCurrentTemplate(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save template');
    }
  };

  const handleDelete = (id: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Template',
      message: 'Are you sure you want to delete this template? This cannot be undone and automated flows using it may fail.',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await deleteTemplate(id);
          setSelectedIds(prev => {
             const next = new Set(prev);
             next.delete(id);
             return next;
          });
          toast.success("Deleted template");
        } catch (e: any) {
          toast.error("Failed to delete: " + e.message);
        }
      }
    });
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    setConfirmConfig({
      isOpen: true,
      title: `Delete ${selectedIds.size} Templates`,
      message: 'Are you sure you want to delete all selected templates? This cannot be undone.',
      isDestructive: true,
      onConfirm: async () => {
        const promises = Array.from(selectedIds).map(id => deleteTemplate(id));
        try {
          await Promise.all(promises);
          toast.success(`Deleted ${selectedIds.size} templates`);
          setSelectedIds(new Set());
        } catch (e: any) {
          toast.error("Failed to delete some templates: " + e.message);
        }
      }
    });
  };

  const generateEssentialTemplates = async () => {
    const defaultTemplates: Partial<MessageTemplate>[] = [
      { name: 'Abandoned Inquiry', category: 'ABANDONED_INQUIRY', content: 'Hi {{1}}, you recently checked out our products. Need any help with your decision?', platform: 'WhatsApp', status: 'DRAFT', language: 'en' },
      { name: 'Referral Request', category: 'REFERRAL', content: 'Hi {{1}}, thank you for your purchase! Share your referral code {{2}} with friends and get rewards.', platform: 'WhatsApp', status: 'DRAFT', language: 'en' },
      { name: 'Warranty Extension', category: 'WARRANTY', content: 'Hi {{1}}, your warranty is expiring soon on {{2}}. Would you like to extend it?', platform: 'WhatsApp', status: 'DRAFT', language: 'en' },
      { name: 'Service Reminder', category: 'SERVICE_REMINDER', content: 'Hi {{1}}, it is time for your standard maintenance service. Click to book now.', platform: 'WhatsApp', status: 'DRAFT', language: 'en' },
      { name: 'Re-engagement', category: 'REENGAGEMENT', content: 'Hi {{1}}, we have not seen you in a while! Here is a special offer for your next visit.', platform: 'WhatsApp', status: 'DRAFT', language: 'en' },
      { name: 'Complaint Solved', category: 'COMPLAINT_SOLVED', content: 'Hi {{1}}, your support ticket regarding "{{2}}" has been resolved. Let us know if you need any further assistance!', platform: 'WhatsApp', status: 'DRAFT', language: 'en' },
      { name: 'Form Distribution', category: 'FORM_DISTRIBUTION', content: 'Hi {{1}},\n\nPlease fill out this important form to continue:\n{{2}}\n\nThank you!', platform: 'WhatsApp', status: 'DRAFT', language: 'en' }
    ];

    let addedCount = 0;
    for (const tpl of defaultTemplates) {
      if (!templates.find(t => t.category === tpl.category)) {
        try {
           await addTemplate(tpl as any);
           addedCount++;
        } catch(e) {}
      }
    }
    
    if (addedCount > 0) toast.success(`Generated ${addedCount} essential templates`);
    else toast.success('All essential templates already exist');
  };

  const handleSendTest = async () => {
    if (!testModalTemplate || !testPhoneNumber.trim()) {
      toast.error('Phone number is required');
      return;
    }
    
    setIsTestSending(true);
    let paramsArray: any[] = [];
    if (testParams.trim()) {
       paramsArray = testParams.split(',').map(p => p.trim());
    }

    try {
      const res = await whatsappService.sendMessage({
        to: testPhoneNumber,
        message: testModalTemplate.content, // Fallback if API needs raw message instead of template ID
        customTemplateName: testModalTemplate.metaTemplateId || undefined,
        templateCategory: 'custom',
        templateParams: paramsArray.length > 0 ? paramsArray : undefined
      });

      if (res.success) {
        toast.success('Test message sent successfully!');
        setTestModalTemplate(null);
        setTestPhoneNumber('');
        setTestParams('');
      } else {
        toast.error('Failed to send: ' + res.error);
      }
    } catch (err: any) {
      toast.error(err.message || 'Error sending test message');
    } finally {
      setIsTestSending(false);
    }
  };

  const filteredTemplates = (templates || []).filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight flex items-center gap-3">
            <LayoutTemplate className="w-8 h-8 text-indigo-500" />
            Message Templates
          </h1>
          <p className="text-neutral-500 font-medium mt-1">
            Build and manage predefined messages for Campaigns, Copilot, and Meta Webhooks.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={generateEssentialTemplates}
            className="bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-[var(--text-main)] px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center gap-2 transition-all"
          >
            <Wand2 className="w-5 h-5" /> Seed Defaults
          </button>
          <button
            onClick={() => {
              setCurrentTemplate({
                name: '',
                category: 'MARKETING',
                platform: 'WhatsApp',
                language: 'en',
                content: '',
              });
              setIsEditing(true);
            }}
            className="bg-[var(--accent)] hover:opacity-90 text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center gap-2 transition-all shadow-lg shadow-[var(--accent)]/20"
          >
            <Plus className="w-5 h-5" /> New Template
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-black/5 dark:border-white/5 p-6 space-y-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full text-black dark:text-white">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search templates by name or content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black/5 dark:bg-white/5 border-none rounded-2xl py-4 pl-12 pr-4 font-bold outline-none focus:ring-2 focus:ring-[var(--accent)]/50 transition-shadow"
            />
          </div>
          {selectedIds.size > 0 && (
            <button
               onClick={handleBulkDelete}
               className="bg-rose-500 hover:bg-rose-600 text-white px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center gap-2 transition-all shrink-0 shadow-lg shadow-rose-500/20"
            >
               <Trash2 className="w-5 h-5" /> Delete Selected ({selectedIds.size})
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredTemplates.map(template => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-black/5 dark:bg-white/5 rounded-3xl p-5 border group relative overflow-hidden flex flex-col transition-all cursor-pointer ${
                selectedIds.has(template.id) ? 'border-[var(--accent)] ring-1 ring-[var(--accent)] dark:border-[var(--accent)]' : 'border-black/5 dark:border-white/5'
              }`}
              onClick={() => {
                setSelectedIds(prev => {
                  const next = new Set(prev);
                  if (next.has(template.id)) next.delete(template.id);
                  else next.add(template.id);
                  return next;
                });
              }}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-start gap-4">
                  <div className="pt-1 select-none">
                     <div className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-colors ${
                        selectedIds.has(template.id) ? 'bg-[var(--accent)] border-[var(--accent)]' : 'border-neutral-400'
                     }`}>
                        {selectedIds.has(template.id) && <CheckSquare className="w-4 h-4 text-white" />}
                     </div>
                  </div>
                  <div>
                    <h3 className="font-black text-lg truncate pr-2 select-none text-black dark:text-white">{template.name}</h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-widest bg-white dark:bg-black px-2 py-1 rounded-md text-indigo-500 border border-indigo-500/20">
                        {template.category.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-widest bg-white dark:bg-black px-2 py-1 rounded-md text-emerald-500 border border-emerald-500/20">
                        {template.platform}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 bg-white dark:bg-black rounded-2xl p-4 text-sm text-neutral-600 dark:text-neutral-400 border border-black/5 dark:border-white/5 overflow-hidden relative">
                <div className="line-clamp-4 whitespace-pre-wrap select-text">{template.content}</div>
              </div>

              <div className="flex items-center justify-between pt-4 mt-auto">
                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${template.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-500' : template.status === 'REJECTED' ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'}`}>
                   {template.status}
                </span>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setTestModalTemplate(template);
                      setTestPhoneNumber('');
                      setTestParams('');
                    }}
                    className="p-2 bg-white dark:bg-black hover:text-emerald-500 rounded-xl transition-colors shadow-sm text-neutral-500 dark:text-neutral-400"
                    title="Send Test Message & Open 24h Window"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentTemplate(template);
                      setIsEditing(true);
                    }}
                    className="p-2 bg-white dark:bg-black hover:text-indigo-500 rounded-xl transition-colors shadow-sm text-neutral-500 dark:text-neutral-400"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(template.id);
                    }}
                    className="p-2 bg-white dark:bg-black hover:text-rose-500 rounded-xl transition-colors shadow-sm text-neutral-500 dark:text-neutral-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
          {filteredTemplates.length === 0 && (
             <div className="col-span-full py-24 text-center">
               <div className="flex flex-col items-center justify-center space-y-4">
                 <div className="w-16 h-16 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center">
                   <MessageSquare className="w-8 h-8 text-[var(--text-muted)]" />
                 </div>
                 <div>
                   <h4 className="text-sm font-bold text-[var(--text-main)]">No templates found</h4>
                   <p className="text-xs text-[var(--text-muted)] mt-1 max-w-sm mx-auto">
                     Create your first automated message template.
                   </p>
                 </div>
               </div>
             </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isEditing && currentTemplate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsEditing(false)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-[2rem] shadow-2xl p-8 max-h-[90vh] overflow-y-auto border border-white/10"
            >
              <button 
                onClick={() => setIsEditing(false)}
                className="absolute top-6 right-6 p-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-2xl font-black mb-6 uppercase tracking-tight flex items-center gap-3">
                 <Zap className="w-6 h-6 text-amber-500" />
                 {currentTemplate.id ? 'Edit Template' : 'New Template'}
              </h2>

              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2 pl-1">Template Name</label>
                    <input
                      type="text"
                      value={currentTemplate.name || ''}
                      onChange={e => setCurrentTemplate({...currentTemplate, name: e.target.value})}
                      placeholder="e.g. Welcome Message"
                      className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-[var(--accent)]/50"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2 pl-1">Category</label>
                    <select
                      value={currentTemplate.category || 'MARKETING'}
                      onChange={e => setCurrentTemplate({...currentTemplate, category: e.target.value as any})}
                      className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-[var(--accent)]/50"
                    >
                      <option value="MARKETING">Marketing</option>
                      <option value="UTILITY">Utility</option>
                      <option value="AUTHENTICATION">Authentication</option>
                      <option value="SALES_COPILOT">Sales Copilot</option>
                      <option value="ABANDONED_INQUIRY">Abandoned Inquiry</option>
                      <option value="WARRANTY">Warranty Reminder</option>
                      <option value="SERVICE_REMINDER">Service Reminder</option>
                      <option value="REFERRAL">Referral Request</option>
                      <option value="ONBOARDING">Onboarding</option>
                      <option value="REENGAGEMENT">Re-engagement</option>
                      <option value="COMPLAINT_SOLVED">Complaint Solved</option>
                      <option value="FORM_DISTRIBUTION">Form Distribution</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2 pl-1">Platform</label>
                    <select
                      value={currentTemplate.platform || 'WhatsApp'}
                      onChange={e => setCurrentTemplate({...currentTemplate, platform: e.target.value as any})}
                      className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-[var(--accent)]/50"
                    >
                      <option value="WhatsApp">WhatsApp</option>
                      <option value="Instagram">Instagram</option>
                      <option value="SMS">SMS</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2 pl-1">Meta Template ID (Optional)</label>
                    <input
                      type="text"
                      value={currentTemplate.metaTemplateId || ''}
                      onChange={e => setCurrentTemplate({...currentTemplate, metaTemplateId: e.target.value})}
                      placeholder="e.g. hello_world_123"
                      className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-[var(--accent)]/50"
                    />
                  </div>
                </div>

                <div>
                   <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2 pl-1 flex justify-between">
                     <span>Message Content</span>
                     <span className="text-[var(--accent)]">Use {"{{"}1{"}}"} for variables</span>
                   </label>
                   <textarea
                     value={currentTemplate.content || ''}
                     onChange={e => setCurrentTemplate({...currentTemplate, content: e.target.value})}
                     placeholder="Hi {{1}}, we noticed you missed our call. How can we help you?"
                     rows={6}
                     className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-[var(--accent)]/50 resize-none font-mono"
                   />
                </div>

                <button
                  onClick={handleSave}
                  className="w-full bg-[var(--accent)] hover:opacity-90 text-white font-black uppercase tracking-widest text-sm py-4 rounded-2xl transition-all shadow-lg shadow-[var(--accent)]/20 flex items-center justify-center gap-2 mt-4"
                >
                  <Save className="w-5 h-5" /> Save Template
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {testModalTemplate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setTestModalTemplate(null)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-neutral-900 rounded-[2rem] shadow-2xl p-8 border border-white/10"
            >
              <button 
                onClick={() => setTestModalTemplate(null)}
                className="absolute top-6 right-6 p-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-2xl font-black mb-2 uppercase tracking-tight flex items-center gap-3">
                 <Play className="w-6 h-6 text-emerald-500" />
                 Send Test Message
              </h2>
              <p className="text-neutral-500 text-sm mb-6">Send this template to a phone number to open a 24-hour customer service window on WhatsApp.</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2 pl-1">Phone Number (with Country Code)</label>
                  <input
                    type="text"
                    value={testPhoneNumber || ""}
                    onChange={e => setTestPhoneNumber(e.target.value)}
                    placeholder="e.g. +919876543210"
                    className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2 pl-1">Template Variables (comma separated)</label>
                  <input
                    type="text"
                    value={testParams}
                    onChange={e => setTestParams(e.target.value)}
                    placeholder="e.g. John Doe, 500, Today"
                    className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                  <p className="text-xs text-neutral-500 mt-2">Leave blank if this template requires no parameters.</p>
                </div>

                <div className="p-4 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5 mt-4">
                   <p className="text-xs text-neutral-500 font-mono">
                     Template ID: {testModalTemplate.metaTemplateId || testModalTemplate.name}
                   </p>
                </div>

                <button
                  onClick={handleSendTest}
                  disabled={isTestSending}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-black uppercase tracking-widest text-sm py-4 rounded-2xl transition-all flex items-center justify-center gap-2 mt-4"
                >
                  {isTestSending ? 'Sending...' : <><Play className="w-5 h-5 fill-current" /> Send Now</>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={confirmConfig.onConfirm}
        onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
        isDestructive={confirmConfig.isDestructive}
      />
    </div>
  );
}
