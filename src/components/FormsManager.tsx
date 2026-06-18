import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Link as LinkIcon, Users } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { saveForm, deleteForm, CustomForm, CustomFormField } from '../lib/db';
import { ConfirmModal } from '../components/ConfirmModal';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';

export function FormsManager() {
  const { forms, settings } = useData();
  const [editingFormId, setEditingFormId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [triggerWord, setTriggerWord] = useState('');
  const [fields, setFields] = useState<CustomFormField[]>([]);

  const openNewForm = () => {
    setTitle('New Form');
    setTriggerWord('FORM_' + Math.floor(Math.random() * 1000));
    setFields([
      { id: uuidv4(), label: 'Name', type: 'text', required: true }
    ]);
    setEditingFormId('new');
  };

  const editForm = (f: CustomForm) => {
    setTitle(f.title);
    setTriggerWord(f.triggerWord);
    setFields(f.fields || []);
    setEditingFormId(f.id);
  };

  const handleSave = async () => {
    if (!title.trim()) { toast.error("Title required"); return; }
    if (!triggerWord.trim()) { toast.error("Trigger word required"); return; }
    
    const isNew = editingFormId === 'new';
    const formId = isNew ? `FORM-${Date.now()}` : editingFormId!;

    const payload: Partial<CustomForm> = {
      id: formId,
      title,
      triggerWord,
      fields
    };

    try {
      await saveForm(payload);
      toast.success(isNew ? "Form created and command added to Chatbot!" : "Form updated!");
      setEditingFormId(null);
    } catch (err: any) {
      toast.error("Failed to save: " + err.message);
    }
  };

  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: "", message: "", link: "", isDestructive: false, onConfirm: () => {} });

  const addField = () => {
    setFields([...fields, { id: uuidv4(), label: 'New Field', type: 'text', required: false }]);
  };

  const updateField = (id: string, updates: Partial<CustomFormField>) => {
    setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const removeField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
  };

  const handleDelete = (form: CustomForm) => {
    setConfirmModal({
      isOpen: true,
      title: `Delete Form`,
      message: `Are you sure you want to delete "${form.title}"? This will also delete its chatbot command.`,
      link: "",
      isDestructive: true,
      onConfirm: async () => {
        try {
          await deleteForm(form.id);
          toast.success("Deleted!");
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        } catch (err: any) {
          toast.error("Failed to delete: " + err.message);
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const handleCopyLink = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const cleanUrl = `${window.location.origin}/form/${id}`;
    
    setConfirmModal({
      isOpen: true,
      title: "Public Form Link",
      message: "This is your clean, public form link. Anyone can fill this out to automatically become a lead in your system.",
      link: cleanUrl,
      isDestructive: false,
      onConfirm: () => {}
    });

    if (navigator.clipboard) {
      navigator.clipboard.writeText(cleanUrl).then(() => {
        toast.success("Public link copied to clipboard!");
      }).catch(() => {});
    }
  };

  const fallbackCopy = (text: string) => {
    // Deprecated for the modal approach
  };

  if (editingFormId) {
    return (
      <div className="p-6 bg-black/5 dark:bg-white/5 rounded-3xl space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold uppercase tracking-widest">{editingFormId === 'new' ? 'Create Form' : 'Edit Form'}</h3>
          <button onClick={() => setEditingFormId(null)} className="text-xs font-bold uppercase hover:underline">Cancel</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Form Title</label>
            <input 
              value={title || ""} onChange={(e) => setTitle(e.target.value)}
              className="w-full p-4 rounded-xl bg-white dark:bg-[#111115] border border-black/10 dark:border-white/10 outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Chatbot Trigger Word</label>
            <input 
              value={triggerWord || ""} onChange={(e) => setTriggerWord(e.target.value)}
              className="w-full p-4 rounded-xl bg-white dark:bg-[#111115] border border-black/10 dark:border-white/10 outline-none"
              placeholder="e.g. FAMILY_DETAILS"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
             <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Form Fields</label>
             <button onClick={addField} className="text-xs font-bold text-accent uppercase flex items-center gap-1">+ Add Field</button>
          </div>
          
          <div className="space-y-3">
            {fields.map((f, i) => (
              <div key={f.id} className="flex flex-wrap items-center gap-3 p-3 bg-white dark:bg-[#111115] rounded-xl border border-black/5 dark:border-white/5">
                <div className="w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center text-xs font-bold">{i+1}</div>
                <input 
                   placeholder="Field Label (e.g. Spouse Name)"
                   value={f.label || ""} 
                   onChange={(e) => updateField(f.id, { label: e.target.value })}
                   className="flex-1 min-w-[200px] p-2 bg-transparent outline-none font-medium border-b border-black/10 dark:border-white/10"
                />
                <select 
                   value={f.type || ""}
                   onChange={(e) => updateField(f.id, { type: e.target.value as any })}
                   className="p-2 bg-black/5 dark:bg-white/5 rounded-lg outline-none text-sm"
                >
                  <option value="text">Text Input</option>
                  <option value="date">Date picker</option>
                  <option value="number">Number</option>
                </select>
                <label className="flex items-center gap-2 text-xs">
                  <input type="checkbox" checked={f.required} onChange={(e) => updateField(f.id, { required: e.target.checked })} />
                  Required
                </label>
                <button onClick={() => removeField(f.id)} className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button onClick={handleSave} className="px-8 py-3 bg-accent text-white font-bold uppercase tracking-widest rounded-xl hover:scale-105 transition-all">
            Save Form
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
         <div>
            <h3 className="text-xl font-bold uppercase tracking-widest flex items-center gap-2"><Users className="w-5 h-5 text-[var(--accent)]"/> Customer Data Forms</h3>
            <p className="text-xs text-[var(--text-muted)] font-medium">Create forms to automatically collect details like household/family members.</p>
         </div>
         <button onClick={openNewForm} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg hover:scale-105 transition-transform">
           <Plus className="w-4 h-4" /> New Form
         </button>
      </div>

      {(!forms || forms.length === 0) ? (
        <div className="text-center py-12 p-6 bg-black/5 dark:bg-white/5 rounded-3xl border border-dashed border-black/20 dark:border-white/20">
          <p className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-widest">No forms created yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {forms.map(form => (
            <div key={form.id} className="p-5 bg-white dark:bg-[#111115] rounded-2xl shadow-sm border border-black/5 dark:border-white/5 flex flex-col justify-between group">
              <div>
                <h4 className="font-bold text-lg">{form.title}</h4>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest bg-accent/10 text-accent px-2 py-1 rounded-md">Trigger: {form.triggerWord}</span>
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-3 line-clamp-1">{form.fields.map(f => f.label).join(', ')}</p>
              </div>
              <div className="flex gap-2 justify-end mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                 <button onClick={(e) => handleCopyLink(form.id, e)} className="p-2 hover:bg-black/5 rounded-xl text-neutral-500" title="Copy public link">
                   <LinkIcon className="w-4 h-4" />
                 </button>
                 <button onClick={() => editForm(form)} className="p-2 hover:bg-black/5 rounded-xl text-blue-500" title="Edit">
                   <Edit2 className="w-4 h-4" />
                 </button>
                 <button onClick={() => handleDelete(form)} className="p-2 hover:bg-rose-500/10 rounded-xl text-rose-500">
                   <Trash2 className="w-4 h-4" />
                 </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal 
        isOpen={confirmModal.isOpen} 
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))} 
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title} 
        message={confirmModal.message}
        confirmText={confirmModal.isDestructive ? "Delete" : "Done"}
        showCancel={confirmModal.isDestructive}
        isDestructive={confirmModal.isDestructive}
      >
        {confirmModal.link && (
          <div className="mt-4">
            <input 
              readOnly 
              value={confirmModal?.link || ""} 
              onClick={(e) => e.currentTarget.select()}
              className="w-full p-4 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 outline-none text-sm font-medium cursor-text"
            />
            <p className="text-[10px] text-[var(--text-muted)] mt-2 font-bold uppercase tracking-widest text-center">Click the input above to select and copy</p>
          </div>
        )}
      </ConfirmModal>

    </div>
  );
}
