import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wifi, WifiOff } from 'lucide-react';

export function ConnectivityStatus() {
  const [isOnline, setIsOnline] = useState(window.navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] pointer-events-none"
        >
          <div className="bg-rose-500 text-white px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5 border-2 border-white/20 backdrop-blur-md">
            <WifiOff className="w-3.5 h-3.5 animate-pulse" />
            <span className="text-[10px] font-bold">Offline</span>
          </div>
        </motion.div>
      )}
      {isOnline && (
        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
           transition={{ duration: 0.5 }}
           onAnimationComplete={() => {
             // We can auto-hide this after a few seconds of coming back online
           }}
           className="hidden md:flex fixed bottom-2 right-2 z-50 items-center gap-1.5 bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full text-[10px] font-medium border border-emerald-500/20 shadow-sm"
        >
          <Wifi className="w-2.5 h-2.5" />
          <span>Online</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
