import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ChevronRight, ChevronLeft, Check, Sparkles } from "lucide-react";

export interface TourStep {
  target: string;
  title: string;
  content: string;
  position: 'top' | 'right' | 'bottom' | 'left';
}

const defaultTourSteps: TourStep[] = [
  { target: "nav-home", title: "Welcome Home", content: "This is your control center. Start here for a quick overview of your business.", position: "right" },
  { target: "nav-dashboard", title: "Analytics Overview", content: "Track your sales, revenue, and customer metrics to make data-driven decisions.", position: "right" },
  { target: "nav-leads", title: "Manage Customers", content: "View all your contacts, leads, and customers. Keep track of interactions effortlessly.", position: "right" },
  { target: "nav-interactions", title: "Live Messages", content: "Respond to customer inquiries from WhatsApp and Instagram in real-time.", position: "right" },
  { target: "nav-automation", title: "Automation Rules", content: "Set up auto-replies, follow-ups, and AI assistants to save time.", position: "right" },
  { target: "nav-campaigns", title: "Send Campaigns", content: "Reach out to your customers with bulk, targeted marketing messages.", position: "right" }
];

export function QuickStartTour() {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    // Check if tour was already completed
    const hasCompletedTour = localStorage.getItem('tourCompleted');
    if (!hasCompletedTour) {
      setTimeout(() => setIsActive(true), 1500); // give app time to render
    }
  }, []);

  const steps = defaultTourSteps;

  const updateTargetRect = () => {
    if (!isActive || currentStep >= steps.length) return;
    const targetEl = document.querySelector(`[data-tour="${steps[currentStep].target}"]`);
    if (targetEl) {
       // if it's in a collapsed accordion, we might not see it, but we try anyway.
       // The main modules should be visible by default.
       setTargetRect(targetEl.getBoundingClientRect());
       targetEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
       setTargetRect(null);
    }
  };

  useEffect(() => {
    updateTargetRect();
    window.addEventListener('resize', updateTargetRect);
    return () => window.removeEventListener('resize', updateTargetRect);
  }, [isActive, currentStep]);

  if (!isActive) return null;

  const completeTour = () => {
    setIsActive(false);
    localStorage.setItem('tourCompleted', 'true');
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) setCurrentStep(curr => curr + 1);
    else completeTour();
  };

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep(curr => curr - 1);
  };

  const current = steps[currentStep];

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      <div 
        className="absolute inset-0 bg-black/40 pointer-events-auto backdrop-blur-sm transition-opacity" 
        onClick={completeTour}
      />

      <AnimatePresence>
        {targetRect && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: 1, 
              top: targetRect.top - 4, 
              left: targetRect.left - 4, 
              width: targetRect.width + 8, 
              height: targetRect.height + 8 
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute border-2 border-accent rounded-xl shadow-[0_0_20px_5px_rgba(99,102,241,0.3)] pointer-events-none"
             style={{ 
               boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5), 0 0 15px rgba(var(--accent-rgb, 99, 102, 241), 0.5)' 
             }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {targetRect && (
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute pointer-events-auto w-72 md:w-80"
            style={{
               top: Math.max(20, targetRect.top - 20) + 'px',  
               left: targetRect.right + 20 + 'px' 
            }}
          >
            <div className="neu-flat bg-[var(--bg-color)] rounded-2xl p-5 shadow-2xl relative overflow-hidden border border-[var(--shadow-dark)]">
              <div className="absolute top-0 right-0 p-16 bg-accent opacity-10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex justify-between items-start mb-3 relative z-10">
                <div className="flex items-center gap-2">
                   <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center border border-accent/20">
                     <Sparkles className="w-4 h-4 text-accent" />
                   </div>
                   <h3 className="font-bold text-[var(--text-main)]">{current.title}</h3>
                </div>
                <button onClick={completeTour} className="p-1 text-[var(--text-muted)] hover:text-red-400 transition-colors bg-black/5 dark:bg-white/5 rounded-full">
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-6 font-medium relative z-10">
                {current.content}
              </p>
              
              <div className="flex items-center justify-between relative z-10">
                <div className="text-xs font-bold text-[var(--text-muted)] bg-black/5 dark:bg-white/5 px-2 py-1 rounded-md">
                  Step {currentStep + 1} / {steps.length}
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={prevStep} 
                    disabled={currentStep === 0}
                    className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={nextStep}
                    className="px-4 py-1.5 bg-accent text-white rounded-lg font-bold text-sm shadow-md hover:bg-accent/90 transition-colors flex items-center gap-1"
                  >
                    {currentStep === steps.length - 1 ? (
                      <>Done <Check className="w-4 h-4 ml-1" /></>
                    ) : (
                      <>Next <ChevronRight className="w-4 h-4 ml-1" /></>
                    )}
                  </button>
                </div>
              </div>

              {/* Arrow pointing to element */}
              <div className="absolute top-8 -left-2 w-4 h-4 bg-[var(--bg-color)] border-l border-b border-[var(--shadow-dark)] rotate-45" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
