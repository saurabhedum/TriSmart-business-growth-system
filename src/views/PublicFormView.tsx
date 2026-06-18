import React, { useState, useEffect } from 'react';
import { CustomForm } from '../lib/db';
import { Sparkles, CheckCircle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export function PublicFormView() {
  const [formConfig, setFormConfig] = useState<CustomForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const pathParts = window.location.pathname.split('/');
        const formId = pathParts[pathParts.length - 1]; // e.g. /form/FORM-123
        
        if (!formId) throw new Error("Invalid Form Link");
        
        const reqHost = window.location.host;
        const protocol = window.location.protocol;
        const res = await fetch(`${protocol}//${reqHost}/api/public/form/${formId}`);
        
        if (!res.ok) {
           setError("This form does not exist or has been removed.");
           return;
        }

        const data = await res.json();
        setFormConfig(data.form as CustomForm);
      } catch (err: any) {
         setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchForm();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formConfig) return;
    setLoading(true);

    try {
      const urlParams = new URLSearchParams(window.location.search);
      let cid = urlParams.get('cid'); // customer/lead ID

      // If cid is missing or is the raw placeholder from the template, we'll create a new lead
      if (!cid || cid.includes('customer_id') || cid === '%7B%7Bcustomer_id%7D%7D' || cid === '%7Bcustomer_id%7D') {
         cid = `LEAD-${Date.now()}`;
      }

      let relationField = "Form Submission";
      for (const field of formConfig.fields) {
         if (field.label.toLowerCase().includes('relation')) {
            relationField = formData[field.id] || "Unknown";
         }
      }

      let nameField = "Website Visitor";
      for (const field of formConfig.fields) {
         if (field.label.toLowerCase().includes('name')) {
            nameField = formData[field.id] || "Unknown";
         }
      }

      let phoneField = "";
      for (const field of formConfig.fields) {
         const lowerLabel = field.label.toLowerCase();
         if (lowerLabel.includes('mobile') || lowerLabel.includes('phone') || lowerLabel.includes('whatsapp') || lowerLabel.includes('contact')) {
            phoneField = formData[field.id] || "";
            // Keep the loop going or break? Let's just keep the last, or break on first. Let's break on first.
            if (phoneField) break;
         }
      }

      const otherData = formConfig.fields
         .filter(f => !f.label.toLowerCase().includes('name') && !f.label.toLowerCase().includes('relation'))
         .map(f => `${f.label}: ${formData[f.id] || ''}`)
         .join(' | ');

      const newMember = {
         id: uuidv4(),
         name: nameField,
         relation: relationField,
         notes: `From form '${formConfig.title}': ${otherData}`,
         phone: phoneField
      };

      const reqHost = window.location.host;
      const protocol = window.location.protocol;
      const res = await fetch(`${protocol}//${reqHost}/api/public/submit-form`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formId: formConfig.id,
          cid,
          formData,
          newMember,
          formTitle: formConfig.title,
          ownerId: formConfig.ownerId
        })
      });

      if (!res.ok) {
         throw new Error("Failed to submit form data");
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !formConfig) {
    return <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] text-white">Loading Form...</div>;
  }

  if (error) {
    return (
       <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] text-white p-4 text-center">
         <div className="max-w-md p-8 bg-black/40 border border-white/10 rounded-3xl">
           <p className="text-rose-500 font-medium mb-4">{error}</p>
         </div>
       </div>
    );
  }

  if (submitted) {
    return (
       <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] text-white p-4 text-center">
         <div className="max-w-md p-8 bg-black/40 border border-white/10 rounded-3xl space-y-4">
           <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
             <CheckCircle className="w-8 h-8" />
           </div>
           <h2 className="text-2xl font-bold">Details Submitted</h2>
           <p className="text-white/60">Thank you for providing your details.</p>
         </div>
       </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4 font-sans text-white">
      <div className="w-full max-w-lg bg-black/40 backdrop-blur-3xl border border-white/10 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/20 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/20 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="relative z-10">
           <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
             <Sparkles className="w-6 h-6 text-accent" />
             {formConfig?.title}
           </h1>
           <p className="text-white/60 text-sm mb-8">Please fill in the required fields below.</p>
           
           <form onSubmit={handleSubmit} className="space-y-6">
              {formConfig?.fields.map(field => (
                 <div key={field.id} className="space-y-2">
                   <label className="text-xs font-bold uppercase tracking-widest text-white/50">{field.label}</label>
                   <input 
                      type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                      required={field.required}
                      value={formData[field.id] || ''}
                      onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                      className="w-full p-4 rounded-xl bg-white/5 border border-white/10 outline-none focus:border-accent transition-colors"
                   />
                 </div>
              ))}
              
              <button 
                 type="submit" 
                 disabled={loading}
                 className="w-full mt-4 p-4 rounded-xl bg-accent text-white font-bold uppercase tracking-widest shadow-lg shadow-accent/20 hover:shadow-accent/40 transition-shadow disabled:opacity-50"
              >
                 {loading ? "Submitting..." : "Submit Details"}
              </button>
           </form>
        </div>
      </div>
    </div>
  );
}
