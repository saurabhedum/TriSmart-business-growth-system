import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Target, 
  Award, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  Briefcase, 
  Building,
  User,
  LogOut,
  ChevronRight,
  Zap,
  Calendar,
  IndianRupee,
  Camera,
  Upload,
  Loader2
} from "lucide-react";
import { db, auth } from "../firebase";
import { collection, getDocs, query, where, orderBy, addDoc, serverTimestamp } from "firebase/firestore";
import toast from "react-hot-toast";

interface Goal {
  id: string;
  title: string;
  targetValue: number;
  currentValue: number;
  deadline: any;
  status: "Active" | "Achieved" | "Failed";
}

interface Reward {
  id: string;
  rewardAmount: number;
  description: string;
  awardedAt: any;
}

interface Employee {
  id: string;
  name: string;
  role: string;
  branch: string;
  email: string;
  ownerId: string;
}

export function EmployeePortalView({ simulatedEmployee }: { simulatedEmployee?: Employee }) {
  const [employee, setEmployee] = useState<Employee | null>(simulatedEmployee || null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<'performance' | 'schedule' | 'profile'>('performance');

  useEffect(() => {
    if (simulatedEmployee) {
      setEmployee(simulatedEmployee);
      fetchEmployeeData(simulatedEmployee.id);
    } else {
      findAndFetchEmployee();
    }
  }, [simulatedEmployee]);

  const findAndFetchEmployee = async () => {
    if (!auth.currentUser?.email) return;
    setIsLoading(true);
    try {
      let q = query(
        collection(db, "employees"), 
        where("email", "==", auth.currentUser.email)
      );

      // Check if simulated from hash router
      const hashStaffId = new URLSearchParams(window.location.hash.split('?')[1]).get('staff');
      if (hashStaffId) {
        q = query(collection(db, "employees")); // Fetch all to find the one, or just assume the one.
      }
      
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        let empData = { id: snap.docs[0].id, ...snap.docs[0].data() } as Employee;
        
        if (hashStaffId) {
           const found = snap.docs.find(d => d.id === hashStaffId);
           if (found) empData = { id: found.id, ...found.data() } as Employee;
        }

        setEmployee(empData);
        fetchEmployeeData(empData.id);
      } else {
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error finding employee:", error);
      setIsLoading(false);
    }
  };

  const fetchEmployeeData = async (empId: string) => {
    if (!auth.currentUser) return;
    setIsLoading(true);
    try {
      const [goalSnap, rewardSnap] = await Promise.all([
        getDocs(query(collection(db, "goals"), where("ownerId", "==", auth.currentUser.uid), where("employeeId", "==", empId))),
        getDocs(query(collection(db, "rewards"), where("ownerId", "==", auth.currentUser.uid), where("employeeId", "==", empId), orderBy("awardedAt", "desc")))
      ]);

      setGoals(goalSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Goal[]);
      setRewards(rewardSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Reward[]);
    } catch (error) {
      console.error("Error fetching employee data:", error);
      toast.error("Failed to load your dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  const calculateProgress = (goal: Goal) => {
    return Math.min(Math.round((goal.currentValue / goal.targetValue) * 100), 100);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !employee || !auth.currentUser) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);
    
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        setUploadProgress(50);
        const base64Image = reader.result as string;
        
        await addDoc(collection(db, "employee_communications"), {
          employeeId: employee.id,
          employeeName: employee.name,
          employeeRole: employee.role,
          ownerId: employee.ownerId,
          imageUrl: base64Image,
          timestamp: serverTimestamp(),
          status: "unread",
          message: "Photo uploaded from mobile portal"
        });
        
        setUploadProgress(100);
        setTimeout(() => setIsUploading(false), 500);
        setUploadProgress(0);
        toast.success("Photo sent to admin successfully!");
        if (fileInputRef.current) fileInputRef.current.value = "";
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error uploading photo:", error);
      toast.error("Failed to upload photo");
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-[var(--accent)] border-t-transparent animate-spin"></div>
        <p className="font-bold text-[var(--text-muted)]">Loading your performance portal...</p>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <div className="w-20 h-20 neu-pressed rounded-3xl flex items-center justify-center text-[var(--text-muted)] mb-6">
           <User className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-black mb-2">No Employee Profile Found</h2>
        <p className="text-sm neu-text-muted max-w-xs mb-8">
          This portal is for staff members. If you are an admin, you can manage the team from the Staff view.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6 pb-20">
      {/* Header Profile */}
      <div className="neu-flat rounded-3xl p-6 bg-gradient-to-br from-[var(--bg-color)] to-[var(--accent)]/5">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl neu-pressed flex items-center justify-center font-black text-2xl text-[var(--accent)]">
            {employee.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-black">{employee.name}</h1>
            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">{employee.role}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 neu-pressed rounded-2xl">
            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">Branch</p>
            <div className="flex items-center gap-2 font-bold text-sm">
              <Building className="w-3.5 h-3.5 text-[var(--accent)]" />
              {employee.branch}
            </div>
          </div>
          <div className="p-3 neu-pressed rounded-2xl">
            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">Joined</p>
            <div className="flex items-center gap-2 font-bold text-sm">
              <Calendar className="w-3.5 h-3.5 text-[var(--accent)]" />
              {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </div>
          </div>
        </div>
      </div>

      {/* Rewards Bar */}
      <div className="neu-flat rounded-3xl p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
            <Award className="w-5 h-5 fill-current" />
          </div>
          <div>
            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase">Total Earned</p>
            <p className="text-xl font-black">₹{rewards.reduce((acc, r) => acc + r.rewardAmount, 0).toLocaleString()}</p>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-bold text-green-500 mb-1">Top 5% Performer</span>
          <div className="flex gap-1">
            {[1,2,3,4,5].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-orange-500" />)}
          </div>
        </div>
      </div>

      {activeTab === 'performance' && (
        <motion.div initial={{opacity:0}} animate={{opacity:1}} className="space-y-6">
          {/* Active Targets */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="font-black text-lg">Your Targets</h3>
              <span className="text-xs font-bold text-[var(--accent)] cursor-pointer">View All</span>
            </div>

            {goals.length === 0 ? (
              <div className="py-12 text-center">
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center border-2 border-dashed border-black/10 dark:border-white/10">
                    <Target className="w-8 h-8 text-[var(--text-muted)]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[var(--text-main)]">No active targets</h4>
                    <p className="text-xs text-[var(--text-muted)] mt-1 max-w-sm mx-auto">
                      There are no active targets assigned to you at the moment. Take a break! ☕
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              goals.map(goal => (
                <div key={goal.id} className="neu-flat rounded-3xl p-5 space-y-4 relative overflow-hidden group">
                  {goal.status === "Achieved" && (
                    <div className="absolute top-0 right-0 p-1.5 bg-green-500 text-white rounded-bl-xl">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  )}
                  
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-base leading-tight mb-1">{goal.title}</h4>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-[var(--text-muted)]">
                        <Clock className="w-3 h-3" />
                        Expires: {goal.deadline?.toDate() ? goal.deadline.toDate().toLocaleDateString() : 'Dec 31'}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black text-[var(--accent)]">{calculateProgress(goal)}%</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="h-2.5 w-full neu-pressed rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${calculateProgress(goal)}%` }}
                        className={`h-full rounded-full ${
                          goal.status === "Achieved" ? "bg-green-500" : "bg-[var(--accent)]"
                        }`}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] font-bold text-[var(--text-muted)]">
                      <span>₹{goal.currentValue.toLocaleString()} reached</span>
                      <span>Target: ₹{goal.targetValue.toLocaleString()}</span>
                    </div>
                  </div>

                  {goal.status === "Achieved" && (
                    <div className="pt-2 flex items-center gap-2 text-xs font-bold text-green-500">
                      <Zap className="w-3 h-3 fill-current" />
                      Performance Reward Pending Approval
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Recent Activity / Rewards */}
          <div className="space-y-4 pt-2">
            <h3 className="font-black text-lg px-2">Recent Payouts</h3>
            <div className="space-y-3">
              {rewards.slice(0,3).map(reward => (
                <div key={reward.id} className="neu-flat rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 neu-pressed rounded-xl flex items-center justify-center text-[var(--accent)]">
                        <IndianRupee className="w-5 h-5" />
                     </div>
                     <div>
                        <p className="font-bold text-sm">₹{reward.rewardAmount.toLocaleString()}</p>
                        <p className="text-[10px] text-[var(--text-muted)] font-medium">{reward.description}</p>
                     </div>
                  </div>
                  <p className="text-[10px] font-bold text-[var(--text-muted)]">
                    {reward.awardedAt?.toDate() ? reward.awardedAt.toDate().toLocaleDateString() : 'Just now'}
                  </p>
                </div>
              ))}
              {rewards.length === 0 && (
                 <div className="neu-flat rounded-2xl p-6 text-center">
                   <p className="text-xs font-bold text-[var(--text-muted)]">No rewards yet. Keep pushing!</p>
                 </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'schedule' && (
        <motion.div initial={{opacity:0}} animate={{opacity:1}} className="neu-flat rounded-3xl p-8 text-center space-y-4">
           <Calendar className="w-12 h-12 mx-auto text-[var(--text-muted)]" />
           <div>
             <h3 className="font-bold text-lg">Your Schedule</h3>
             <p className="text-sm text-[var(--text-muted)] mt-1">Schedules are currently managed offline by your manager. They will appear here when digitized.</p>
           </div>
        </motion.div>
      )}

      {activeTab === 'profile' && (
        <motion.div initial={{opacity:0}} animate={{opacity:1}} className="neu-flat rounded-3xl p-8 text-center space-y-4">
           <User className="w-12 h-12 mx-auto text-[var(--text-muted)]" />
           <div>
             <h3 className="font-bold text-lg">Profile Details</h3>
             <p className="text-sm text-[var(--text-muted)] mt-1">Email: {employee.email}<br/>Branch: {employee.branch}</p>
           </div>
           <button onClick={() => { auth.signOut(); window.location.reload(); }} className="w-full mt-4 py-3 neu-pressed rounded-xl text-red-500 font-bold flex items-center justify-center gap-2">
             <LogOut className="w-4 h-4" /> Sign Out
           </button>
        </motion.div>
      )}

      {/* Hidden file input for camera */}
      <input 
        type="file" 
        accept="image/*" 
        capture="environment" 
        className="hidden" 
        id="camera-upload" 
        ref={fileInputRef}
        onChange={handlePhotoUpload} 
      />

      {/* Bottom Nav for mobile feel */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-[var(--bg-color)]/90 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl p-3 flex justify-around items-center z-[50]">
          <button 
             className={`p-3 rounded-2xl transition-colors ${activeTab === 'performance' ? 'text-[var(--accent)] bg-[var(--accent)]/10' : 'text-[var(--text-muted)]'}`} 
             onClick={() => { setActiveTab('performance'); window.scrollTo({top: 0, behavior: 'smooth'}); }}
          >
            <TrendingUp className="w-6 h-6" />
          </button>
          
          <button 
             className="p-3 text-white bg-[var(--accent)] rounded-2xl shadow-lg relative overflow-hidden disabled:opacity-70"
             onClick={() => fileInputRef.current?.click()}
             disabled={isUploading}
          >
            {isUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Camera className="w-6 h-6" />}
            {isUploading && (
               <div className="absolute bottom-0 left-0 h-1 bg-white/30 transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
            )}
          </button>
          
          <button 
             className={`p-3 rounded-2xl transition-colors ${activeTab === 'schedule' ? 'text-[var(--accent)] bg-[var(--accent)]/10' : 'text-[var(--text-muted)]'}`}
             onClick={() => setActiveTab('schedule')}
          >
            <Calendar className="w-6 h-6" />
          </button>
          
          <button 
             className={`p-3 rounded-2xl transition-colors ${activeTab === 'profile' ? 'text-[var(--accent)] bg-[var(--accent)]/10' : 'text-[var(--text-muted)]'}`}
             onClick={() => setActiveTab('profile')}
          >
            <User className="w-6 h-6" />
          </button>
      </div>
    </div>
  );
}

