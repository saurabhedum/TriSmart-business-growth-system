import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  MessageSquare,
  Image as ImageIcon,
  Check,
  CheckCircle2,
  User,
  Clock,
  Trash2,
  Eye
} from "lucide-react";
import { db, auth } from "../firebase";
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
import toast from "react-hot-toast";

interface Communication {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeRole: string;
  imageUrl?: string;
  message?: string;
  timestamp: any;
  status: "unread" | "read" | "replied";
}

export function StaffMessagesView() {
  const [messages, setMessages] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, "employee_communications"),
      where("ownerId", "==", auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Communication[];
      
      msgs.sort((a, b) => {
        const timeA = a.timestamp?.toMillis ? a.timestamp.toMillis() : 0;
        const timeB = b.timestamp?.toMillis ? b.timestamp.toMillis() : 0;
        return timeB - timeA;
      });
      
      setMessages(msgs);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching messages:", error);
      toast.error("Failed to load staff messages");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const markAsRead = async (id: string, currentStatus: string) => {
    if (currentStatus === "read") return;
    try {
      await updateDoc(doc(db, "employee_communications", id), { status: "read" });
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const deleteMessage = async (id: string) => {
    if (!confirm("Are you sure you want to delete this message?")) return;
    try {
      await deleteDoc(doc(db, "employee_communications", id));
      toast.success("Message deleted");
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error("Failed to delete message");
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-indigo-500" />
            Staff Communications
          </h1>
          <p className="text-sm neu-text-muted mt-1">Real-time messages and photo uploads from staff portals.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
        </div>
      ) : messages.length === 0 ? (
        <div className="text-center py-20 bg-[var(--bg-color)] rounded-3xl border border-black/5 dark:border-white/5 shadow-sm">
           <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-400 opacity-50" />
           <h3 className="text-xl font-bold mb-2">No Messages Yet</h3>
           <p className="text-[var(--text-muted)] max-w-sm mx-auto">
             When staff take photos or send messages from their mobile portal, they will appear here in real-time.
           </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                 key={msg.id}
                 layout
                 initial={{ opacity: 0, scale: 0.9 }}
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0, scale: 0.9 }}
                 className={`neu-flat rounded-[2rem] overflow-hidden flex flex-col relative transition-all duration-300 ${msg.status === 'unread' ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-[var(--bg-color)]' : ''}`}
                 onClick={() => markAsRead(msg.id, msg.status)}
              >
                  {msg.status === 'unread' && (
                    <div className="absolute top-4 left-4 z-10 w-3 h-3 rounded-full bg-indigo-500 animate-pulse shadow-lg shadow-indigo-500/50"></div>
                  )}

                  <div className="p-5 flex items-center justify-between border-b border-black/5 dark:border-white/5 bg-white/5">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 neu-pressed rounded-full flex items-center justify-center font-black text-indigo-500">
                           {msg.employeeName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                           <h4 className="font-bold leading-none mb-1">{msg.employeeName}</h4>
                           <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{msg.employeeRole}</span>
                        </div>
                     </div>
                     <button onClick={() => deleteMessage(msg.id)} className="p-2 hover:bg-red-500/10 text-red-500 rounded-xl transition-colors">
                        <Trash2 className="w-4 h-4" />
                     </button>
                  </div>

                  <div className="p-5 flex-1 flex flex-col gap-4">
                     {msg.message && (
                        <p className="text-sm font-medium">{msg.message}</p>
                     )}
                     
                     {msg.imageUrl && (
                        <div 
                          className="relative w-full aspect-video rounded-xl overflow-hidden cursor-pointer group bg-black/5"
                          onClick={() => setSelectedImage(msg.imageUrl || null)}
                        >
                           <img src={msg.imageUrl} alt="Staff upload" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                           <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                              <Eye className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                           </div>
                        </div>
                     )}

                     <div className="mt-auto pt-2 flex items-center justify-between text-[11px] font-bold text-[var(--text-muted)]">
                        <span className="flex items-center gap-1">
                           <Clock className="w-3 h-3" />
                           {msg.timestamp?.toDate() ? new Date(msg.timestamp.toDate()).toLocaleString() : 'Just now'}
                        </span>
                        {msg.status === 'read' && (
                           <span className="flex items-center gap-1 text-green-500">
                              <CheckCircle2 className="w-3 h-3" /> Seen
                           </span>
                        )}
                     </div>
                  </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Image Modal */}
      <AnimatePresence>
        {selectedImage && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={() => setSelectedImage(null)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative max-w-4xl w-full"
              onClick={e => e.stopPropagation()}
            >
              <img src={selectedImage} alt="Staff fullscreen" className="w-full h-auto rounded-xl shadow-2xl object-contain max-h-[80vh]" />
              <button 
                onClick={() => setSelectedImage(null)}
                className="absolute -top-12 right-0 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-sm transition-colors"
              >
                <Check className="w-6 h-6" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
